import { useEffect, useState } from "react";
import { authApi, siteApi, isDemoFallback } from "../api";

interface MeResponse {
  brand: string;
  user: { name: string };
  site: { name: string };
}

/** 불러오기 전/실패 시 표시값 — 실제 사람 이름처럼 보이는 가짜 값을 쓰지 않는다. */
const PLACEHOLDER: MeResponse = {
  brand: "현장가드",
  user: { name: "관리자" },
  site: { name: "" },
};

const DEMO: MeResponse = {
  brand: "현장가드",
  user: { name: "김철수" },
  site: { name: "인천 복합물류센터" },
};

let cache: MeResponse | null = null;
let inFlight: Promise<MeResponse> | null = null;

/** 로그인/로그아웃 시 이전 사용자 정보가 남지 않도록 비운다. */
export function clearSiteMeCache() {
  cache = null;
  inFlight = null;
}

async function loadMe(): Promise<MeResponse> {
  if (cache) return cache;
  if (!inFlight) {
    inFlight = Promise.all([authApi.me(), siteApi.getProfile()])
      .then(([user, profile]) => {
        cache = { brand: "현장가드", user: { name: user.name }, site: { name: profile.siteName } };
        return cache;
      })
      .catch((err) => {
        if (isDemoFallback(err)) {
          cache = DEMO;
          return DEMO;
        }
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
    return () => {
      alive = false;
    };
  }, []);

  return me;
}
