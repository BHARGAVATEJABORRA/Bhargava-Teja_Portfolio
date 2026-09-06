# Security review and rollout

Review date: September 5, 2026. Scope: the portfolio's Next.js application, authentication, public and admin APIs, uploads, outbound requests, dependencies, secret handling, deployment packaging, and Vercel firewall configuration. This is a source review with targeted negative tests, not proof that every possible attack is impossible or that no past compromise occurred. No production data was modified by the attack tests.

## Confirmed findings and fixes

### High: reusable passkey authentication challenges

The previous verifier trusted the raw challenge supplied in an HTTP cookie without checking a server-side challenge record. Cookie expiry is a browser behavior, not a server-side expiry check. With a captured, valid signed assertion from a zero-counter passkey, a client could resubmit that assertion and the old challenge cookie. Synced passkeys can legitimately use a zero signature counter, so the counter alone does not prevent replay. This finding requires capture of an earlier valid assertion; it is not evidence of an unauthenticated arbitrary passkey forgery or an observed compromise.

The fix generates an opaque 256-bit cookie nonce and stores its hash with the expected challenge, purpose, expiry, and (for enrollment) admin-session binding. An atomic `DELETE ... RETURNING` consumes the record before cryptographic verification. Challenges expire after five minutes and authentication/enrollment have separate host-only cookies. Existing passkeys, session signing, and stored credentials remain compatible. A new table and index are created lazily using the project's existing SQLite/Turso pattern; there is no destructive migration.

The regression test generates a synthetic P-256 credential, demonstrates the old verification pattern accepting the same zero-counter assertion twice, then verifies that the new route succeeds once and rejects the replay, a fabricated challenge, and a mismatched challenge. Concurrency and expiry are also tested on both database drivers. This follows [SimpleWebAuthn's server-side challenge guidance](https://simplewebauthn.dev/docs/advanced/passkeys).

### Abuse, privacy, and defense-in-depth gaps

- Public rate limits previously checked and inserted separately and allowed requests on storage failure. They now reserve a slot atomically and fail closed, with global cost/volume ceilings and global expiry cleanup. Passcode attempts also reserve per-IP/global slots before comparison, closing the concurrent-guess gap in failure-only lockouts. Self-hosting only trusts forwarded IP headers after explicit configuration; Vercel remains the intended proxy.
- Mutating API requests reject cross-origin and sibling-origin browser requests. Sensitive public JSON/form endpoints enforce content type, object shape, and actual streamed byte limits rather than trusting `Content-Length`. These are abuse/CSRF controls, not authentication; non-browser clients can omit or forge origin headers.
- The browser now receives a per-response script nonce with `strict-dynamic`, no production `unsafe-eval`, no framing or plugins, and same-origin form submission. Existing inline styles are retained for animation compatibility. HTML and sensitive responses are not cached. React rendering and trusted scripts still need safe handling of untrusted content; CSP is defense in depth, not an HTML sanitizer.
- Spotify credential setup is admin-only and development-only. It no longer renders a refresh token in an HTML fallback. Existing production tokens continue to work. Local credentials are not explicitly read from disk in production.
- AI/Spotify feature switches are enforced on the server and in the UI. AI request sizes, history shapes, timeouts, and daily request volume are bounded. Prompt-injection heuristics are not treated as a security boundary; the companion has no privileged tools.
- Contact submissions are not written to application logs and native form fallback uses POST. Analytics strips query strings/referrer paths, accepts known events and bounded metadata, and ignores invented like targets. Anonymous analytics and likes are still not identity-verified.
- Artwork proxying accepts only specific Spotify image hosts/path shapes over HTTPS, disallows redirects, and times out. Uploads remain admin-only; MIME types/extensions are restricted and the Blob SDK verifies completion callbacks. This is not file-content malware scanning.

### Dependency advisories

Scoped lockfile/override updates remediate the installed `deepmerge-ts`, `nanoid`, and `js-yaml` advisories. A full `npm audit` returned zero known vulnerabilities after the updates, including development dependencies. This does not establish that the original application exposed the vulnerable functions to unauthenticated input, and an audit cannot detect undisclosed vulnerabilities. Next.js remains on the existing 16.2.12 version; no speculative framework migration was made.

## Environment-file review

- The only tracked environment file is the empty/example configuration. Real local environment files are ignored and their local permissions were restricted to owner read/write (0600).
- Removed an unused local `NEXT_PUBLIC_OPENWEATHER_API_KEY` alias; the server-only weather key remains. Never put credentials behind `NEXT_PUBLIC_`: those values are intended for browsers.
- Added deployment and function-tracing exclusions for environment files, private databases, and local artifacts. Runtime secrets should come from the hosting environment, not bundled files.
- Exact-value scans against the available local secrets found no matches in all 16 Git revisions reviewed or the generated browser assets. High-confidence credential-pattern checks also found no tracked credentials. These checks do not inspect deleted remote branches, external logs, inaccessible old deployment bundles, or secrets unknown to this workspace.
- Vercel production credential metadata was checked without reading values: admin/session, Spotify, database, Blob, and email credentials are hidden secrets. Existence and storage classification do not prove rotation history, strength, or absence of access by other account members.
- If the former public weather alias was used in an old deployed bundle, rotate that provider key. Rotate any credential known to have been shared or exposed; changing the admin session secret invalidates current sessions. No production credentials were rotated automatically.

## Verification

Run from `frontend/`:

```sh
npm ci
npm run lint
npm run test:security
npm run test:security:libsql
npm run build
npm run test:security:http
npm audit --audit-level=high
```

The unit/security suites use fresh temporary databases and synthetic credentials. Each driver run reports nine passing tests (including the parent suite). The production-build HTTP suite passes 46 checks covering unauthorized admin routes, a middleware-bypass header, private-file paths, cross-origin requests, malformed/oversized bodies, forged upload callbacks, SSRF inputs, unknown write targets, valid login, concurrent passcode throttling, feature switches, and successful JSON/native-form contact storage without PII logs. CI runs these checks without production secrets. Live payment/email/Blob operations, the owner's physical passkey, destructive scans, and volumetric denial-of-service attacks were not exercised.

Chromium verification exercised the AI's keyless preview response and a successful contact submission against the temporary database. The mobile login page rendered without horizontal overflow or policy violations. An inert script inserted into an intercepted local HTML response was blocked by `script-src-elem` while the normal application loaded. Browser developer-console evaluation is privileged and was not treated as a valid test of HTML injection resistance.

## Vercel firewall: staged, not published

Two validated draft rules were prepared for `bhargava-teja-portfolio`:

| Draft | Scope | Initial action |
| --- | --- | --- |
| Portfolio secret-file probes | Exact common `.env`, `.git/config`, and private database paths | Log |
| Portfolio API POST rate | POST contact, AI, likes, tracking, and `/api/auth/` | Log after 300 requests/IP/60 seconds |

The plan rejected a second separate rate-limiting rule, so login and public writes share one generous initial edge limit. No paid upgrade, bypass, global challenge, or DDoS-mitigation change was made. Application-level limits remain independent and stricter. Draft log rules currently block nothing, even after publication; they are the first rollout stage, not completed enforcement.

Owner rollout:

1. Review `vercel firewall diff` from the linked project, then publish the logging drafts yourself with `vercel firewall publish --yes`.
2. Review [secret-file traffic](https://vercel.com/bhargavatejaborras-projects/bhargava-teja-portfolio/firewall/traffic?filter=rule_portfolio_secret_file_probes_rMA4oC) and [API POST traffic](https://vercel.com/bhargavatejaborras-projects/bhargava-teja-portfolio/firewall/traffic?filter=rule_portfolio_public_post_rate_zDlvyX). Check shared-IP visitors, crawlers, and expected clients before choosing enforcement limits.
3. Validate blocking/rate-limiting on preview first, keeping production observation available. Preserve every condition when editing a rule. Only then publish production enforcement; revert to logging/disable if legitimate traffic is affected.

Vercel's platform DDoS protection is separate from these custom rules. The staged rollout follows [Vercel Firewall guidance](https://vercel.com/docs/vercel-firewall); an application request guard cannot replace network/edge DDoS protection.

## Tradeoffs and remaining work

- Merge/deploy the reviewed code before treating any source fix as a live fix. Keep the PR unmerged until review. Run a post-deployment smoke check using the owner's real admin/passkey and upload workflow; the automated checks do not replace that acceptance test.
- The legacy global passcode lockout is retained: it slows distributed guessing but can temporarily lock out legitimate passcode login. Registered passkey login is a separate path. Durable session revocation, recovery, password-policy changes, and an external identity provider need a separate migration decision.
- Fail-closed limits and global ceilings favor data/cost protection over availability: database outages or enough abuse can temporarily deny public submissions. Tune limits against real traffic and monitor database storage and integration spending.
- Signed sessions remain bearer credentials for up to eight hours. A stolen current session is not made safe by the passkey replay fix. Protect devices, hosting/GitHub accounts, recovery methods, database tokens, and least-privilege access.
- Nonce-based CSP requires dynamic HTML and disables HTML caching. Existing animation styles and broad HTTPS image/media sources are preserved for content compatibility. Do not use static export for this hardened server configuration.
- Upload content scanning, backup restoration, hosting-account access review, external-provider permissions, historic breach investigation, and sustained/distributed attack testing were not completed by this source audit.
- No quantum computer or exhaustive probability proof was used. Custom cryptography or an unverified post-quantum replacement would introduce compatibility and correctness risks without fixing the actual replay flaw. Standard cryptography plus server-side single-use state directly addresses the demonstrated attack; future cryptographic migrations should follow browser/authenticator support and established standards.
