import { NextResponse, type NextRequest } from "next/server";

import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/admin-session";
import { mutationOriginAllowed } from "@/lib/request-security";
import { contentSecurityPolicy } from "@/lib/security-headers";

// Next.js 16 proxy convention (formerly middleware). Guards the /admin area.
export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const api = pathname.startsWith("/api/");
  const protectedPath = pathname === "/admin" || pathname.startsWith("/admin/") ||
    pathname.startsWith("/api/admin/") || pathname.startsWith("/api/auth/webauthn/register/") ||
    pathname === "/api/auth/signin" || pathname === "/api/auth/callback/spotify";
  if (api && !["GET", "HEAD", "OPTIONS"].includes(req.method) && !mutationOriginAllowed(req)) {
    return NextResponse.json({ error: "Cross-origin request denied." }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }
  if (/(?:^|\/)(?:\.env(?:\.[^/]*)?|\.git|\.data)(?:\/|$)/i.test(pathname)) {
    return new NextResponse(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  // The signed Blob completion callback is verified by the SDK inside its route.
  // Token creation still checks requireAdmin there; allow only this endpoint
  // through proxy so server-to-server upload callbacks can arrive.
  const blobCallbackRoute = pathname === "/api/admin/upload/client";
  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const valid = !protectedPath || blobCallbackRoute || await verifySessionToken(token);

  if (!valid) {
    // API callers get a 401; page navigations bounce to the login screen.
    if (req.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", req.nextUrl.pathname);
    const response = NextResponse.redirect(url);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  const requestHeaders = new Headers(req.headers);
  const nonce = btoa(crypto.randomUUID());
  const csp = contentSecurityPolicy(nonce, process.env.NODE_ENV !== "production");
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  if (!api) response.headers.set("Content-Security-Policy", csp);
  if (!api || protectedPath || pathname.startsWith("/api/auth/") || req.method !== "GET") {
    response.headers.set("Cache-Control", "private, no-store");
  }
  return response;
}

export const config = {
  // Passkey *registration* is admin-gated here too (defense in depth alongside
  // the requireAdmin() check inside the routes) so no one can enroll a passkey
  // without an authenticated session. Authentication/status stay public.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|woff2?|mp4|webm|pdf|txt)$).*)",
  ],
};
