import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/admin-session";

/**
 * Route-handler-level session check for /api/admin/*.
 *
 * Middleware already gates these paths, but route handlers verify again so a
 * matcher regression can never silently expose the CRUD API.
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const store = await cookies();
  const token = store.get(ADMIN_SESSION_COOKIE)?.value;
  if (await verifySessionToken(token)) return null;
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
