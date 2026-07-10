import "server-only";

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function readEnvValue(value: string | undefined): string {
  return value?.trim() ?? "";
}

function parseEnvValue(value: string): string {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).replaceAll("\\n", "\n").replaceAll('\\"', '"').replaceAll("\\'", "'");
  }

  return trimmed;
}

function readLocalEnv(): Record<string, string> {
  const envPath = path.join(process.cwd(), ".env.local");

  if (!existsSync(envPath)) {
    return {};
  }

  return readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .reduce<Record<string, string>>((values, line) => {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        return values;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex <= 0) {
        return values;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1);
      values[key] = parseEnvValue(value);
      return values;
    }, {});
}

function readRuntimeEnvValue(localEnv: Record<string, string>, key: string): string {
  return readEnvValue(process.env[key]) || readEnvValue(localEnv[key]);
}

export type SpotifyEnvConfig = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  redirectUri: string;
  siteUrl: string;
  hasCredentials: boolean;
  isConfigured: boolean;
};

export function getSpotifyEnvConfig(): SpotifyEnvConfig {
  const localEnv = readLocalEnv();
  const clientId = readRuntimeEnvValue(localEnv, "SPOTIFY_CLIENT_ID");
  const clientSecret = readRuntimeEnvValue(localEnv, "SPOTIFY_CLIENT_SECRET");
  const refreshToken = readRuntimeEnvValue(localEnv, "SPOTIFY_REFRESH_TOKEN");
  const vercelUrl = readEnvValue(process.env.VERCEL_URL);
  const siteUrl =
    readRuntimeEnvValue(localEnv, "NEXT_PUBLIC_SITE_URL") ||
    readRuntimeEnvValue(localEnv, "NEXTAUTH_URL") ||
    readRuntimeEnvValue(localEnv, "AUTH_URL") ||
    (vercelUrl ? `https://${vercelUrl}` : "") ||
    "http://127.0.0.1:3000";
  const redirectUri = readRuntimeEnvValue(localEnv, "SPOTIFY_REDIRECT_URI") || `${siteUrl}/api/auth/callback/spotify`;
  const hasCredentials = Boolean(clientId && clientSecret);

  return {
    clientId,
    clientSecret,
    refreshToken,
    redirectUri,
    siteUrl,
    hasCredentials,
    isConfigured: Boolean(hasCredentials && refreshToken),
  };
}
