function readEnvValue(value: string | undefined): string {
  return value?.trim() ?? "";
}

export type SpotifyEnvConfig = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  isConfigured: boolean;
};

export function getSpotifyEnvConfig(): SpotifyEnvConfig {
  const clientId = readEnvValue(process.env.SPOTIFY_CLIENT_ID);
  const clientSecret = readEnvValue(process.env.SPOTIFY_CLIENT_SECRET);
  const refreshToken = readEnvValue(process.env.SPOTIFY_REFRESH_TOKEN);

  return {
    clientId,
    clientSecret,
    refreshToken,
    isConfigured: Boolean(clientId && clientSecret && refreshToken),
  };
}
