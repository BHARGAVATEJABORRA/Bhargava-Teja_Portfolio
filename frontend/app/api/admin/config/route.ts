/**
 * /api/admin/config — site-wide settings (SiteConfig key-value table).
 *
 * GET   → all config values, with secrets masked to their last 4 chars.
 * PATCH → upsert one key ({ key, value }) or many ({ values: { key: value } }).
 *         Masked placeholders ("••••abcd") are ignored so re-saving a form
 *         never overwrites a stored secret with its mask.
 *
 * Every successful PATCH republishes content/portfolio-overrides.json so the
 * public site picks up identity/hero/about/contact/meta changes. Secrets are
 * never written to the overlay (see toPublicSiteConfig).
 */

import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/admin-guard";
import { recordChange } from "@/lib/change-log";
import { getSiteConfig, publishContentOverrides, setSiteConfigValues } from "@/lib/content-store";
import {
  coerceConfigValue,
  isMaskedPlaceholder,
  isSecretConfigKey,
  maskSecret,
  SITE_CONFIG_KEYS,
  type SiteConfigKey,
  type SiteConfigShape,
} from "@/lib/site-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function maskedConfig(config: SiteConfigShape): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of SITE_CONFIG_KEYS) {
    out[key] = isSecretConfigKey(key) ? maskSecret(config[key] as string) : config[key];
  }
  return out;
}

export async function GET(): Promise<NextResponse> {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const config = await getSiteConfig();
    return NextResponse.json({ config: maskedConfig(config) });
  } catch (err) {
    console.error("[admin-config]", err);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    const parsed = (await req.json()) as unknown;
    if (!parsed || typeof parsed !== "object") throw new Error("not an object");
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // Accept { key, value } or { values: { k: v, … } }.
  const entries: [string, unknown][] =
    typeof body.key === "string"
      ? [[body.key, body.value]]
      : body.values && typeof body.values === "object"
        ? Object.entries(body.values as Record<string, unknown>)
        : [];

  if (entries.length === 0) {
    return NextResponse.json({ error: "Provide { key, value } or { values: { … } }." }, { status: 400 });
  }

  const updates: Partial<SiteConfigShape> = {};
  for (const [key, value] of entries) {
    if (!(SITE_CONFIG_KEYS as string[]).includes(key)) {
      return NextResponse.json({ error: `Unknown config key: "${key}".` }, { status: 400 });
    }
    const typedKey = key as SiteConfigKey;
    // Never store the mask itself — a masked placeholder means "keep the stored secret".
    if (isSecretConfigKey(typedKey) && isMaskedPlaceholder(value)) continue;
    assignUpdate(updates, typedKey, coerceConfigValue(typedKey, value));
  }

  try {
    await setSiteConfigValues(updates);
    const changedKeys = Object.keys(updates);
    if (changedKeys.length > 0) {
      // Secrets are logged by key name only — never their values.
      await recordChange({
        entity: "settings",
        action: "update",
        field: changedKeys.join(", "),
        summary:
          changedKeys.length === 1
            ? `Updated setting "${changedKeys[0]}"`
            : `Updated ${changedKeys.length} settings (${changedKeys.slice(0, 4).join(", ")}${changedKeys.length > 4 ? "…" : ""})`,
      });
    }
    await publishContentOverrides();
    const config = await getSiteConfig();
    return NextResponse.json({ ok: true, config: maskedConfig(config) });
  } catch (err) {
    console.error("[admin-config]", err);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}

function assignUpdate<K extends SiteConfigKey>(updates: Partial<SiteConfigShape>, key: K, value: SiteConfigShape[K]): void {
  updates[key] = value;
}
