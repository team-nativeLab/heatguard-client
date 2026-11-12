import { useEffect, useState } from "react";
import { authApi, siteApi, profilePhotoApi } from "../api";

interface MeResponse {
  brand: string;
  user: { name: string; email: string; phone?: string; photoUrl?: string | null };
  site: { name: string };
}

/** 불러오기 전/실패 시 표시값 — 실제 사람 이름처럼 보이는 가짜 값을 쓰지 않는다. */
const PLACEHOLDER: MeResponse = {
  brand: "폭염가드",
  user: { name: "관리자", email: "" },
  site: { name: "" },
};

let cache: MeResponse | null = null;
let inFlight: Promise<MeResponse> | null = null;
const listeners = new Set<(me: MeResponse) => void>();

/** 이름·연락처 변경 직후 사이드바/계정 화면에 바로 반영한다. */
export function patchSiteMeUser(patch: Partial<MeResponse["user"]>) {
  const base = cache ?? PLACEHOLDER;
  cache = { ...base, user: { ...base.user, ...patch } };
  listeners.forEach((fn) => fn(cache!));
}

/**
 * 조회 URL이 만료돼 사진이 뜨지 않을 때 새 URL을 받아온다.
 * 같은 URL이 다시 와도 무한 재시도하지 않도록 한 번만 교체한다.
 */
let refreshingPhoto = false;
export async function refreshSiteMePhoto() {
  if (refreshingPhoto) return;
  refreshingPhoto = true;
  try {
    const photo = await profilePhotoApi.getSiteProfilePhoto();
    if (photo.photoUrl !== (cache?.user.photoUrl ?? null)) patchSiteMeUser({ photoUrl: photo.photoUrl });
  } catch {
    // 재조회 실패 시에는 기본 이미지를 유지한다.
  } finally {
    refreshingPhoto = false;
  }
}

/** 로그인/로그아웃 시 이전 사용자 정보가 남지 않도록 비운다. */
export function clearSiteMeCache() {
  cache = null;
  inFlight = null;
}

async function loadMe(): Promise<MeResponse> {
  if (cache) return cache;
  if (!inFlight) {
    inFlight = Promise.all([
      authApi.me(),
      siteApi.getProfile(),
      // 사진은 없을 수도, 아직 배포되지 않았을 수도 있다. 실패해도 나머지는 보여준다.
      profilePhotoApi.getSiteProfilePhoto().catch(() => null),
    ])
      .then(([user, profile, photo]) => {
        cache = {
          brand: "폭염가드",
          user: {
            name: user.name,
            email: user.email,
            phone: profile.manager?.phone ?? (user as { phone?: string }).phone,
            photoUrl: photo?.photoUrl ?? null,
          },
          site: { name: profile.siteName },
        };
        return cache;
      })
      .catch((err) => {
        void err;
        // 실패는 캐시하지 않아 다음 화면에서 다시 시도한다.
        return PLACEHOLDER;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}

export function useSiteMe() {
  const [me, setMe] = useState<MeResponse>(cache ?? PLACEHOLDER);

  useEffect(() => {
    let alive = true;
    loadMe().then((res) => {
      if (alive) setMe(res);
    });
    const onPatch = (res: MeResponse) => setMe(res);
    listeners.add(onPatch);
    return () => {
      alive = false;
      listeners.delete(onPatch);
    };
  }, []);

  return me;
}
