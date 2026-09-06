import { NextResponse, type NextRequest } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import type { AuthenticationResponseJSON, AuthenticatorTransportFuture } from "@simplewebauthn/server";

import { ADMIN_SESSION_COOKIE, createSessionToken, sessionCookieOptions } from "@/lib/admin-session";
import { getExpectedOrigin, getRpID } from "@/lib/webauthn-config";
import { base64urlToBytes, getCredentialById, updateCredentialCounter } from "@/lib/webauthn-store";
import { challengeCookie, challengeCookieOptions, consumeChallenge } from "@/lib/webauthn-challenge";
import { readJsonObject, requestErrorResponse } from "@/lib/request-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: AuthenticationResponseJSON;
  try { body = await readJsonObject(req, 32_768) as unknown as AuthenticationResponseJSON; }
  catch (error) { return requestErrorResponse(error); }
  const expectedChallenge = await consumeChallenge(req.cookies.get(challengeCookie("authenticate"))?.value, "authenticate");
  if (!expectedChallenge) {
    return NextResponse.json({ verified: false, error: "Challenge expired. Try again." }, { status: 400 });
  }

  if (typeof body.id !== "string" || body.id.length > 2048) {
    return NextResponse.json({ verified: false, error: "Invalid passkey response." }, { status: 400 });
  }
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
    const res = NextResponse.json({ verified: true }, { headers: { "Cache-Control": "no-store" } });
    res.cookies.set(ADMIN_SESSION_COOKIE, token, sessionCookieOptions());
    res.cookies.set(challengeCookie("authenticate"), "", { ...challengeCookieOptions(), maxAge: 0 });
    return res;
  } catch {
    return NextResponse.json({ verified: false, error: "Authentication failed. Start again." }, { status: 400 });
  }
}
