/**
 * Durable, Turso/SQLite-backed rate limiting and login lockout.
 *
 * In-memory Maps don't work on serverless (every lambda instance has its own,
 * and they reset on cold start), so anything security- or cost-sensitive uses
 * this shared table instead. Same lazy CREATE TABLE convention as the Like
 * table, so it bootstraps on both Turso and the local SQLite file.
 *
 * Node runtime only.
 */

import { prisma } from "@/lib/db";

let tableReady: Promise<void> | null = null;

function ensureTable(): Promise<void> {
  tableReady ??= (async () => {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "RateHit" (
        "bucket" TEXT NOT NULL,
        "ts"     INTEGER NOT NULL,
        "ok"     INTEGER NOT NULL DEFAULT 1
      )
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "RateHit_bucket_ts" ON "RateHit" ("bucket","ts")`);
  })().catch((err) => {
    tableReady = null;
    throw err;
  });
  return tableReady;
}

/** Best-effort cleanup of rows older than the widest window we care about. */
async function prune(bucket: string, olderThan: number): Promise<void> {
  await prisma.$executeRaw`DELETE FROM "RateHit" WHERE "bucket" = ${bucket} AND "ts" < ${olderThan}`;
}

export interface RateResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Sliding-window rate limit. Records this hit and returns whether the caller is
 * within `limit` requests per `windowMs`. Fails open (allows) on DB error so a
 * transient Turso blip never takes down a public endpoint.
 */
export async function rateLimit(
  bucket: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): Promise<RateResult> {
  const now = Date.now();
  const windowStart = now - windowMs;
  try {
    await ensureTable();
    await prune(bucket, windowStart);
    const rows = await prisma.$queryRaw<{ c: number | bigint; oldest: number | bigint | null }[]>`
      SELECT COUNT(*) c, MIN("ts") oldest FROM "RateHit" WHERE "bucket" = ${bucket} AND "ts" >= ${windowStart}
    `;
    const count = Number(rows[0]?.c ?? 0);
    if (count >= limit) {
      const oldest = Number(rows[0]?.oldest ?? now);
      const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
      return { allowed: false, remaining: 0, retryAfterSeconds };
    }
    await prisma.$executeRaw`INSERT INTO "RateHit" ("bucket","ts","ok") VALUES (${bucket}, ${now}, 1)`;
    return { allowed: true, remaining: Math.max(0, limit - count - 1), retryAfterSeconds: 0 };
  } catch (err) {
    console.warn("[rate-limit] rateLimit failed (allowing):", err);
    return { allowed: true, remaining: limit, retryAfterSeconds: 0 };
  }
}

// ---------------------------------------------------------------------------
// Login lockout — escalating backoff after repeated passcode failures.
//
// There is exactly one legitimate admin, so failures are tracked globally
// (defeating IP-rotating brute force) as well as per-IP. Failed attempts are
// rows with ok=0; a successful login clears them.
// ---------------------------------------------------------------------------

const LOCK_LOOKBACK_MS = 30 * 60 * 1000; // count failures within the last 30 min
const LOCK_THRESHOLD = 5; // lock once this many recent failures accrue

/** Escalating lock duration (ms) once past the threshold. Caps at 30 min. */
function lockDurationMs(failures: number): number {
  const over = failures - LOCK_THRESHOLD; // 0 at the threshold
  const ladder = [60_000, 2 * 60_000, 5 * 60_000, 15 * 60_000, 30 * 60_000];
  return ladder[Math.min(over, ladder.length - 1)];
}

export interface LockStatus {
  locked: boolean;
  retryAfterSeconds: number;
  failures: number;
}

async function failureState(bucket: string): Promise<{ failures: number; last: number }> {
  const since = Date.now() - LOCK_LOOKBACK_MS;
  const rows = await prisma.$queryRaw<{ c: number | bigint; last: number | bigint | null }[]>`
    SELECT COUNT(*) c, MAX("ts") last FROM "RateHit"
    WHERE "bucket" = ${bucket} AND "ok" = 0 AND "ts" >= ${since}
  `;
  return { failures: Number(rows[0]?.c ?? 0), last: Number(rows[0]?.last ?? 0) };
}

/**
 * Is login currently locked? Checks a global bucket and a per-IP bucket; the
 * stricter of the two wins. Unlike public rate limits, login fails closed on
 * DB errors so an outage cannot silently remove brute-force protection.
 */
export async function loginLockStatus(ip: string): Promise<LockStatus> {
  try {
    await ensureTable();
    const now = Date.now();
    const buckets = ["login:global", `login:ip:${ip}`];
    let worst: LockStatus = { locked: false, retryAfterSeconds: 0, failures: 0 };
    for (const bucket of buckets) {
      const { failures, last } = await failureState(bucket);
      if (failures < LOCK_THRESHOLD) continue;
      const unlockAt = last + lockDurationMs(failures);
      if (unlockAt > now) {
        const retryAfterSeconds = Math.ceil((unlockAt - now) / 1000);
        if (retryAfterSeconds > worst.retryAfterSeconds) {
          worst = { locked: true, retryAfterSeconds, failures };
        }
      }
    }
    return worst;
  } catch (err) {
    console.error("[rate-limit] loginLockStatus failed (denying):", err);
    return { locked: true, retryAfterSeconds: 60, failures: 0 };
  }
}

export async function recordLoginFailure(ip: string): Promise<void> {
  try {
    await ensureTable();
    const now = Date.now();
    await prisma.$executeRaw`INSERT INTO "RateHit" ("bucket","ts","ok") VALUES ('login:global', ${now}, 0)`;
    await prisma.$executeRaw`INSERT INTO "RateHit" ("bucket","ts","ok") VALUES (${`login:ip:${ip}`}, ${now}, 0)`;
  } catch (err) {
    console.warn("[rate-limit] recordLoginFailure failed:", err);
  }
}

export async function clearLoginFailures(ip: string): Promise<void> {
  try {
    await ensureTable();
    await prisma.$executeRaw`DELETE FROM "RateHit" WHERE "bucket" = 'login:global' AND "ok" = 0`;
    await prisma.$executeRaw`DELETE FROM "RateHit" WHERE "bucket" = ${`login:ip:${ip}`} AND "ok" = 0`;
  } catch (err) {
    console.warn("[rate-limit] clearLoginFailures failed:", err);
  }
}

/** Extract a best-effort client IP from proxy headers. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}
