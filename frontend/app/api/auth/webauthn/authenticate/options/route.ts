import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/server";

import { getRpID } from "@/lib/webauthn-config";
import { getCredentials } from "@/lib/webauthn-store";
import { challengeCookie, challengeCookieOptions, issueChallenge } from "@/lib/webauthn-challenge";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { mutationOriginAllowed } from "@/lib/request-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!mutationOriginAllowed(request)) return NextResponse.json({ error: "Cross-origin request denied." }, { status: 403 });
  const limit = await rateLimit(`passkey:options:${clientIp(request)}`, { limit: 20, windowMs: 60_000 });
  const global = await rateLimit("passkey:options:global", { limit: 100, windowMs: 60_000 });
  if (!limit.allowed || !global.allowed) return NextResponse.json({ error: "Please try again later." }, { status: 429 });
  const creds = await getCredentials();
  if (creds.length === 0) {
    return NextResponse.json({ error: "No passkey registered yet." }, { status: 409 });
  }

  const options = await generateAuthenticationOptions({
    rpID: getRpID(),
    allowCredentials: creds.map((c) => ({
      id: c.id,
      transports: c.transports as AuthenticatorTransportFuture[] | undefined,
    })),
    userVerification: "required",
  });

  const nonce = await issueChallenge(options.challenge, "authenticate");
  const res = NextResponse.json(options, { headers: { "Cache-Control": "no-store" } });
  res.cookies.set(challengeCookie("authenticate"), nonce, challengeCookieOptions());
  return res;
}
