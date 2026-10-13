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
