import { useEffect, useState } from "react";
import { hqApi, type HqProfile, type HqUser } from "../api";

export interface HqMe {
  user: HqUser;
  company: HqProfile;
}

let cache: HqMe | null = null;
let inFlight: Promise<HqMe> | null = null;
const listeners = new Set<(me: HqMe) => void>();

/** 로그아웃·세션 만료 시 캐시 비우기 */
export function clearHqMeCache() {
  cache = null;
  inFlight = null;
}

/** 연락처 변경 직후 화면에 바로 반영한다. */
export function patchHqCompany(patch: Partial<HqProfile>) {
  if (!cache) return;
  cache = { ...cache, company: { ...cache.company, ...patch } };
  listeners.forEach((fn) => fn(cache!));
}

function load(): Promise<HqMe> {
  if (cache) return Promise.resolve(cache);
  if (!inFlight) {
    inFlight = Promise.all([hqApi.me(), hqApi.getProfile()])
      .then(([user, company]) => (cache = { user, company }))
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}

/** 로그인한 본사 관리자와 소속 회사 정보. 불러오는 중이면 null */
export function useHqMe(): HqMe | null {
  const [me, setMe] = useState<HqMe | null>(cache);
  useEffect(() => {
    let alive = true;
    load()
      .then((res) => alive && setMe(res))
      .catch(() => {});
    const onPatch = (res: HqMe) => setMe(res);
    listeners.add(onPatch);
    return () => {
      alive = false;
      listeners.delete(onPatch);
    };
  }, []);
  return me;
}
