import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ApiError, DEMO_MODE, isNetworkError } from "../api/client";

import { sessionStatus, type AuthScope, type Status } from "./authScope";

/**
 * 로그인해야 볼 수 있는 화면을 감싼다.
 * - 로그인 안 됨(401) → 로그인 화면으로 이동
 * - 서버 미연결 → 데모 모드면 통과, 아니면 연결 오류 화면
 */
export default function RequireAuth({
  check,
  loginPath,
  scope = "site",
  children,
}: {
  check: () => Promise<unknown>;
  loginPath: string;
  scope?: AuthScope;
  children: ReactNode;
}) {
  const location = useLocation();
  const [status, setStatus] = useState<Status>(sessionStatus[scope] === "authed" ? "authed" : "checking");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (sessionStatus[scope] === "authed") return;
    let alive = true;
    check()
      .then(() => {
        sessionStatus[scope] = "authed";
        if (alive) setStatus("authed");
      })
      .catch((err) => {
        if (!alive) return;
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          sessionStatus[scope] = "guest";
          setStatus("guest");
        } else if (isNetworkError(err) && DEMO_MODE) {
          setStatus("authed");
        } else {
          setStatus("offline");
        }
      });
    return () => {
      alive = false;
    };
  }, [check, attempt, scope]);

  if (status === "guest") {
    return <Navigate to={loginPath} replace state={{ from: location.pathname + location.search }} />;
  }

  if (status === "offline") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--home-main-bg)] px-6 text-center">
        <p className="text-base font-semibold text-[var(--color-text-heading)]">서버에 연결할 수 없어요</p>
        <p className="text-sm text-[var(--color-text-body)]">네트워크 상태를 확인한 뒤 다시 시도해주세요.</p>
        <button
          type="button"
          onClick={() => {
            setStatus("checking");
            setAttempt((n) => n + 1);
          }}
          className="mt-2 h-9 rounded-lg bg-[var(--color-accent)] px-4 text-sm font-medium text-white transition hover:brightness-110"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (status === "checking") {
    return (
      <div role="status" aria-label="로그인 확인 중" className="flex min-h-screen items-center justify-center bg-[var(--home-main-bg)]">
        <span className="size-6 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)]" />
      </div>
    );
  }

  return <>{children}</>;
}
