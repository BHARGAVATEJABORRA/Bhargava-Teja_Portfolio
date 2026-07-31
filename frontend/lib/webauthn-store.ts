/**
 * Passkey (WebAuthn) credential store — Turso/SQLite backed.
 *
 * Persisted in the content database via raw SQL with a lazy CREATE TABLE (same
 * convention as the Like table in lib/likes-store.ts), so a registered passkey
 * survives serverless cold starts on Vercel and works on the local SQLite file
 * without a migration step.
 *
 * Single-admin: every credential in this table belongs to the site owner, and
 * registration is gated behind an authenticated admin session (passcode
 * bootstrap) in the register routes — so an attacker can never enroll one.
 *
 * Node runtime only.
 */

import { prisma } from "@/lib/db";

export type StoredCredential = {
  /** base64url credential ID */
  id: string;
  /** base64url-encoded COSE public key */
  publicKey: string;
  counter: number;
  transports?: string[];
  createdAt: string;
};

let tableReady: Promise<void> | null = null;

function ensureTable(): Promise<void> {
  tableReady ??= (async () => {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "WebauthnCredential" (
        "id"         TEXT PRIMARY KEY,
        "publicKey"  TEXT NOT NULL,
        "counter"    INTEGER NOT NULL DEFAULT 0,
        "transports" TEXT,
        "createdAt"  TEXT NOT NULL
      )
    `);
  })().catch((err) => {
    tableReady = null; // allow a retry on the next request
    throw err;
  });
  return tableReady;
}

function rowToCredential(row: {
  id: string;
  publicKey: string;
  counter: number | bigint;
  transports: string | null;
  createdAt: string;
}): StoredCredential {
  let transports: string[] | undefined;
  if (row.transports) {
    try {
      const parsed = JSON.parse(row.transports) as unknown;
      if (Array.isArray(parsed)) transports = parsed.filter((t): t is string => typeof t === "string");
    } catch {
      transports = undefined;
    }
  }
  return {
    id: row.id,
    publicKey: row.publicKey,
    counter: Number(row.counter),
    ...(transports ? { transports } : {}),
    createdAt: row.createdAt,
  };
}

export async function getCredentials(): Promise<StoredCredential[]> {
  try {
    await ensureTable();
    const rows = await prisma.$queryRaw<
      { id: string; publicKey: string; counter: number | bigint; transports: string | null; createdAt: string }[]
    >`SELECT "id", "publicKey", "counter", "transports", "createdAt" FROM "WebauthnCredential" ORDER BY "createdAt" ASC`;
    return rows.map(rowToCredential);
  } catch (err) {
    console.warn("[webauthn] getCredentials failed:", err);
    return [];
  }
}

export async function getCredentialById(id: string): Promise<StoredCredential | undefined> {
  try {
    await ensureTable();
    const rows = await prisma.$queryRaw<
      { id: string; publicKey: string; counter: number | bigint; transports: string | null; createdAt: string }[]
    >`SELECT "id", "publicKey", "counter", "transports", "createdAt" FROM "WebauthnCredential" WHERE "id" = ${id} LIMIT 1`;
    return rows[0] ? rowToCredential(rows[0]) : undefined;
  } catch (err) {
    console.warn("[webauthn] getCredentialById failed:", err);
    return undefined;
  }
}

export async function hasCredential(): Promise<boolean> {
  return (await countCredentials()) > 0;
}

export async function countCredentials(): Promise<number> {
  try {
    await ensureTable();
    const rows = await prisma.$queryRaw<{ c: number | bigint }[]>`SELECT COUNT(*) c FROM "WebauthnCredential"`;
    return Number(rows[0]?.c ?? 0);
  } catch (err) {
    console.warn("[webauthn] countCredentials failed:", err);
    return 0;
  }
}

export async function saveCredential(credential: StoredCredential): Promise<void> {
  await ensureTable();
  const transports = credential.transports ? JSON.stringify(credential.transports) : null;
  await prisma.$executeRaw`
    INSERT INTO "WebauthnCredential" ("id", "publicKey", "counter", "transports", "createdAt")
    VALUES (${credential.id}, ${credential.publicKey}, ${credential.counter}, ${transports}, ${credential.createdAt})
    ON CONFLICT("id") DO UPDATE SET
      "publicKey"  = excluded."publicKey",
      "counter"    = excluded."counter",
      "transports" = excluded."transports"
  `;
}

export async function updateCredentialCounter(id: string, counter: number): Promise<void> {
  await ensureTable();
  await prisma.$executeRaw`UPDATE "WebauthnCredential" SET "counter" = ${counter} WHERE "id" = ${id}`;
}

/** Remove a single passkey by id (admin "forget this device"). */
export async function deleteCredential(id: string): Promise<void> {
  await ensureTable();
  await prisma.$executeRaw`DELETE FROM "WebauthnCredential" WHERE "id" = ${id}`;
}

// base64url <-> Uint8Array helpers (Node runtime).
export function bytesToBase64url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64url");
}

export function base64urlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const buf = Buffer.from(value, "base64url");
  const bytes = new Uint8Array(buf.length);
  bytes.set(buf);
  return bytes;
}
