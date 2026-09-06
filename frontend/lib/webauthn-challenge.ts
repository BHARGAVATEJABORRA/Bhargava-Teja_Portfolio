import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";

export type ChallengePurpose = "authenticate" | "register";
export const CHALLENGE_TTL_MS = 300_000;
let ready: Promise<void> | null = null;

async function ensureTable() {
  ready ??= (async () => {
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "WebauthnChallenge" (
      "id" TEXT PRIMARY KEY, "challenge" TEXT NOT NULL, "purpose" TEXT NOT NULL,
      "binding" TEXT NOT NULL, "expiresAt" BIGINT NOT NULL
    )`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "WebauthnChallenge_expiry" ON "WebauthnChallenge" ("expiresAt")`);
  })().catch((error) => { ready = null; throw error; });
  await ready;
}

const hash = (value: string) => createHash("sha256").update(value).digest("hex");

export function challengeCookie(purpose: ChallengePurpose) {
  return `${process.env.NODE_ENV === "production" ? "__Host-" : ""}webauthn_${purpose}`;
}

export const challengeCookieOptions = () => ({
  httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production",
  path: "/", maxAge: CHALLENGE_TTL_MS / 1000,
});

export async function issueChallenge(challenge: string, purpose: ChallengePurpose, binding = ""): Promise<string> {
  await ensureTable();
  const now = Date.now();
  await prisma.$executeRaw`DELETE FROM "WebauthnChallenge" WHERE "expiresAt" <= ${now}`;
  const nonce = randomBytes(32).toString("base64url");
  await prisma.$executeRaw`INSERT INTO "WebauthnChallenge" ("id","challenge","purpose","binding","expiresAt")
    VALUES (${hash(nonce)}, ${challenge}, ${purpose}, ${hash(binding)}, ${now + CHALLENGE_TTL_MS})`;
  return nonce;
}

/** DELETE RETURNING consumes the challenge atomically, including failed attempts. */
export async function consumeChallenge(nonce: string | undefined, purpose: ChallengePurpose, binding = ""): Promise<string | null> {
  if (!nonce || !/^[A-Za-z0-9_-]{43}$/.test(nonce)) return null;
  await ensureTable();
  const rows = await prisma.$queryRaw<Array<{ challenge: string; expiresAt: string }>>`
    DELETE FROM "WebauthnChallenge"
    WHERE "id" = ${hash(nonce)} AND "purpose" = ${purpose} AND "binding" = ${hash(binding)}
    RETURNING "challenge", CAST("expiresAt" AS TEXT) AS "expiresAt"`;
  const row = rows[0];
  return row && Number(row.expiresAt) > Date.now() ? row.challenge : null;
}
