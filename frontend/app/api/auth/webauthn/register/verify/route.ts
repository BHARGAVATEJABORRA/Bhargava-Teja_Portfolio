import { NextResponse, type NextRequest } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";

import { requireAdmin } from "@/lib/admin-guard";
import { ADMIN_SESSION_COOKIE, createSessionToken, sessionCookieOptions } from "@/lib/admin-session";
import { getExpectedOrigin, getRpID } from "@/lib/webauthn-config";
import { bytesToBase64url, saveCredential } from "@/lib/webauthn-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHALLENGE_COOKIE = "webauthn_challenge";

export async function POST(req: NextRequest) {
  // Passkey enrollment is admin-only (see register/options). Belt-and-suspenders
  // in case this route is ever reached without going through options first.
  const denied = await requireAdmin();
  if (denied) return denied;

  const expectedChallenge = req.cookies.get(CHALLENGE_COOKIE)?.value;
  if (!expectedChallenge) {
    return NextResponse.json({ verified: false, error: "Challenge expired. Try again." }, { status: 400 });
  }

  const body = (await req.json()) as RegistrationResponseJSON;

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
    const res = NextResponse.json({ verified: true });
    res.cookies.set(ADMIN_SESSION_COOKIE, token, sessionCookieOptions());
    res.cookies.set(CHALLENGE_COOKIE, "", { path: "/", maxAge: 0 });
    return res;
  } catch (err) {
    return NextResponse.json({ verified: false, error: (err as Error).message }, { status: 400 });
  }
}
