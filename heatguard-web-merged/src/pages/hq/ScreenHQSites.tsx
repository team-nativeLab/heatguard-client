import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import HQLayout, { HQContent } from "../../components/hq/HQLayout";
import { SiteHeatBadge } from "../../components/hq/RecordTable";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "../../components/hq/LoadState";
import ConfirmDialog from "../../shared/ui/ConfirmDialog";
import { useToast } from "../../shared/ui/Toast";
import { hqApi, ApiError, errorMessage, type HqSite } from "../../api";
import { heatLabel, heatTone, sortByRisk } from "../../lib/hqFormat";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const inputCls =
  "h-[38px] rounded border border-[var(--color-border)] bg-[var(--color-bg-app)] px-3 text-sm text-[var(--color-text-heading)] outline-none focus:border-[var(--color-accent)]";

const EMPTY_FORM = { siteName: "", managerName: "", managerEmail: "", initialPassword: "" };

export default function ScreenHQSites() {
  const { showToast } = useToast();
  const [sites, setSites] = useState<HqSite[] | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<HqSite | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      setSites(sortByRisk(await hqApi.listAllSites()));
    } catch (err) {
      setError(errorMessage(err, "현장 목록을 불러오지 못했어요."));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setField = (key: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (creating) return;
    const v = { ...form, siteName: form.siteName.trim(), managerName: form.managerName.trim(), managerEmail: form.managerEmail.trim() };
    if (!v.siteName) return window.alert("현장 이름을 입력해 주세요.");
    if (!v.managerName) return window.alert("현장관리자 이름을 입력해 주세요.");
    if (!EMAIL_RE.test(v.managerEmail)) return window.alert("이메일 형식을 확인해 주세요.");
    if (v.initialPassword.length < 8) return window.alert("초기 비밀번호는 8자 이상 입력해 주세요.");

    setCreating(true);
    try {
      await hqApi.createSite({ ...v, initialPassword: form.initialPassword });
      setForm(EMPTY_FORM);
      showToast("현장과 관리자 계정을 만들었어요.", "success");
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        window.alert("이미 사용 중인 이메일이거나 중복된 정보예요. 입력한 내용을 확인해 주세요.");
      } else {
        window.alert(errorMessage(err, "현장 생성에 실패했어요."));
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting || deleteBusy) return;
    setDeleteBusy(true);
    try {
      await hqApi.deactivateSite(deleting.id);
      showToast(`'${deleting.name}' 현장을 비활성화했어요.`, "success");
      setDeleting(null);
      await load();
    } catch (err) {
      showToast(errorMessage(err, "현장 삭제에 실패했어요."), "error");
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <HQLayout>
      <HQContent>
        <h1 className="text-xl font-semibold text-[var(--color-text-heading)]">현장 관리</h1>
        <p className="pt-1 text-sm text-[var(--color-text-body)]">현장 목록 및 계정 생성</p>

        <div className="flex flex-col gap-2 pt-8">
          {error ? (
            <ErrorBlock message={error} onRetry={load} />
          ) : sites === null ? (
            <LoadingBlock />
          ) : sites.length === 0 ? (
            <EmptyBlock>등록된 현장이 없어요. 아래에서 현장을 추가해 주세요.</EmptyBlock>
          ) : (
            sites.map((site) => (
              <div key={site.id} className="flex min-h-[74px] items-center gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="whitespace-nowrap text-sm font-medium text-[var(--color-text-heading)]">{site.name}</p>
                    {(site.emergency || site.heatLevel === 3) && (
                      <span className="rounded border border-[var(--color-danger-border)] bg-[var(--color-danger-soft-bg)] px-1.5 py-0.5 text-[10px] text-[var(--color-danger-text)]">긴급</span>
                    )}
                  </div>
                  <p className="pt-1 text-xs text-[var(--color-text-body)]">
                    {[site.managerName, site.managerEmail, site.teamCount != null ? `팀 ${site.teamCount}개` : ""].filter(Boolean).join(" · ") || "-"}
                  </p>
                </div>
                <SiteHeatBadge temperature={site.temperature} label={heatLabel(site)} tone={heatTone(site)} />
                <p className="w-20 text-right font-['JetBrains_Mono',monospace] text-xs text-[var(--color-text-body)]">오늘 {site.todayRecordCount}건</p>
                <div className="flex gap-2">
                  <Link to={`/hq/sites/${encodeURIComponent(site.id)}`} className="rounded border border-[var(--color-checkbox-border)] px-3 py-1.5 text-xs text-[var(--color-text-label)]">
                    상세
                  </Link>
                  <button type="button" onClick={() => setDeleting(site)} className="rounded border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text-body)] transition hover:border-[var(--color-danger-border)] hover:text-[var(--color-danger-text)]">
                    삭제
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleCreate} noValidate className="mt-10 border-t border-[var(--color-border)] pt-8">
          <h2 className="text-sm font-medium text-[var(--color-text-heading)]">현장 추가</h2>
          <div className="grid max-w-[576px] grid-cols-1 gap-4 py-5 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-[var(--color-text-body)]">현장 이름</span>
              <input className={inputCls} value={form.siteName} onChange={setField("siteName")} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-[var(--color-text-body)]">현장관리자 이름</span>
              <input className={inputCls} value={form.managerName} onChange={setField("managerName")} autoComplete="off" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-[var(--color-text-body)]">이메일</span>
              <input className={inputCls} type="email" value={form.managerEmail} onChange={setField("managerEmail")} autoComplete="off" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-[var(--color-text-body)]">초기 비밀번호 (8자 이상)</span>
              <input className={inputCls} type="password" value={form.initialPassword} onChange={setField("initialPassword")} autoComplete="new-password" />
            </label>
          </div>
          <button type="submit" disabled={creating} className="rounded bg-[var(--color-accent)] px-3 py-1.5 text-[11px] font-medium text-white transition hover:brightness-110 disabled:opacity-60">
            {creating ? "생성 중..." : "현장 ・ 계정 생성"}
          </button>
        </form>
      </HQContent>

      {deleting && (
        <ConfirmDialog
          title="현장을 삭제할까요?"
          description={`'${deleting.name}' 현장이 비활성화돼요. 기존 기록은 그대로 보존돼요.`}
          confirmLabel="삭제"
          destructive
          busy={deleteBusy}
          onCancel={() => setDeleting(null)}
          onConfirm={handleDelete}
        />
      )}
    </HQLayout>
  );
}
