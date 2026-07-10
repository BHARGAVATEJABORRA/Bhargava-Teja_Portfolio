/**
 * File-based passkey credential store (single-admin).
 *
 * Persists to <project>/.data/webauthn.json. This is intended for local dev and
 * single-instance Node hosting. It is NOT used on the static GitHub Pages export
 * (API routes are stripped there). For multi-instance/serverless, swap this for
 * a real database. Node runtime only.
 */

import { promises as fs } from "node:fs";
import path from "node:path";

export type StoredCredential = {
  /** base64url credential ID */
  id: string;
  /** base64url-encoded COSE public key */
  publicKey: string;
  counter: number;
  transports?: string[];
  createdAt: string;
};

// Vercel's filesystem is read-only except /tmp; credentials there are ephemeral
// (re-register after a cold start), but the passcode fallback always works.
const DATA_DIR = process.env.VERCEL ? "/tmp/.data" : path.join(process.cwd(), ".data");
const STORE_FILE = path.join(DATA_DIR, "webauthn.json");

type StoreShape = { credentials: StoredCredential[] };

async function readStore(): Promise<StoreShape> {
  try {
    const raw = await fs.readFile(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw) as StoreShape;
    if (!parsed || !Array.isArray(parsed.credentials)) return { credentials: [] };
    return parsed;
  } catch {
    return { credentials: [] };
  }
}

async function writeStore(store: StoreShape): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}

export async function getCredentials(): Promise<StoredCredential[]> {
  return (await readStore()).credentials;
}

export async function getCredentialById(id: string): Promise<StoredCredential | undefined> {
  return (await readStore()).credentials.find((c) => c.id === id);
}

export async function hasCredential(): Promise<boolean> {
  return (await readStore()).credentials.length > 0;
}

export async function saveCredential(credential: StoredCredential): Promise<void> {
  const store = await readStore();
  const existing = store.credentials.findIndex((c) => c.id === credential.id);
  if (existing >= 0) {
    store.credentials[existing] = credential;
  } else {
    store.credentials.push(credential);
  }
  await writeStore(store);
}

export async function updateCredentialCounter(id: string, counter: number): Promise<void> {
  const store = await readStore();
  const cred = store.credentials.find((c) => c.id === id);
  if (cred) {
    cred.counter = counter;
    await writeStore(store);
  }
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
