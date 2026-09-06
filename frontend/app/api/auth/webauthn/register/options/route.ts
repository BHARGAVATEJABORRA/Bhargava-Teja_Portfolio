import { NextResponse, type NextRequest } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/server";

import { requireAdmin } from "@/lib/admin-guard";
import { ADMIN_USER_ID, ADMIN_USER_NAME, getRpID, rpName } from "@/lib/webauthn-config";
import { getCredentials } from "@/lib/webauthn-store";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-session";
import { challengeCookie, challengeCookieOptions, issueChallenge } from "@/lib/webauthn-challenge";
import { mutationOriginAllowed } from "@/lib/request-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Enrolling a passkey requires an already-authenticated admin session (you
  // sign in with the passcode first). This is what prevents anyone else from
  // registering their own passkey and taking over the admin panel.
  const denied = await requireAdmin();
  if (denied) return denied;
  if (!mutationOriginAllowed(req)) return NextResponse.json({ error: "Cross-origin request denied." }, { status: 403 });

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

  const nonce = await issueChallenge(options.challenge, "register", req.cookies.get(ADMIN_SESSION_COOKIE)?.value);
  const res = NextResponse.json(options, { headers: { "Cache-Control": "no-store" } });
  res.cookies.set(challengeCookie("register"), nonce, challengeCookieOptions());
  return res;
}
