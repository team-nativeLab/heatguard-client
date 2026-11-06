import { useEffect, useState } from "react";
import { errorMessage, hqApi, type HqSiteAppLinks } from "../../api";
import { btnSecondary } from "../home/ModalShell";

export default function SiteAppLinkStatusPanel({ siteId }: { siteId: string }) {
  const [result, setResult] = useState<HqSiteAppLinks | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    hqApi.getSiteAppLinks(siteId).then((data) => {
      if (alive) setResult(data);
    }).catch((err) => {
      if (alive) setError(errorMessage(err, "앱 연동 상태를 불러오지 못했어요."));
    }).finally(() => {
      if (alive) setLoading(false);
    });
    return () => { alive = false; };
  }, [siteId, attempt]);

  const linked = result?.items?.filter((item) => item.status === "LINKED") ?? [];
  const isLinked = result?.status === "LINKED" || linked.length > 0;

  return (
    <section className="mt-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 text-sm text-[var(--color-text-body)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-[var(--color-text-heading)]">앱 연동 상태</h2>
          <p className="pt-1 leading-6">현장관리자가 발급한 팀 초대 링크의 연결 상태를 확인합니다. 초대 링크 발급은 현장관리자가 현장 메뉴에서 진행합니다.</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${isLinked ? "bg-emerald-100 text-emerald-700" : "bg-[var(--color-bg-tile)] text-[var(--color-text-label)]"}`}>
          {loading ? "조회 중" : isLinked ? "연동됨" : "미연동"}
        </span>
      </div>

      {loading ? (
        <p className="pt-4 text-xs">연동 상태를 불러오는 중이에요.</p>
      ) : error ? (
        <div className="flex flex-wrap items-center gap-3 pt-4">
          <p role="alert" className="text-xs text-[var(--color-danger-text)]">{error}</p>
          <button type="button" className={btnSecondary} onClick={() => setAttempt((value) => value + 1)}>다시 시도</button>
        </div>
      ) : linked.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-2">
          {linked.map((item) => (
            <li key={item.userId || item.email} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-[var(--color-bg-tile)] px-3 py-2">
              <span className="text-[var(--color-text-heading)]">{item.email || "이메일 정보 없음"}</span>
              <span className="text-xs text-emerald-700">연동됨</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="pt-4 text-xs">연결된 앱 계정이 없습니다.</p>
      )}
    </section>
  );
}

