Warning: gunzipSync was declared with const; use let for reassignable variables.
const STORAGE_KEY = "heatguard.selectedSiteId";
export const SITE_SELECTION_EVENT = "heatguard:site-selection";

export function getSelectedSiteId(): string {
  return typeof window === "undefined" ? "" : window.localStorage.getItem(STORAGE_KEY) ?? "";
}

export function setSelectedSiteId(siteId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, siteId);
  window.dispatchEvent(new CustomEvent(SITE_SELECTION_EVENT, { detail: { siteId } }));
}

export function clearSelectedSiteId() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(SITE_SELECTION_EVENT, { detail: { siteId: "" } }));
}
