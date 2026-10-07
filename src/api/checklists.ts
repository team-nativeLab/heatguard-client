import { apiFetch } from "./client";
import type { ChecklistItem, CreateChecklistItemPayload, Page, UpdateChecklistItemPayload } from "./types";

interface BackendChecklistItem {
  itemId: string;
  text: string;
  sortOrder: number;
  active?: boolean;
  version?: number;
}

function normalizeItem(item: BackendChecklistItem): ChecklistItem {
  return { id: item.itemId, text: item.text, sortOrder: item.sortOrder, active: item.active ?? true, version: item.version };
}

export function listChecklistItems() {
  return (async () => {
    const items: ChecklistItem[] = [];
    let cursor: string | undefined;
    let page: Page<BackendChecklistItem>["page"] = { nextCursor: null };
    do {
      const result = await apiFetch<Page<BackendChecklistItem>>("/api/v1/site/checklist-items", { params: { cursor } });
      items.push(...result.items.map(normalizeItem));
      page = result.page;
      cursor = page.nextCursor ?? undefined;
    } while (cursor);
    return { items, page };
  })();
}

export function createChecklistItem(payload: CreateChecklistItemPayload) {
  return apiFetch<BackendChecklistItem>("/api/v1/site/checklist-items", { method: "POST", body: payload }).then(normalizeItem);
}

export function updateChecklistItem(itemId: string, payload: UpdateChecklistItemPayload) {
  return apiFetch<BackendChecklistItem>(`/api/v1/site/checklist-items/${encodeURIComponent(itemId)}`, { method: "PATCH", body: payload }).then(normalizeItem);
}

export function deleteChecklistItem(itemId: string) {
  return apiFetch<void>(`/api/v1/site/checklist-items/${encodeURIComponent(itemId)}`, { method: "DELETE" });
}
