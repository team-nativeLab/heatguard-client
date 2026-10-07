import { apiFetch } from "./client";
import type { ActiveEmergencyCallsResponse } from "./types";

export function getActiveEmergencyCalls() {
  return (async () => {
    const items: ActiveEmergencyCallsResponse["items"] = [];
    let cursor: string | undefined;
    do {
      const response = await apiFetch<ActiveEmergencyCallsResponse & { page: { nextCursor: string | null } }>(
        "/api/v1/site/emergency-calls/active",
        { params: { cursor } },
      );
      items.push(...response.items);
      cursor = response.page.nextCursor ?? undefined;
    } while (cursor);
    return { items };
  })();
}

export function acknowledgeEmergencyCall(callId: string) {
  return apiFetch<{ callId: string; status: "ACKNOWLEDGED"; acknowledgedAt: string }>(
    `/api/v1/site/emergency-calls/${encodeURIComponent(callId)}/acknowledgement`,
    { method: "POST" },
  );
}
