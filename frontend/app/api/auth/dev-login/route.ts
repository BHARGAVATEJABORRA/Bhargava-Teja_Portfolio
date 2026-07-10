/**
 * Emergency passcode login that works on any domain (e.g. before the passkey
 * has been re-registered on a new deployment). Same behavior as
 * /api/auth/admin/passcode — kept as an alias so external docs/tools can rely
 * on a stable path.
 */
export { POST } from "../admin/passcode/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
