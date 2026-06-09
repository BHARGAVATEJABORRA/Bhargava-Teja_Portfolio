function readEnvValue(value: string | undefined): string {
  return value?.trim() ?? "";
}

export type WeatherEnvConfig = {
  apiKey: string;
  isConfigured: boolean;
};

export function getWeatherEnvConfig(): WeatherEnvConfig {
  const apiKey = readEnvValue(process.env.OPENWEATHER_API_KEY);

  return {
    apiKey,
    isConfigured: Boolean(apiKey),
  };
}
