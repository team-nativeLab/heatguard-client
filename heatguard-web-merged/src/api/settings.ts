import { apiFetch } from "./client";
import type { CheckTimesPayload, CheckTimesResponse, ManualWeather, ManualWeatherPayload } from "./types";

export function getCheckTimes() {
  return apiFetch<CheckTimesResponse>("/api/v1/site/check-times");
}

export function updateCheckTimes(payload: CheckTimesPayload) {
  return apiFetch<CheckTimesResponse>("/api/v1/site/check-times", { method: "PUT", body: payload });
}

export function getManualWeather() {
  return apiFetch<ManualWeather>("/api/v1/site/manual-weather");
}

export function updateManualWeather(payload: ManualWeatherPayload) {
  return apiFetch<ManualWeather>("/api/v1/site/manual-weather", { method: "PUT", body: payload });
}
