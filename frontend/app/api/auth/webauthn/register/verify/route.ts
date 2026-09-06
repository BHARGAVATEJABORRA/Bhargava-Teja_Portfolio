import { NextResponse, type NextRequest } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";

import { requireAdmin } from "@/lib/admin-guard";
import { ADMIN_SESSION_COOKIE, createSessionToken, sessionCookieOptions } from "@/lib/admin-session";
import { getExpectedOrigin, getRpID } from "@/lib/webauthn-config";
import { bytesToBase64url, saveCredential } from "@/lib/webauthn-store";
import { challengeCookie, challengeCookieOptions, consumeChallenge } from "@/lib/webauthn-challenge";
import { readJsonObject, requestErrorResponse } from "@/lib/request-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Passkey enrollment is admin-only (see register/options). Belt-and-suspenders
  // in case this route is ever reached without going through options first.
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: RegistrationResponseJSON;
  try { body = await readJsonObject(req, 65_536) as unknown as RegistrationResponseJSON; }
  catch (error) { return requestErrorResponse(error); }
  const expectedChallenge = await consumeChallenge(req.cookies.get(challengeCookie("register"))?.value, "register", req.cookies.get(ADMIN_SESSION_COOKIE)?.value);
  if (!expectedChallenge) {
    return NextResponse.json({ verified: false, error: "Challenge expired. Try again." }, { status: 400 });
  }

  try {
    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: getExpectedOrigin(),
      expectedRPID: getRpID(),
      requireUserVerification: true,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ verified: false, error: "Registration could not be verified." }, { status: 400 });
    }

    const { credential } = verification.registrationInfo;
    await saveCredential({
      id: credential.id,
      publicKey: bytesToBase64url(credential.publicKey),
      counter: credential.counter,
      transports: credential.transports,
      createdAt: new Date().toISOString(),
    });

    const token = await createSessionToken();
    const res = NextResponse.json({ verified: true }, { headers: { "Cache-Control": "no-store" } });
    res.cookies.set(ADMIN_SESSION_COOKIE, token, sessionCookieOptions());
    res.cookies.set(challengeCookie("register"), "", { ...challengeCookieOptions(), maxAge: 0 });
    return res;
  } catch {
    return NextResponse.json({ verified: false, error: "Registration failed. Start again." }, { status: 400 });
  }
}
