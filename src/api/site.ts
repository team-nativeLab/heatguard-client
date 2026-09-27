import { apiFetch } from "./client";
import type { SiteProfile, UpdateSiteProfilePayload, WithdrawSitePayload } from "./types";

export function getProfile() {
  return apiFetch<SiteProfile>("/api/v1/site/profile");
}

export function updateProfile(payload: UpdateSiteProfilePayload) {
  return apiFetch<{ id: string; version: number; createdAt: string; updatedAt: string }>(
    "/api/v1/site/profile",
    { method: "PATCH", body: payload },
  );
}

export function withdraw(payload: WithdrawSitePayload) {
  return apiFetch<void>("/api/v1/site/profile", { method: "DELETE", body: payload });
}
