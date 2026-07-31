import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";

import { seedAll } from "@/lib/seed-content";

/**
 * Storage backends, in order of preference:
 *
 * 1. Turso/libSQL — set TURSO_DATABASE_URL (+ TURSO_AUTH_TOKEN) and every
 *    environment shares one durable database. This is what production
 *    (Vercel) should use: admin edits persist across deploys and cold starts.
 * 2. Local SQLite file — DATABASE_URL=file:./prisma/dev.db for dev, managed
 *    with `prisma migrate dev` / `db:seed`.
 * 3. Legacy /tmp fallback — only if the app runs on Vercel *without* Turso
 *    vars. Ephemeral per-lambda; kept so a misconfigured deploy degrades to
 *    read-only defaults instead of crashing outright.
 */
const tursoUrl = process.env.TURSO_DATABASE_URL?.trim() || "";
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN?.trim() || "";
const useTurso = Boolean(tursoUrl);

const dbPath = process.env.VERCEL
  ? "/tmp/dev.db"
  : process.env.DATABASE_URL?.replace("file:", "") ?? "./prisma/dev.db";

const datasourceUrl = process.env.VERCEL
  ? "file:/tmp/dev.db"
  : process.env.DATABASE_URL ?? `file:${dbPath}`;

function createBaseClient(): PrismaClient {
  if (useTurso) {
    const adapter = new PrismaLibSQL({
      url: tursoUrl,
      ...(tursoAuthToken ? { authToken: tursoAuthToken } : {}),
    });
    return new PrismaClient({ adapter });
  }
  if (process.env.VERCEL) {
    console.warn(
      "[db] TURSO_DATABASE_URL is not set — falling back to ephemeral /tmp SQLite. Admin edits will NOT persist.",
    );
  }
  return new PrismaClient({ datasourceUrl });
}

/** Apply committed Prisma migration SQL to a fresh (lib)SQL database. */
async function applyMigrations(client: PrismaClient): Promise<void> {
  const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
  if (!existsSync(migrationsDir)) return;

  const migrationDirs = readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const dir of migrationDirs) {
    const sqlFile = path.join(migrationsDir, dir, "migration.sql");
    if (!existsSync(sqlFile)) continue;
    const sql = readFileSync(sqlFile, "utf8");
    // Prisma-generated SQLite DDL: statements are ";"-terminated, no bodies
    // with embedded semicolons, so a simple split is safe here.
    const statements = sql
      .split(/;\s*(?:\r?\n|$)/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.split("\n").every((line) => line.trim().startsWith("--")));
    for (const statement of statements) {
      await client.$executeRawUnsafe(statement);
    }
  }
}

async function tableExists(client: PrismaClient, table: string): Promise<boolean> {
  try {
    const rows = await client.$queryRawUnsafe<Array<{ name: string }>>(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`,
    );
    return rows.length > 0;
  } catch {
    return false;
  }
}

/**
 * Ensure schema + seed data exist. For Turso this bootstraps a brand-new
 * database exactly once (migrations run only if the schema is missing, seeds
 * only if the Project table is empty); afterwards it's a cheap no-op check.
 * For the legacy /tmp fallback it rebuilds the DB on every cold start.
 */
async function initDatabase(client: PrismaClient): Promise<void> {
  try {
    if (!(await tableExists(client, "Project"))) {
      await applyMigrations(client);
      console.log("[db] applied migrations to fresh database");
    }
    const projectCount = await client.project.count().catch(() => 0);
    if (projectCount === 0) {
      await seedAll(client);
      console.log("[db] auto-seeded database from static defaults");
    }
  } catch (err) {
    console.error("[db] auto-init failed:", err);
  }
}

function createClient() {
  const base = createBaseClient();

  // Locally the DB is managed with `prisma migrate dev` / `db:seed`; Turso and
  // the ephemeral Vercel fallback bootstrap themselves via the lazy auto-init.
  if (!process.env.VERCEL && !useTurso) return base;

  let initPromise: Promise<void> | null = null;
  const ensureInit = () => {
    initPromise ??= initDatabase(base);
    return initPromise;
  };

  // Gate every query behind the one-time init so any route hitting a cold
  // lambda transparently bootstraps the schema + seed data first.
  return base.$extends({
    query: {
      async $allOperations({ args, query }) {
        await ensureInit();
        return query(args);
      },
    },
  }) as unknown as PrismaClient;
}

// Reuse one client across HMR reloads in dev to avoid exhausting connections.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
