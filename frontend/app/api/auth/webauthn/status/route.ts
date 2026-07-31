import { NextResponse } from "next/server";

import { hasCredential } from "@/lib/webauthn-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ registered: await hasCredential() });
}
