import { apiFetch, ApiError, NetworkError } from "./client";

/** 서버가 허용하는 이미지 형식 (openapi: contentType enum) */
export const PROFILE_PHOTO_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
/** 서버가 허용하는 최대 크기 (openapi: size maximum) */
export const PROFILE_PHOTO_MAX_BYTES = 5 * 1024 * 1024;

export interface ProfilePhoto {
  /** 사진이 없으면 null. 조회 URL은 만료될 수 있다. */
  photoUrl: string | null;
  expiresAt: string | null;
}

interface UploadTicket {
  uploadId: string;
  uploadUrl: string;
  expiresAt: string;
  requiredHeaders: Record<string, string>;
}

/** 현재 등록된 프로필 사진과 조회 URL 만료 시각 */
export function getSiteProfilePhoto() {
  return apiFetch<ProfilePhoto>("/api/v1/auth/site/profile-photo");
}

/** 기본 이미지로 되돌린다. */
export function deleteSiteProfilePhoto() {
  return apiFetch<void>("/api/v1/auth/site/profile-photo", { method: "DELETE" });
}

function requestUploadTicket(file: File) {
  return apiFetch<UploadTicket>("/api/v1/auth/site/profile-photo/uploads", {
    method: "POST",
    body: { contentType: file.type, size: file.size },
  });
}

function registerUpload(uploadId: string) {
  return apiFetch<ProfilePhoto>("/api/v1/auth/site/profile-photo", {
    method: "PUT",
    body: { uploadId },
  });
}

/** 업로드 전 프론트에서 걸러내는 조건. 통과해도 서버가 다시 검사한다. */
export function getProfilePhotoFileError(file: File): string | undefined {
  if (!(PROFILE_PHOTO_CONTENT_TYPES as readonly string[]).includes(file.type)) {
    return "JPG, PNG, WEBP 파일만 올릴 수 있어요.";
  }
  if (file.size > PROFILE_PHOTO_MAX_BYTES) return "5MB 이하 이미지를 올려주세요.";
  if (file.size === 0) return "빈 파일은 올릴 수 없어요.";
  return undefined;
}

/**
 * 업로드 URL 발급 → 발급받은 URL로 파일 전송 → 등록 완료.
 *
 * 가운데 단계는 서버가 준 외부 저장소 URL로 직접 보내므로 apiFetch를 쓰지 않는다.
 * 로그인 쿠키를 다른 출처로 보내지 않기 위해 credentials도 붙이지 않는다.
 */
export async function uploadSiteProfilePhoto(file: File): Promise<ProfilePhoto> {
  const ticket = await requestUploadTicket(file);

  let res: Response;
  try {
    res = await fetch(ticket.uploadUrl, {
      method: "PUT",
      headers: { ...ticket.requiredHeaders, "Content-Type": file.type },
      body: file,
    });
  } catch {
    throw new NetworkError("사진을 전송하지 못했어요. 네트워크를 확인해주세요.");
  }
  if (!res.ok) throw new ApiError(res.status, "사진을 전송하지 못했어요. 다시 시도해주세요.");

  return registerUpload(ticket.uploadId);
}
