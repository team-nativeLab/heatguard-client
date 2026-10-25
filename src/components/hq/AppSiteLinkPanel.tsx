import { useCallback, useEffect, useRef, useState } from "react";
import { hqApi, errorMessage } from "../../api";
import type { SiteAppLink } from "../../api/hq";
import { btnPrimary, btnSecondary } from "../home/ModalShell";
import ConfirmDialog from "../../shared/ui/ConfirmDialog";
import { useToast } from "../../shared/ui/Toast";

export default function AppSiteLinkPanel({ siteId, active }: { siteId: string; active: boolean }) {
  const { showToast } = useToast();
  const [items, setItems] = useState<SiteAppLink[] | null>(null);
  const [error, setError] = useState("");
  const [invitation, setInvitation] = useState<{ linkUrl: string; expiresAt: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<SiteAppLink | null>(null);
  const mounted = useRef(false);
  const load = useCallback(async () => {
    setError("");
    try {
      const result = await hqApi.listSiteAppLinks(siteId);
      if (mounted.current) setItems(result.items);
    } catch (err) {
      if (mounted.current) setError(errorMessage(err, "앱 연동 정보를 불러오지 못했어요."));
    }
  }, [siteId]);
  useEffect(() => {
    mounted.current = true;
    void load();
    return () => { mounted.current = false; };
  }, [load]);

  async function generate() {
    if (busy) return;
    setBusy(true);
    try {
      const result = await hqApi.createSiteAppLink(siteId);
      if (mounted.current) setInvitation(result);
    } catch (err) {
      showToast(errorMessage(err, "링크 발급에 실패했어요. 현장의 담당자 전화번호 등록 여부를 확인해 주세요."), "error");
    } finally { if (mounted.current) setBusy(false); }
  }

  async function copy() {
    if (!invitation) return;
    try {
      await navigator.clipboard.writeText(invitation.linkUrl);
      showToast("링크를 복사했어요. 담당자에게 전달해 주세요.", "success");
    } catch { showToast("링크 입력칸을 선택해 직접 복사해 주세요.", "error"); }
  }

  async function share() {
    if (!invitation) return;
    try { await navigator.share({ title: "폭염가드 현장 연동", url: invitation.linkUrl }); }
    catch (err) { if (!(err instanceof DOMException && err.name === "AbortError")) showToast("공유하지 못했어요. 링크를 복사해 전달해 주세요.", "error"); }
  }

  async function unlink() {
    if (!removing || busy) return;
    setBusy(true);
    try {
      await hqApi.unlinkSiteAppAccount(siteId, removing.userId);
      if (!mounted.current) return;
      setRemoving(null);
      showToast("이 현장의 앱 연동을 해제했어요.", "success");
      await load();
    } catch (err) { showToast(errorMessage(err, "연동 해제에 실패했어요."), "error"); }
    finally { if (mounted.current) setBusy(false); }
  }

  return <section className="mt-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 text-sm text-[var(--color-text-body)]">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="font-semibold text-[var(--color-text-heading)]">앱 계정 연동</h2>
      <button type="button" className={btnSecondary} onClick={() => void load()} disabled={busy}>새로고침</button>
    </div>
    <p className="py-3">담당자에게 링크를 전달해 주세요. 앱에 로그인한 뒤 현장에 등록한 전화번호를 입력하면 연동돼요.</p>
    <button type="button" className={btnPrimary} disabled={busy || !active} onClick={() => void generate()}>{busy ? "처리 중..." : "연동 링크 발급"}</button>
    {!active && <p className="pt-2">비활성 현장은 연동 링크를 발급할 수 없어요.</p>}
    {invitation && <div className="mt-4 flex flex-col gap-2">
      <label className="flex flex-col gap-1">연동 링크
        <input className="w-full rounded border border-[var(--color-border)] bg-[var(--color-bg-app)] p-2" readOnly value={invitation.linkUrl} onFocus={(e) => e.currentTarget.select()} />
      </label>
      <p>유효기간: {new Date(invitation.expiresAt).toLocaleString("ko-KR")} · 한 번 연동하면 사용할 수 없어요.</p>
      <div className="flex gap-2">
        <button type="button" className={btnSecondary} onClick={() => void copy()}>링크 복사</button>
        {typeof navigator.share === "function" && <button type="button" className={btnSecondary} onClick={() => void share()}>공유하기</button>}
      </div>
      <p>복사한 링크를 카카오톡이나 문자 등으로 직접 전달해 주세요.</p>
    </div>}
    {error ? <div role="alert" className="pt-4">{error}</div> : items === null ? <p className="pt-4">연동 정보 불러오는 중...</p> : <div className="pt-4">
      <p className="pb-2">{items.some((item) => item.status === "LINKED") ? "연동됨" : "미연동"}</p>
      {items.map((item) => <div key={item.userId} className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] py-3">
        <span>{item.email} · {item.status === "LINKED" ? "연동됨" : "연동 해제됨"}</span>
        {item.status === "LINKED" && <button type="button" className={btnSecondary} disabled={busy} onClick={() => setRemoving(item)}>연동 해제</button>}
      </div>)}
    </div>}
    {removing && <ConfirmDialog title="앱 연동을 해제할까요?" description={`${removing.email} 계정은 이 현장에 접근할 수 없게 돼요. 다른 현장의 연동은 유지돼요.`} confirmLabel="연동 해제" destructive busy={busy} onCancel={() => setRemoving(null)} onConfirm={() => void unlink()} />}
  </section>;
}
