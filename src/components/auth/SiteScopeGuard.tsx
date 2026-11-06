import { useEffect, useState, type ReactNode } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { authApi, ApiError, errorMessage, type ManagedSite } from "../../api";
import { getSelectedSiteId, setSelectedSiteId } from "../../lib/siteSelection";

export default function SiteScopeGuard({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [sites, setSites] = useState<ManagedSite[] | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    setError("");
    authApi.listManagedSites({ refresh: attempt > 0 }).then((items) => {
      if (alive) setSites(items);
    }).catch((err) => {
      if (!alive) return;
      setError(err instanceof ApiError && (err.status === 401 || err.status === 403)
        ? "현장 관리자 로그인 또는 현장 연결을 확인해주세요."
        : errorMessage(err, "현장 목록을 불러오지 못했어요."));
    });
    return () => { alive = false; };
  }, [attempt]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--home-main-bg)] px-6 text-center">
        <p className="text-base font-semibold text-[var(--color-text-heading)]">현장 정보를 확인할 수 없어요</p>
        <p className="max-w-md text-sm text-[var(--color-text-body)]">{error}</p>
        <div className="mt-2 flex gap-3">
          <button type="button" onClick={() => setAttempt((n) => n + 1)} className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white">다시 시도</button>
          <Link to="/auth/login" className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm">로그인</Link>
        </div>
      </div>
    );
  }
  if (!sites) return <div role="status" aria-label="현장 확인 중" className="flex min-h-screen items-center justify-center bg-[var(--home-main-bg)]"><span className="size-6 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)]" /></div>;
  if (sites.length === 0) {
    return <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--home-main-bg)] px-6 text-center"><p className="text-base font-semibold text-[var(--color-text-heading)]">연결된 현장이 없어요</p><p className="text-sm text-[var(--color-text-body)]">본사 관리자에게 현장 초대를 요청해주세요.</p></div>;
  }

  const current = getSelectedSiteId();
  if (current && sites.some((site) => site.siteId === current)) return <>{children}</>;
  if (sites.length === 1) {
    setSelectedSiteId(sites[0].siteId);
    return <>{children}</>;
  }
  return <Navigate to="/manager/select-site" replace state={{ from: location.pathname + location.search }} />;
}
