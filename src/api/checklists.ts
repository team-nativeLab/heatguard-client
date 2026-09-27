import { apiFetch } from "./client";
import type { ChecklistItem, CreateChecklistItemPayload, UpdateChecklistItemPayload } from "./types";

export function listChecklistItems() {
  return apiFetch<{ items: ChecklistItem[] }>("/api/v1/site/checklist-items");
}

export function createChecklistItem(payload: CreateChecklistItemPayload) {
  return apiFetch<ChecklistItem>("/api/v1/site/checklist-items", { method: "POST", body: payload });
}

export function updateChecklistItem(itemId: string, payload: UpdateChecklistItemPayload) {
  return apiFetch<ChecklistItem>(`/api/v1/site/checklist-items/${itemId}`, { method: "PATCH", body: payload });
}

export function deleteChecklistItem(itemId: string) {
  return apiFetch<void>(`/api/v1/site/checklist-items/${itemId}`, { method: "DELETE" });
}
