import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createClient } from "@libsql/client";

// Every write in this verification goes to a fresh local database. No production
// credentials are used and all outbound paid/email integrations are disabled.
const directory = await mkdtemp(path.join(os.tmpdir(), "portfolio-http-security-"));
const url = `file:${path.join(directory, "security.db")}`;
const port = Number(process.env.SECURITY_PORT || 3227);
const origin = `http://localhost:${port}`;
const passcode = randomBytes(24).toString("hex");
const env = {
  ...process.env, NODE_ENV: "production", VERCEL: "", TURSO_DATABASE_URL: url, TURSO_AUTH_TOKEN: "",
  DATABASE_URL: url, ADMIN_PASSCODE: passcode, ADMIN_SESSION_SECRET: randomBytes(32).toString("hex"),
  OPENAI_API_KEY: "", OPENWEATHER_API_KEY: "", CONTACT_WEBHOOK_URL: "", CONTACT_WEBHOOK_SECRET: "",
  RESEND_API_KEY: "", BLOB_READ_WRITE_TOKEN: "", SPOTIFY_CLIENT_ID: "", SPOTIFY_CLIENT_SECRET: "",
  SPOTIFY_REFRESH_TOKEN: "", NEXT_PUBLIC_SPOTIFY_ENDPOINT: "", TRUST_PROXY_HEADERS: "0",
};
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "localhost", "--port", String(port)], { env, stdio: ["ignore", "pipe", "pipe"] });
let logs = "";
server.stdout.on("data", (data) => { logs += data.toString(); });
server.stderr.on("data", (data) => { logs += data.toString(); });
const db = createClient({ url });
const request = (route, options = {}) => fetch(origin + route, { redirect: "manual", ...options });
const post = (route, body, headers = {}) => request(route, { method: "POST", headers: { "content-type": "application/json", origin, ...headers }, body: JSON.stringify(body) });
let checks = 0;
function status(response, expected, label) { assert.equal(response.status, expected, label); checks++; }

try {
  let ready = false;
  for (let attempt = 0; attempt < 120; attempt++) {
    if (server.exitCode !== null) throw new Error(`Server exited: ${logs}`);
    try { if ((await request("/")).ok) { ready = true; break; } } catch { /* starting */ }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert.ok(ready, "Production server started");
  const home = await request("/");
  const csp = home.headers.get("content-security-policy") ?? "";
  assert.match(csp, /script-src.*'nonce-/);
  assert.doesNotMatch(csp, /unsafe-eval/);
  assert.match(home.headers.get("cache-control") ?? "", /no-store/);
  const html = await home.text();
  const nonce = csp.match(/'nonce-([^']+)'/)?.[1];
  assert.ok(nonce && html.includes(`nonce="${nonce}"`), "Response policy matches rendered script nonce");
  checks += 4;
  status(await request("/admin"), 307, "Admin login gate");
  for (const route of ["config", "contacts", "media", "articles", "projects", "skills", "experiences", "passkeys", "ai-conversations", "history", "upload"]) {
    status(await request(`/api/admin/${route}`), 401, `Protected ${route}`);
  }
  status(await request("/api/admin/config", { headers: { "x-middleware-subrequest": "proxy:proxy:proxy:proxy:proxy" } }), 401, "Middleware bypass blocked");
  for (const route of ["/.env", "/.env.local", "/.git/config", "/frontend/.env", "/prisma/dev.db"]) {
    status(await request(route), 404, `Private file ${route}`);
  }
  status(await post("/api/auth/admin/passcode", { passcode }, { origin: "https://evil.test" }), 403, "Cross-site login denied");
  status(await post("/api/contact", {} , { "sec-fetch-site": "same-site" }), 403, "Sibling-site mutation denied");
  status(await post("/api/contact", null), 400, "Null JSON rejected");
  status(await post("/api/contact", { message: "x".repeat(40_000) }), 413, "Oversized body rejected");
  status(await post("/api/admin/upload/client", { type: "blob.generate-client-token", payload: {} }), 401, "Blob token requires admin");
  const forgedBlob = await post("/api/admin/upload/client", { type: "blob.upload-completed", payload: {} });
  assert.ok(forgedBlob.status >= 400, "Forged upload callback rejected"); checks++;
  status(await request("/api/spotify/artwork?url=" + encodeURIComponent("http://127.0.0.1/private")), 400, "Private-network artwork proxy blocked");
  status(await request("/api/spotify/artwork?url=" + encodeURIComponent("https://i.scdn.co.evil.test/image/a")), 400, "Lookalike proxy host blocked");
  status(await post("/api/likes", { type: "project", key: "attacker-invented-project", visitorId: "visitor-test-123", liked: true }), 404, "Fake like target rejected");
  status(await post("/api/track", { type: "event", name: "attacker-invented-event" }), 400, "Unknown analytics event rejected");

  const login = await post("/api/auth/admin/passcode", { passcode });
  status(login, 200, "Valid passcode still works");
  const cookie = login.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie?.startsWith("admin_session="));
  status(await request("/api/admin/config", { headers: { cookie } }), 200, "Authenticated admin access works");
  status(await request("/api/admin/config", { headers: { cookie, "sec-fetch-site": "cross-site" } }), 200, "Safe authenticated GET navigation remains compatible");
  status(await request("/api/admin/config", { method: "PATCH", headers: { cookie, origin: "https://evil.test", "content-type": "application/json" }, body: "{}" }), 403, "Authenticated cross-site mutation is denied");
  status(await request("/api/auth/signin", { headers: { cookie } }), 403, "Production OAuth bootstrap disabled");

  for (const key of ["aiEnabled", "spotifyEnabled"]) await db.execute({ sql: 'UPDATE "SiteConfig" SET "value" = ? WHERE "key" = ?', args: ["false", key] });
  status(await post("/api/ai-companion", { message: "Tell me about Bhargava" }), 503, "AI off switch enforced");
  assert.match((await (await request("/api/spotify")).json()).detail, /disabled/); checks++;

  const contact = { name: "Security Test", email: "security-test@example.invalid", phone: "", message: "Synthetic security verification message." };
  status(await post("/api/contact", contact), 201, "JSON contact submission works");
  status(await request("/api/contact", { method: "POST", headers: { origin, "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(contact) }), 201, "Native POST contact fallback works");
  const contacts = await db.execute('SELECT COUNT(*) AS count FROM "ContactSubmission"');
  assert.equal(Number(contacts.rows[0].count), 2); checks++;
  assert.ok(!logs.includes(contact.email) && !logs.includes(contact.message), "Contact data absent from application logs"); checks++;
  const guesses = await Promise.all(Array.from({ length: 30 }, () => post("/api/auth/admin/passcode", { passcode: "synthetic-wrong-passcode" })));
  assert.ok(guesses.filter((response) => response.status === 401).length <= 4, "At most four guesses remain after the valid login in the same IP window"); checks++;
  assert.ok(guesses.filter((response) => response.status === 429).length >= 26, "Concurrent passcode guesses are throttled before comparison"); checks++;
  assert.ok(guesses.every((response) => [401, 429].includes(response.status)), "Guess failures have expected status codes"); checks++;
  console.log(`PASS: ${checks} HTTP and data-boundary checks against the production build.`);

  if (process.env.SECURITY_KEEP_SERVER === "1") {
    // Enable local-only, keyless feature paths for the browser smoke check.
    for (const key of ["aiEnabled", "spotifyEnabled"]) await db.execute({ sql: 'UPDATE "SiteConfig" SET "value" = ? WHERE "key" = ?', args: ["true", key] });
    console.log(`Browser verification server: ${origin} (temporary database; press Ctrl+C to stop)`);
    await new Promise((resolve) => { process.once("SIGINT", resolve); process.once("SIGTERM", resolve); });
  }
} catch (error) {
  console.error(error);
  console.error(logs.slice(-4000));
  process.exitCode = 1;
} finally {
  const closed = new Promise((resolve) => { if (server.exitCode !== null) resolve(); else server.once("exit", resolve); });
  server.kill("SIGTERM");
  await closed;
  db.close();
  await rm(directory, { recursive: true, force: true });
}
