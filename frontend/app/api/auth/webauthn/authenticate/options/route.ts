import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/server";

import { getRpID } from "@/lib/webauthn-config";
import { getCredentials } from "@/lib/webauthn-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHALLENGE_COOKIE = "webauthn_challenge";

export async function POST() {
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

  const res = NextResponse.json(options);
  res.cookies.set(CHALLENGE_COOKIE, options.challenge, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 300,
  });
  return res;
}
