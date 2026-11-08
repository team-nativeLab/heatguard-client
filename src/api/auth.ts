import { apiFetch } from "./client";
import type {
  ChangePasswordPayload,
  UpdateProfilePayload,
  LoginPayload,
  SiteLoginResponse,
  SiteRegisterPayload,
  SiteRegisterResponse,
  SiteUser,
} from "./types";

export function register(payload: SiteRegisterPayload) {
  return apiFetch<SiteRegisterResponse>("/api/v1/auth/site/register", { method: "POST", body: payload });
}

export interface UnassignedSiteRegisterPayload {
  managerName: string;
  email: string;
  password: string;
  confirmPassword: string;
  verificationToken: string;
}

export function registerUnassigned(payload: UnassignedSiteRegisterPayload) {
  return apiFetch<{ userId: string; email: string; name: string; role: "SITE_MANAGER"; companyId: string | null; siteId: string | null; membershipStatus: "UNASSIGNED"; createdAt: string }>(
    "/api/v1/auth/site/register-unassigned", { method: "POST", body: payload },
  );
}

export interface ManagedSite {
  siteId: string;
  siteName: string;
  active: boolean;
}

function normalizeManagedSites(raw: unknown): ManagedSite[] {
  const root = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const values = Array.isArray(raw) ? raw : Array.isArray(root.sites) ? root.sites : Array.isArray(root.items) ? root.items : [];
  return values.flatMap((value) => {
    if (!value || typeof value !== "object") return [];
    const item = value as Record<string, unknown>;
    const siteId = typeof item.siteId === "string" ? item.siteId : typeof item.id === "string" ? item.id : "";
    if (!siteId) return [];
    return [{
      siteId,
      siteName: typeof item.siteName === "string" ? item.siteName : typeof item.name === "string" ? item.name : "이름 없는 현장",
      active: item.active !== false,
    }];
  }).filter((site) => site.active);
}

let managedSitesCache: ManagedSite[] | null = null;
let managedSitesRequest: Promise<ManagedSite[]> | null = null;

export function clearManagedSitesCache() {
  managedSitesCache = null;
  managedSitesRequest = null;
}

export function listManagedSites({ refresh = false }: { refresh?: boolean } = {}) {
  if (refresh) clearManagedSitesCache();
  if (managedSitesCache) return Promise.resolve(managedSitesCache);
  if (!managedSitesRequest) {
    managedSitesRequest = apiFetch<unknown>("/api/v1/auth/site/sites")
      .then((raw) => {
        managedSitesCache = normalizeManagedSites(raw);
        return managedSitesCache;
      })
      .finally(() => { managedSitesRequest = null; });
  }
  return managedSitesRequest;
}

export function acceptSiteInvitation(payload: {
  invitationId: string;
  email: string;
  password: string;
  confirmPassword: string;
}) {
  return apiFetch<unknown>("/api/v1/auth/site/invitations/accept", { method: "POST", body: payload });
}

export function login(payload: LoginPayload) {
  return apiFetch<SiteLoginResponse>("/api/v1/auth/site/login", { method: "POST", body: payload });
}

export function logout() {
  return apiFetch<void>("/api/v1/auth/site/logout", { method: "POST" });
}

export function me() {
  return apiFetch<SiteUser>("/api/v1/auth/site/me");
}

export function changePassword(payload: ChangePasswordPayload) {
  return apiFetch<{ changedAt: string }>("/api/v1/auth/site/password", { method: "PUT", body: payload });
}

/** 내 정보(이름·연락처) 수정 */
export function updateProfile(payload: UpdateProfilePayload) {
  return apiFetch<SiteUser>("/api/v1/auth/site/me", { method: "PATCH", body: payload });
}

export interface AdminLoginResponse { user: { userId: string; name: string; role: "HQ_MANAGER" | "SITE_MANAGER" | string; membershipStatus?: "JOINED" | "UNASSIGNED" | string }; siteId?: string | null; sites?: { siteId: string; siteName: string }[]; membershipStatus?: "JOINED" | "UNASSIGNED" | string }
export function adminLogin(payload: LoginPayload) {
  return apiFetch<AdminLoginResponse>("/api/v1/auth/admin/login", { method: "POST", body: payload });
}
