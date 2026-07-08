import { NextResponse, type NextRequest } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import type { AuthenticationResponseJSON, AuthenticatorTransportFuture } from "@simplewebauthn/server";

import { ADMIN_SESSION_COOKIE, createSessionToken, sessionCookieOptions } from "@/lib/admin-session";
import { getExpectedOrigin, getRpID } from "@/lib/webauthn-config";
import { base64urlToBytes, getCredentialById, updateCredentialCounter } from "@/lib/webauthn-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHALLENGE_COOKIE = "webauthn_challenge";

export async function POST(req: NextRequest) {
  const expectedChallenge = req.cookies.get(CHALLENGE_COOKIE)?.value;
  if (!expectedChallenge) {
    return NextResponse.json({ verified: false, error: "Challenge expired. Try again." }, { status: 400 });
  }

  const body = (await req.json()) as AuthenticationResponseJSON;
  const cred = await getCredentialById(body.id);
  if (!cred) {
    return NextResponse.json({ verified: false, error: "Unknown passkey." }, { status: 400 });
  }

  try {
    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: getExpectedOrigin(),
      expectedRPID: getRpID(),
      requireUserVerification: true,
      credential: {
        id: cred.id,
        publicKey: base64urlToBytes(cred.publicKey),
        counter: cred.counter,
        transports: cred.transports as AuthenticatorTransportFuture[] | undefined,
      },
    });

    if (!verification.verified) {
      return NextResponse.json({ verified: false, error: "Authentication failed." }, { status: 401 });
    }

    await updateCredentialCounter(cred.id, verification.authenticationInfo.newCounter);

    const token = await createSessionToken();
    const res = NextResponse.json({ verified: true });
    res.cookies.set(ADMIN_SESSION_COOKIE, token, sessionCookieOptions());
    res.cookies.set(CHALLENGE_COOKIE, "", { path: "/", maxAge: 0 });
    return res;
  } catch (err) {
    return NextResponse.json({ verified: false, error: (err as Error).message }, { status: 400 });
  }
}
