/**
 * WebAuthn / Touch ID configuration for the admin gate.
 *
 * IMPORTANT: Passkeys require a valid Relying Party ID. `localhost` is allowed
 * as a secure context, but bare IPs like 127.0.0.1 are NOT — open the app at
 * http://localhost:3000 (not 127.0.0.1) in dev, or Touch ID will be rejected.
 *
 * In production set WEBAUTHN_ORIGIN (e.g. https://admin.example.com); the RP ID
 * is derived from its hostname unless WEBAUTHN_RP_ID is set explicitly.
 */

export const rpName = "Portfolio Admin";

// Single-admin setup. userID is stable so re-registration replaces the passkey.
export const ADMIN_USER_ID = "portfolio-admin";
export const ADMIN_USER_NAME = "admin";

function envOrigin(): string {
  const explicit = process.env.WEBAUTHN_ORIGIN?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  // Default to localhost (passkey-friendly), NOT NEXT_PUBLIC_SITE_URL which may be an IP.
  return "http://localhost:3000";
}

export function getExpectedOrigin(): string {
  return envOrigin();
}

export function getRpID(): string {
  const explicit = process.env.WEBAUTHN_RP_ID?.trim();
  if (explicit) return explicit;
  try {
    return new URL(envOrigin()).hostname;
  } catch {
    return "localhost";
  }
}
