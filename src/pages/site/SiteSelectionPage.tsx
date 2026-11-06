import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import HomeLayout from "../../components/home/HomeLayout";
import { authApi, errorMessage, type ManagedSite } from "../../api";
import { setSelectedSiteId } from "../../lib/siteSelection";

export default function SiteSelectionPage() {
  const [sites, setSites] = useState<ManagedSite[] | null>(null);
  const [error, setError] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const from = (location.state as { from?: string } | null)?.from;

  useEffect(() => {
    let alive = true;
    authApi.listManagedSites({ refresh: true }).then((items) => {
      if (alive) setSites(items);
    }).catch((err) => {
      if (alive) setError(errorMessage(err, "현장 목록을 불러오지 못했어요."));
    });
    return () => { alive = false; };
  }, []);

  const select = (siteId: string) => {
    setSelectedSiteId(siteId);
    navigate(from?.startsWith("/manager/") ? from : "/manager", { replace: true });
  };

  return (
    <HomeLayout>
      <section className="w-full max-w-3xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 md:p-8">
        <p className="text-sm font-medium text-[var(--color-accent)]">현장 전환</p>
        <h1 className="mt-1 text-2xl font-semibold text-[var(--color-text-heading)]">관리할 현장을 선택해주세요</h1>
        <p className="mt-2 text-sm text-[var(--color-text-body)]">선택한 현장의 기록과 팀 정보만 표시됩니다.</p>
        {error ? <div role="alert" className="mt-6 rounded-xl bg-[var(--color-danger-soft-bg)] p-4 text-sm text-[var(--color-danger-text)]">{error}</div> : null}
        {!sites && !error ? <div role="status" className="mt-8 text-sm text-[var(--color-text-body)]">현장 목록을 불러오는 중...</div> : null}
        {sites?.length === 0 ? <p className="mt-8 rounded-xl bg-[var(--home-main-bg)] p-5 text-sm text-[var(--color-text-body)]">연결된 현장이 없어요. 본사 관리자에게 초대를 요청해주세요.</p> : null}
        {sites && sites.length > 0 ? <div className="mt-6 grid gap-3 sm:grid-cols-2">{sites.map((site) => (
          <button key={site.siteId} type="button" onClick={() => select(site.siteId)} className="rounded-xl border border-[var(--color-border)] bg-[var(--home-main-bg)] p-5 text-left transition hover:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]">
            <span className="block text-base font-semibold text-[var(--color-text-heading)]">{site.siteName}</span>
            <span className="mt-1 block text-xs text-[var(--color-text-body)]">이 현장으로 이동</span>
          </button>
        ))}</div> : null}
      </section>
    </HomeLayout>
  );
}
