import { apiFetch } from "./client";
import type { ActiveEmergencyCallsResponse } from "./types";

export function getActiveEmergencyCalls() {
  return apiFetch<ActiveEmergencyCallsResponse>("/api/v1/site/emergency-calls/active");
}

export function acknowledgeEmergencyCall(callId: string) {
  return apiFetch<{ id: string; version: number; createdAt: string; updatedAt: string }>(
    `/api/v1/site/emergency-calls/${callId}/acknowledgement`,
    { method: "POST" },
  );
}
