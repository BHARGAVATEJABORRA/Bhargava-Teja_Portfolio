import { NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/server";

import { ADMIN_USER_ID, ADMIN_USER_NAME, getRpID, rpName } from "@/lib/webauthn-config";
import { getCredentials } from "@/lib/webauthn-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHALLENGE_COOKIE = "webauthn_challenge";

export async function POST() {
  const existing = await getCredentials();

  const options = await generateRegistrationOptions({
    rpName,
    rpID: getRpID(),
    userID: new TextEncoder().encode(ADMIN_USER_ID),
    userName: ADMIN_USER_NAME,
    attestationType: "none",
    excludeCredentials: existing.map((c) => ({
      id: c.id,
      transports: c.transports as AuthenticatorTransportFuture[] | undefined,
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "required",
      authenticatorAttachment: "platform",
    },
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
