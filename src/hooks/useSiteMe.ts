import { useEffect, useState } from "react";
import { authApi, siteApi } from "../api";

interface MeResponse {
  brand: string;
  user: { name: string };
  site: { name: string };
}

const FALLBACK: MeResponse = {
  brand: "폭염가드 - 현장",
  user: { name: "김철수" },
  site: { name: "인천 복합물류센터" },
};

let cache: MeResponse | null = null;
let inFlight: Promise<MeResponse> | null = null;

async function loadMe(): Promise<MeResponse> {
  if (cache) return cache;
  if (!inFlight) {
    inFlight = Promise.all([authApi.me(), siteApi.getProfile()])
      .then(([user, profile]) => {
        const res: MeResponse = {
          brand: "폭염가드 - 현장",
          user: { name: user.name },
          site: { name: profile.siteName },
        };
        cache = res;
        return res;
      })
      .catch(() => {

        cache = FALLBACK;
        return FALLBACK;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}

export function useSiteMe() {
  const [me, setMe] = useState<MeResponse>(cache ?? FALLBACK);

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
