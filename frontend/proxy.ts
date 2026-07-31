import { NextResponse, type NextRequest } from "next/server";

import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/admin-session";

// Next.js 16 proxy convention (formerly middleware). Guards the /admin area.
export async function proxy(req: NextRequest) {
  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const valid = await verifySessionToken(token);

  if (!valid) {
    // API callers get a 401; page navigations bounce to the login screen.
    if (req.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Passkey *registration* is admin-gated here too (defense in depth alongside
  // the requireAdmin() check inside the routes) so no one can enroll a passkey
  // without an authenticated session. Authentication/status stay public.
  matcher: [
    "/admin",
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/auth/webauthn/register/:path*",
  ],
};
