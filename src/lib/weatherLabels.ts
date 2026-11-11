const WEATHER_CONDITION_LABELS: Record<string, string> = {
  CLEAR: "맑음",
  SUNNY: "맑음",
  PARTLY_CLOUDY: "구름 많음",
  MOSTLY_CLOUDY: "구름 많음",
  CLOUDY: "흐림",
  OVERCAST: "흐림",
  RAIN: "비",
  DRIZZLE: "이슬비",
  SHOWER: "소나기",
  RAIN_SNOW: "비/눈",
  SNOW: "눈",
  FOG: "안개",
  MIST: "박무",
};

export function weatherConditionLabel(condition?: string | null, skyStatus?: string | null): string {
  const value = condition || skyStatus;
  if (!value) return "-";
  return WEATHER_CONDITION_LABELS[value.trim().toUpperCase()] ?? value;
}
