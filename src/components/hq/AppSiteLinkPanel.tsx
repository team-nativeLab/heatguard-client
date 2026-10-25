import { useCallback, useEffect, useRef, useState } from "react";
import { hqApi, errorMessage } from "../../api";
import type { SiteAppLink } from "../../api/hq";
import { btnPrimary, btnSecondary } from "../home/ModalShell";
import { useToast } from "../../shared/ui/Toast";
import { usePolling } from "../../shared/hooks/usePolling";

type Invitation = { linkUrl: string; expiresAt: string };

function isUsable(invitation: Invitation | null, now: number) {
  if (!invitation || !(Date.parse(invitation.expiresAt) > now)) return false;
  try { return new URL(invitation.linkUrl).protocol === "https:"; }
  catch { return false; }
}

export default function AppSiteLinkPanel({ siteId, active }: { siteId: string; active: boolean }) {
  const { showToast } = useToast();
  const [items, setItems] = useState<SiteAppLink[] | null>(null);
  const [error, setError] = useState("");
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(Date.now);
  const mounted = useRef(false);
  const fetching = useRef(false);
  const generating = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const load = useCallback(async () => {
    if (fetching.current || generating.current) return;
    fetching.current = true;
    setLoading(true);
    try {
      const result = await hqApi.listSiteAppLinks(siteId);
      if (mounted.current) { setItems(result.items); setError(""); }
    } catch (err) {
      if (mounted.current) setError(errorMessage(err, "앱 연동 정보를 불러오지 못했어요."));
    } finally {
      fetching.current = false;
      if (mounted.current) setLoading(false);
    }
  }, [siteId]);
  usePolling(load, 30_000);

  useEffect(() => {
    if (!invitation) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [invitation]);

  async function generate() {
    if (generating.current || !active) return;
    generating.current = true;
    setBusy(true);
    setInvitation(null);
    try {
      const result = await hqApi.createSiteAppLink(siteId);
      if (!mounted.current) return;
      if (!isUsable(result, Date.now())) {
        showToast("유효한 HTTPS 연동 링크를 받지 못했어요. 다시 발급해 주세요.", "error");
        return;
      }
      setNow(Date.now());
      setInvitation(result);
      showToast("연동 링크를 발급했어요. 담당자에게 전달해 주세요.", "success");
    } catch (err) {
      if (mounted.current) showToast(errorMessage(err, "링크 발급에 실패했어요. 현장의 담당자 전화번호 등록 여부를 확인해 주세요."), "error");
    } finally {
      generating.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  async function copy() {
    if (!invitation || !isUsable(invitation, Date.now())) return;
    try {
      await navigator.clipboard.writeText(invitation.linkUrl);
      showToast("링크를 복사했어요. 담당자에게 전달해 주세요.", "success");
    } catch { showToast("링크 입력칸을 선택해 직접 복사해 주세요.", "error"); }
  }

  async function share() {
    if (!invitation || !isUsable(invitation, Date.now())) return;
    try { await navigator.share({ title: "폭염가드 현장 연동", url: invitation.linkUrl }); }
    catch (err) { if (!(err instanceof DOMException && err.name === "AbortError")) showToast("공유하지 못했어요. 링크를 복사해 전달해 주세요.", "error"); }
  }

  const usable = active && isUsable(invitation, now);

  return <section className="mt-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 text-sm text-[var(--color-text-body)]">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="font-semibold text-[var(--color-text-heading)]">앱 계정 연동</h2>
      <button type="button" className={btnSecondary} onClick={() => void load()} disabled={busy || loading}>{loading ? "확인 중..." : "새로고침"}</button>
    </div>
    <p className="py-3">담당자에게 링크를 전달해 주세요. 앱에 로그인한 뒤 현장에 등록한 담당자 전화번호를 입력하면 연동돼요.</p>
    <button type="button" className={btnPrimary} disabled={busy || !active} onClick={() => void generate()}>{busy ? "발급 중..." : "연동 링크 발급"}</button>
    {!active && <p className="pt-2">비활성 현장은 연동 링크를 발급할 수 없어요.</p>}
    {invitation && <div className="mt-4 flex flex-col gap-2">
      <label className="flex flex-col gap-1">연동 링크
        <input className="w-full rounded border border-[var(--color-border)] bg-[var(--color-bg-app)] p-2" readOnly value={usable ? invitation.linkUrl : ""} onFocus={(e) => e.currentTarget.select()} />
      </label>
      <p role="status">{usable ? `유효기간: ${new Date(invitation.expiresAt).toLocaleString("ko-KR")} · 7일 유효, 연동 성공 후 재사용할 수 없어요.` : active ? "링크가 만료됐어요. 다시 발급해 주세요." : "비활성 현장의 링크는 공유할 수 없어요."}</p>
      <div className="flex gap-2">
        <button type="button" className={btnSecondary} disabled={!usable || busy} onClick={() => void copy()}>링크 복사</button>
        {typeof navigator.share === "function" && <button type="button" className={btnSecondary} disabled={!usable || busy} onClick={() => void share()}>공유하기</button>}
      </div>
      <p>복사한 링크를 카카오톡이나 문자 등으로 직접 전달해 주세요. 링크 발급만으로 연동이 완료되지는 않아요.</p>
    </div>}
    <p className="pt-4 text-xs">연동 해제는 자동으로 처리돼요. 상태는 30초마다, 이 화면으로 돌아오면 자동으로 확인해요.</p>
    {error && <div role="alert" className="pt-4 text-[var(--color-danger-text)]">{error}{items !== null && " 마지막으로 확인한 상태를 표시하고 있어요."}</div>}
    {items === null ? (!error && <p className="pt-4">연동 정보 불러오는 중...</p>) : <div className="pt-4" aria-live="polite">
      <p className="pb-2">{items.some((item) => item.status === "LINKED") ? "연동됨" : "미연동"}</p>
      {items.map((item) => <div key={item.userId} className="border-t border-[var(--color-border)] py-3">
        <span className="break-all">{item.email} · {item.status === "LINKED" ? "연동됨" : "연동 해제됨"}</span>
      </div>)}
    </div>}
  </section>;
}
