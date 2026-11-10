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

const inputCls =
  "h-[38px] rounded border border-[var(--color-border)] bg-[var(--color-bg-app)] px-3 text-sm text-[var(--color-text-heading)] outline-none focus:border-[var(--color-accent)]";

const EMPTY_FORM = { siteName: "", managerName: "", managerPhone: "" };
const PHONE_RE = /^0\d{1,2}-?\d{3,4}-?\d{4}$/;

function formatPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";
  if (digits.startsWith("02")) {
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `02-${digits.slice(2)}`;
    return `02-${digits.slice(2, -4)}-${digits.slice(-4)}`;
  }
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, -4)}-${digits.slice(-4)}`;
}

function makeInvitationUrl(invitationId: string) {
  const url = new URL("/site-invitation", window.location.origin);
  url.searchParams.set("invitationId", invitationId);
  return url.toString();
}

function formatExpiry(value?: string) {
  if (!value) return "발급 후 7일 동안 사용할 수 있어요.";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "발급 후 7일 동안 사용할 수 있어요." : `만료 시각: ${new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(date)}`;
}

export default function ScreenHQSites() {
  const { showToast } = useToast();
  const [adding, setAdding] = useState(false);
  const [sites, setSites] = useState<HqSite[] | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [invitation, setInvitation] = useState<{ siteId: string; siteName: string; invitationId: string; expiresAt?: string } | null>(null);
  const [invitationBusyId, setInvitationBusyId] = useState("");
  const [deleting, setDeleting] = useState<HqSite | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const closeAdd = () => {
    if (creating) return;
    setAdding(false);
    setForm(EMPTY_FORM);
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
    const v = { ...form, siteName: form.siteName.trim(), managerName: form.managerName.trim(), managerPhone: form.managerPhone.trim() };
    if (!v.siteName) return showToast("현장 이름을 입력해 주세요.", "error");
    if (!v.managerName) return showToast("현장관리자 이름을 입력해 주세요.", "error");
    if (!v.managerPhone) return showToast("현장관리자 전화번호를 입력해 주세요.", "error");
    if (!PHONE_RE.test(v.managerPhone)) return showToast("현장관리자 전화번호 형식을 확인해 주세요.", "error");

    setCreating(true);
    try {
      const result = await hqApi.createSite({ siteName: v.siteName, managerName: v.managerName, managerPhone: v.managerPhone });
      setForm(EMPTY_FORM);
      setAdding(false);
      const invitationId = result.managerInvitationId || result.invitationId;
      if (invitationId) {
        setInvitation({ siteId: result.siteId, siteName: v.siteName, invitationId, expiresAt: result.expiresAt });
        showToast("현장을 만들고 현장관리자 초대 링크를 발급했어요.", "success");
      } else {
        showToast("현장은 만들었지만 초대 ID를 받지 못했어요. 현장 목록에서 초대 링크를 다시 발급해주세요.", "error");
      }
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

  const handleReissueInvitation = async (site: Pick<HqSite, "id" | "name">) => {
    if (invitationBusyId) return;
    setInvitationBusyId(site.id);
    try {
      const result = await hqApi.createManagerInvitation(site.id);
      const invitationId = result.managerInvitationId || result.invitationId;
      if (!invitationId) throw new Error("초대 ID가 응답에 없어요.");
      setInvitation({ siteId: site.id, siteName: site.name, invitationId, expiresAt: result.expiresAt });
      showToast("새 현장관리자 초대 링크를 발급했어요.", "success");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        showToast("이미 현장관리자가 연결된 현장이에요.", "error");
      } else {
        showToast(errorMessage(err, "초대 링크를 발급하지 못했어요."), "error");
      }
    } finally {
      setInvitationBusyId("");
    }
  };

  const copyInvitation = async () => {
    if (!invitation) return;
    try {
      await navigator.clipboard.writeText(makeInvitationUrl(invitation.invitationId));
      showToast("초대 링크를 복사했어요.", "success");
    } catch {
      showToast("초대 링크를 선택해 직접 복사해주세요.", "error");
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
        <p className="pt-1 text-sm text-[var(--color-text-body)]">현장을 등록하고 앱 연동 상태를 확인합니다.</p>

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
                <div className="flex shrink-0 items-center gap-2">
                  <SiteHeatBadge temperature={site.temperature} label={heatLabel(site)} tone={heatTone(site)} />
                  <p className="w-20 text-right font-['JetBrains_Mono',monospace] text-xs text-[var(--color-text-body)]">오늘 {site.todayRecordCount}건</p>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  {!site.managerEmail && <button type="button" disabled={invitationBusyId === site.id} onClick={() => handleReissueInvitation(site)} className="rounded border border-[var(--color-accent)] px-3 py-1.5 text-xs text-[var(--color-accent)] disabled:opacity-60">{invitationBusyId === site.id ? "발급 중..." : "관리자 초대"}</button>}
                  <Link to={`/hq/sites/${encodeURIComponent(site.id)}`} className="rounded border border-[var(--color-checkbox-border)] px-3 py-1.5 text-xs text-[var(--color-text-label)]">
                    상세 · 연동 상태
                  </Link>
                  <button type="button" onClick={() => setDeleting(site)} className="rounded border border-[var(--color-danger-border)] bg-transparent px-3 py-1.5 text-xs text-[var(--color-danger-text)] transition-colors hover:bg-[var(--color-danger-text)] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-danger-text)]">
                    삭제
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <button type="button" onClick={() => setAdding(true)} className={`${btnPrimary} mt-6`}>현장 추가</button>

        {adding && (
          <ModalShell title="현장 추가" onClose={closeAdd} busy={creating} maxWidth={600} backdropClassName="bg-black/30"
            footer={<>
              <button type="button" onClick={closeAdd} disabled={creating} className={btnSecondary}>취소</button>
              <button type="submit" form="add-site" disabled={creating} className={btnPrimary}>{creating ? "추가 중..." : "현장 추가"}</button>
            </>}
          >
            <form id="add-site" onSubmit={handleCreate} noValidate>
              <p className="mb-4 text-xs leading-5 text-[var(--color-text-body)]">현장관리자 전화번호는 앱에서 초대를 수락할 때 본인 확인에 사용합니다.</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-[var(--color-text-body)]">현장 이름 *</span>
                  <input disabled={creating} className={inputCls} value={form.siteName} onChange={setField("siteName")} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-[var(--color-text-body)]">현장관리자 이름 *</span>
                  <input disabled={creating} className={inputCls} value={form.managerName} onChange={setField("managerName")} autoComplete="off" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-[var(--color-text-body)]">현장관리자 전화번호 *</span>
                  <input
                    disabled={creating}
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={13}
                    className={inputCls}
                    value={form.managerPhone}
                    onChange={(event) => setForm((previous) => ({ ...previous, managerPhone: formatPhoneNumber(event.target.value) }))}
                    placeholder="010-0000-0000"
                  />
                </label>
              </div>
            </form>
          </ModalShell>
        )}

        {invitation && (
          <ModalShell title={`${invitation.siteName} 현장관리자 초대`} onClose={() => setInvitation(null)} maxWidth={600} backdropClassName="bg-black/30"
            footer={<button type="button" onClick={() => setInvitation(null)} className={btnSecondary}>닫기</button>}
          >
            <p className="text-sm leading-6 text-[var(--color-text-body)]">이 링크를 현장관리자에게 전달해주세요. 초대를 수락하면 기존 현장이 연결되고 새 현장은 생성되지 않습니다.</p>
            <p className="text-xs text-[var(--color-text-faint)]">{formatExpiry(invitation.expiresAt)}</p>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-[var(--color-text-body)]">초대 링크</span>
              <input readOnly className={`${inputCls} w-full`} value={makeInvitationUrl(invitation.invitationId)} onFocus={(event) => event.currentTarget.select()} />
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={copyInvitation} className={btnPrimary}>링크 복사</button>
              <button type="button" onClick={() => { const site = sites?.find((item) => item.id === invitation.siteId); if (site) void handleReissueInvitation(site); }} className={btnSecondary}>새 링크 발급</button>
            </div>
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
