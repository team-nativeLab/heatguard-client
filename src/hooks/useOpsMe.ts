import { useEffect, useState } from "react";
import { opsApi, type OpsUser } from "../api";

let cache: OpsUser | null = null;
let inFlight: Promise<OpsUser> | null = null;

/** 로그아웃·로그인·세션 만료 시 캐시 비우기 */
export function clearOpsMeCache() {
  cache = null;
  inFlight = null;
}

function load(): Promise<OpsUser> {
  if (cache) return Promise.resolve(cache);
  if (!inFlight) {
    inFlight = opsApi
      .me()
      .then((user) => (cache = user))
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}

/**
 * 로그인한 운영자. 불러오는 중이면 null.
 * 페이지를 옮겨도 다시 받지 않아서 상단 이름이 깜빡이지 않는다.
 */
export function useOpsMe(): OpsUser | null {
  const [me, setMe] = useState<OpsUser | null>(cache);
  useEffect(() => {
    let alive = true;
    load()
      .then((user) => alive && setMe(user))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return me;
}
