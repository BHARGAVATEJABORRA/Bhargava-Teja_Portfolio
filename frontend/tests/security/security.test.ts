import assert from "node:assert/strict";
import { createHash, generateKeyPairSync, randomBytes, sign } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { mutationOriginAllowed, readJsonObject, RequestError } from "../../lib/request-security";
import { contentSecurityPolicy } from "../../lib/security-headers";

test("request firewall rejects cross-origin and oversized/malformed bodies", async () => {
  const request = (body: string, extra: Record<string, string> = {}) => new Request("https://portfolio.test/api/contact", {
    method: "POST", headers: { "content-type": "application/json", origin: "https://portfolio.test", ...extra }, body,
  });
  assert.equal(mutationOriginAllowed(request("{}")), true);
  assert.equal(mutationOriginAllowed(request("{}", { origin: "https://evil.test" })), false);
  assert.equal(mutationOriginAllowed(request("{}", { "sec-fetch-site": "same-site" })), false);
  assert.equal(mutationOriginAllowed(request("{}", { origin: "null" })), false);
  await assert.rejects(readJsonObject(request("null")), RequestError);
  await assert.rejects(readJsonObject(request("[]")), RequestError);
  await assert.rejects(readJsonObject(request('{"message":"' + "x".repeat(500) + '"}'), 128), (error: unknown) => error instanceof RequestError && error.status === 413);
  await assert.rejects(readJsonObject(request("{}", { "content-type": "text/plain" })), (error: unknown) => error instanceof RequestError && error.status === 415);
  // No Content-Length: enforce actual streamed bytes, not a trusted header.
  const streamed = new Request("https://portfolio.test/api/contact", {
    method: "POST", headers: { "content-type": "application/json" },
    body: new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(256)); controller.close(); } }),
    duplex: "half",
  } as RequestInit);
  await assert.rejects(readJsonObject(streamed, 128), (error: unknown) => error instanceof RequestError && error.status === 413);
});

test("production CSP requires a nonce and prevents framing, objects and external form posts", () => {
  const policy = contentSecurityPolicy("test-nonce");
  assert.match(policy, /script-src 'self' 'nonce-test-nonce' 'strict-dynamic';/);
  assert.doesNotMatch(policy, /unsafe-eval/);
  assert.match(policy, /form-action 'self'/);
  assert.match(policy, /frame-ancestors 'none'/);
  assert.match(policy, /object-src 'none'/);
});

test("durable authentication and abuse controls (isolated temporary database)", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "portfolio-security-"));
  Object.assign(process.env, {
    NODE_ENV: "test", VERCEL: "", TURSO_DATABASE_URL: process.env.SECURITY_LIBSQL === "1" ? `file:${path.join(directory, "security.db")}` : "", TURSO_AUTH_TOKEN: "",
    DATABASE_URL: `file:${path.join(directory, "security.db")}`,
    ADMIN_SESSION_SECRET: randomBytes(32).toString("hex"),
    WEBAUTHN_RP_ORIGIN: "http://localhost:3000", WEBAUTHN_RP_ID: "localhost",
  });
  const { prisma } = await import("../../lib/db");
  const { issueChallenge, consumeChallenge, challengeCookie } = await import("../../lib/webauthn-challenge");
  const { rateLimit, clientIp } = await import("../../lib/rate-limit");
  const { saveCredential } = await import("../../lib/webauthn-store");
  const { POST: authenticate } = await import("../../app/api/auth/webauthn/authenticate/verify/route");
  const { createSessionToken, verifySessionToken } = await import("../../lib/admin-session");
  try {
    await t.test("challenges expire, are purpose/session-bound, and consume exactly once under concurrency", async () => {
      const nonce = await issueChallenge("challenge", "register", "admin-session");
      assert.equal(await consumeChallenge(nonce, "authenticate"), null);
      assert.equal(await consumeChallenge(nonce, "register", "wrong-session"), null);
      const results = await Promise.all(Array.from({ length: 12 }, () => consumeChallenge(nonce, "register", "admin-session")));
      assert.equal(results.filter((result) => result === "challenge").length, 1);
      const expired = await issueChallenge("expired", "authenticate");
      await prisma.$executeRaw`UPDATE "WebauthnChallenge" SET "expiresAt" = 0`;
      assert.equal(await consumeChallenge(expired, "authenticate"), null);
      assert.equal(await consumeChallenge("attacker-selected-challenge", "authenticate"), null);
    });

    await t.test("a real signed zero-counter passkey response succeeds once and cannot be replayed", async () => {
      const { privateKey, publicKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
      const jwk = publicKey.export({ format: "jwk" });
      const cose = Buffer.concat([
        Buffer.from([0xa5, 0x01, 0x02, 0x03, 0x26, 0x20, 0x01, 0x21, 0x58, 0x20]),
        Buffer.from(jwk.x!, "base64url"), Buffer.from([0x22, 0x58, 0x20]), Buffer.from(jwk.y!, "base64url"),
      ]);
      const id = randomBytes(32).toString("base64url");
      await saveCredential({ id, publicKey: cose.toString("base64url"), counter: 0, createdAt: new Date().toISOString() });
      const challenge = randomBytes(32).toString("base64url");
      const clientData = Buffer.from(JSON.stringify({ type: "webauthn.get", challenge, origin: "http://localhost:3000" }));
      const authenticatorData = Buffer.concat([createHash("sha256").update("localhost").digest(), Buffer.from([0x05, 0, 0, 0, 0])]);
      const signature = sign("sha256", Buffer.concat([authenticatorData, createHash("sha256").update(clientData).digest()]), privateKey);
      const response = {
        id, rawId: id, type: "public-key" as const, clientExtensionResults: {},
        response: { clientDataJSON: clientData.toString("base64url"), authenticatorData: authenticatorData.toString("base64url"), signature: signature.toString("base64url") },
      };
      // Reproduce the legacy weakness without any real user's credential.
      const legacyInput = { response, expectedChallenge: challenge, expectedOrigin: "http://localhost:3000", expectedRPID: "localhost", requireUserVerification: true, credential: { id, publicKey: new Uint8Array(cose), counter: 0 } };
      assert.equal((await verifyAuthenticationResponse(legacyInput)).verified, true);
      assert.equal((await verifyAuthenticationResponse(legacyInput)).verified, true);
      const request = (nonce: string) => new NextRequest("http://localhost:3000/api/auth/webauthn/authenticate/verify", {
        method: "POST", headers: { "content-type": "application/json", cookie: `${challengeCookie("authenticate")}=${nonce}` }, body: JSON.stringify(response),
      });
      assert.equal((await authenticate(request(challenge))).status, 400);
      const nonce = await issueChallenge(challenge, "authenticate");
      const success = await authenticate(request(nonce));
      assert.equal(success.status, 200);
      assert.match(success.headers.get("set-cookie") ?? "", /admin_session=/);
      assert.equal((await authenticate(request(nonce))).status, 400);
      const differentChallenge = await issueChallenge("new-challenge", "authenticate");
      assert.equal((await authenticate(request(differentChallenge))).status, 400);
      assert.equal(await consumeChallenge(differentChallenge, "authenticate"), null);
    });

    await t.test("parallel requests cannot exceed the configured limit", async () => {
      const results = await Promise.all(Array.from({ length: 50 }, () => rateLimit("concurrency", { limit: 7, windowMs: 60_000 })));
      assert.equal(results.filter((result) => result.allowed).length, 7);
      assert.equal(results.filter((result) => !result.allowed).length, 43);
    });

    await t.test("self-hosted clients cannot invent IP buckets by forging headers", () => {
      process.env.TRUST_PROXY_HEADERS = "0";
      const req = new Request("http://localhost", { headers: { "x-forwarded-for": "203.0.113.5" } });
      assert.equal(clientIp(req), "unknown");
      process.env.TRUST_PROXY_HEADERS = "1";
      assert.equal(clientIp(req), "203.0.113.5");
    });

    await t.test("signed sessions reject tampering and expiry", async () => {
      const token = await createSessionToken();
      assert.equal(await verifySessionToken(token), true);
      assert.equal(await verifySessionToken(token + "x"), false);
      assert.equal(await verifySessionToken(await createSessionToken(-1)), false);
    });

    await t.test("database failure denies public rate-limited work", async () => {
      await prisma.$executeRawUnsafe('DROP TABLE "RateHit"');
      assert.equal((await rateLimit("outage", { limit: 10, windowMs: 1000 })).allowed, false);
    });
  } finally {
    await prisma.$disconnect();
    await rm(directory, { recursive: true, force: true });
  }
});
