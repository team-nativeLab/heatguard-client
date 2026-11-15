import { authApi } from "../api";

export type Membership = "joined" | "unassigned";

/**
 * 현장 관리자의 본사·현장 연결 상태.
 *
 * 화면 이동마다 서버에 다시 묻지 않도록 한 번 확인한 값을 기억한다.
 * 현장 생성·초대 수락처럼 상태를 바꾸는 요청은 응답으로 이 값을 갱신해,
 * 서버 세션이 갱신되기 전에 조회해서 이전 값을 받는 일이 없도록 한다.
 */
let cache: Membership | null = null;
let inFlight: Promise<Membership> | null = null;

export function getCachedMembership() {
  return cache;
}

/** 현장 생성·초대 수락 응답으로 확인된 상태를 기록한다. */
export function setMembership(next: Membership) {
  cache = next;
  inFlight = null;
}

/** 로그인·로그아웃·세션 만료 시 이전 사용자의 상태가 남지 않도록 비운다. */
export function clearMembership() {
  cache = null;
  inFlight = null;
}

function toMembership(status: string | undefined): Membership {
  return status === "UNASSIGNED" ? "unassigned" : "joined";
}

/** 캐시가 있으면 그대로, 없으면 서버에서 한 번만 조회한다. */
export function loadMembership(): Promise<Membership> {
  if (cache) return Promise.resolve(cache);
  if (!inFlight) {
    inFlight = authApi
      .me()
      .then((user) => {
        cache = toMembership(user.membershipStatus);
        return cache;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}
