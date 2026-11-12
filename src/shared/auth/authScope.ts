export type Status = "checking" | "authed" | "guest" | "offline";

// 한 번 확인한 로그인 상태는 페이지 이동마다 다시 묻지 않는다.
// 현장·본사 세션은 서로 분리되어 있으므로 따로 기억한다.
export type AuthScope = "site" | "hq";

export const sessionStatus: Record<AuthScope, Status> = { site: "checking", hq: "checking" };

/** 로그인 성공 직후 호출 — 가드가 다시 확인하지 않도록 */
export function markSignedIn(scope: AuthScope = "site") {
  sessionStatus[scope] = "authed";
}

/** 로그아웃·세션 만료 시 호출 */
export function markSignedOut(scope: AuthScope = "site") {
  sessionStatus[scope] = "guest";
}
