import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import ModalShell, { btnPrimary, btnSecondary } from "../../components/home/ModalShell";
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

const EMPTY_FORM = { siteName: "", managerName: "", managerPhone: "", managerEmail: "", initialPassword: "" };

export default function ScreenHQSites() {
  const { showToast } = useToast();
  const [adding, setAdding] = useState(false);
  const [sites, setSites] = useState<HqSite[] | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createWebAccount, setCreateWebAccount] = useState(false);
  const [deleting, setDeleting] = useState<HqSite | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const closeAdd = () => {
    if (creating) return;
    setAdding(false);
    setForm(EMPTY_FORM);
    setCreateWebAccount(false);
  };

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
    if (!v.siteName) return showToast("현장 이름을 입력해 주세요.", "error");
    if (!v.managerName) return showToast("현장관리자 이름을 입력해 주세요.", "error");
    const managerPhone = v.managerPhone.replace(/\D/g, "").replace(/^82/, "0");
    if (!/^0\d{8,10}$/.test(managerPhone)) return showToast("담당자 전화번호를 확인해 주세요.", "error");
    if (createWebAccount && !EMAIL_RE.test(v.managerEmail)) return showToast("이메일 형식을 확인해 주세요.", "error");
    if (createWebAccount && v.initialPassword.length < 8) return showToast("초기 비밀번호는 8자 이상 입력해 주세요.", "error");

    setCreating(true);
    try {
      await hqApi.createSite({ siteName: v.siteName, managerName: v.managerName, managerPhone,
        ...(createWebAccount ? { managerEmail: v.managerEmail, initialPassword: form.initialPassword } : {}) });
      setForm(EMPTY_FORM);
      setCreateWebAccount(false);
      setAdding(false);
      showToast("현장을 만들었어요. 팀 등록 후 상세 화면에서 팀 초대 링크를 발급해 주세요.", "success");
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        showToast("이미 사용 중인 이메일이거나 중복된 정보예요. 입력한 내용을 확인해 주세요.", "error");
      } else {
        showToast(errorMessage(err, "현장 생성에 실패했어요."), "error");
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
        <p className="pt-1 text-sm text-[var(--color-text-body)]">현장 생성 및 앱 팀 초대</p>

        <div className="flex flex-col gap-2 pt-8">
          {error ? (
            <ErrorBlock message={error} onRetry={load} />
          ) : sites === null ? (
            <LoadingBlock />
          ) : sites.length === 0 ? (
            <EmptyBlock>등록된 현장이 없어요. 현장 추가 버튼으로 현장을 등록해 주세요.</EmptyBlock>
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
                    {[site.managerName, site.managerPhone, site.managerEmail, site.teamCount != null ? `팀 ${site.teamCount}개` : ""].filter(Boolean).join(" · ") || "-"}
                  </p>
                </div>
                <SiteHeatBadge temperature={site.temperature} label={heatLabel(site)} tone={heatTone(site)} />
                <p className="w-20 text-right font-['JetBrains_Mono',monospace] text-xs text-[var(--color-text-body)]">오늘 {site.todayRecordCount}건</p>
                <div className="flex gap-2">
                  <Link to={`/hq/sites/${encodeURIComponent(site.id)}`} className="rounded border border-[var(--color-checkbox-border)] px-3 py-1.5 text-xs text-[var(--color-text-label)]">
                    상세 · 팀 초대
                  </Link>
                  <button type="button" onClick={() => setDeleting(site)} className="rounded border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text-body)] transition hover:border-[var(--color-danger-border)] hover:text-[var(--color-danger-text)]">
                    삭제
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <button type="button" onClick={() => setAdding(true)} className={`${btnPrimary} mt-6`}>현장 추가</button>

        {adding && (
          <ModalShell title="현장 추가" onClose={closeAdd} busy={creating} maxWidth={600}
            footer={<>
              <button type="button" onClick={closeAdd} disabled={creating} className={btnSecondary}>취소</button>
              <button type="submit" form="add-site" disabled={creating} className={btnPrimary}>{creating ? "추가 중..." : "현장 추가"}</button>
            </>}
          >
            <form id="add-site" onSubmit={handleCreate} noValidate>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-[var(--color-text-body)]">현장 이름</span>
                  <input disabled={creating} className={inputCls} value={form.siteName} onChange={setField("siteName")} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-[var(--color-text-body)]">현장관리자 이름</span>
                  <input disabled={creating} className={inputCls} value={form.managerName} onChange={setField("managerName")} autoComplete="off" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-[var(--color-text-body)]">담당자 전화번호</span>
                  <input disabled={creating} className={inputCls} type="tel" placeholder="010-1234-5678" value={form.managerPhone} onChange={setField("managerPhone")} />
                </label>
                <label className="flex items-center gap-2 text-sm text-[var(--color-text-body)]">
                  <input type="checkbox" disabled={creating} checked={createWebAccount} onChange={(e) => setCreateWebAccount(e.target.checked)} />
                  웹 관리자 로그인 계정도 만들기 (선택)
                </label>
                {createWebAccount && <>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-[var(--color-text-body)]">이메일</span>
                  <input disabled={creating} className={inputCls} type="email" value={form.managerEmail} onChange={setField("managerEmail")} autoComplete="off" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-[var(--color-text-body)]">초기 비밀번호 (8자 이상)</span>
                  <input disabled={creating} className={inputCls} type="password" value={form.initialPassword} onChange={setField("initialPassword")} autoComplete="new-password" />
                </label>
                </>}
              </div>
            </form>
          </ModalShell>
        )}
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
