import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import OpsLayout, { OpsPageHeader } from "../../components/ops/OpsLayout";
import OpsIcon from "../../components/ops/OpsIcon";
import { CARD } from "../../components/ops/opsStyles";
import {
  BTN_DANGER, BTN_PRIMARY, BTN_SECONDARY, CenterMessage, Chip, InfoRow, OpsModal, OpsSelect, PanelSection, SearchBox, SidePanel, UnavailableState, UnderlineTabs,
} from "../../components/ops/OpsUi";
import { errorMessage, opsAdminApi } from "../../api";
import {
  REJECT_REASONS, REJECT_REASON_MAX, SIGNUP_STATUSES, SIGNUP_STATUS_LABEL, SIGNUP_TAB_LABEL,
  depositDueLabel, formatFileSize, formatWon, waitingLabel,
  type RejectReasonCode, type SignupCounts, type SignupDetail, type SignupRequest, type SignupStatus,
} from "../../lib/opsAdmin";
import { formatDateTime, relativeTime } from "../../lib/opsInquiry";
import { useToast } from "../../shared/ui/toastContext";

/*
 * 본사 가입 승인 (Figma 04 2957:968, 04-1 신청 상세, 04-2 반려 사유, 04-3 입금 확인 대기).
 * API: /api/v1/ops/signup-requests (목록·상세·승인·반려·입금 확인·안내 재발송·메모)
 * 서버에 아직 없으면 "서버 준비 중"을 보여준다.
 */

const STEPS: { status: SignupStatus | "NEW"; title: string; sub: string }[] = [
  { status: "NEW", title: "가입 신청", sub: "회사가 정보·서류 제출" },
  { status: "PENDING_APPROVAL", title: "운영자 승인", sub: "사업자 정보·서류 확인" },
  { status: "PENDING_DEPOSIT", title: "입금 확인", sub: "이용료 입금 확인" },
  { status: "ACTIVE", title: "이용 시작", sub: "계정 활성화·안내 메일" },
];

const REQUESTED_OPTIONS = [
  { value: "all", label: "신청일 전체" },
  { value: "7", label: "최근 7일" },
  { value: "30", label: "최근 30일" },
];
const DOCUMENT_OPTIONS = [
  { value: "all", label: "서류 전체" },
  { value: "submitted", label: "서류 제출" },
  { value: "missing", label: "서류 미제출" },
];

function sortOptions(status: SignupStatus) {
  if (status === "PENDING_DEPOSIT") return [{ value: "depositDue", label: "입금 기한 임박순" }, { value: "approvedAt", label: "최근 승인순" }];
  return [{ value: "oldest", label: "오래 기다린 순" }, { value: "newest", label: "최근 신청순" }];
}

function StepBar({ counts, current }: { counts: SignupCounts | null; current: SignupStatus }) {
  const chip = (status: SignupStatus | "NEW") => {
    if (!counts) return null;
    if (status === "NEW") return <Chip tone="neutral">신규 {counts.newToday}</Chip>;
    if (status === "ACTIVE") return <Chip tone="success">이용 중 {counts.ACTIVE}</Chip>;
    return <Chip tone={status === "PENDING_APPROVAL" ? "warning" : "accent"}>대기 {counts[status]}</Chip>;
  };
  return (
    <ol className={`${CARD} grid gap-3 p-5 md:grid-cols-4`}>
      {STEPS.map((step, i) => {
        const active = step.status === current;
        return (
          <li key={step.title} className="flex items-center gap-3">
            <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${active ? "bg-[var(--ops-accent)] text-white" : "bg-[var(--ops-chip-bg)] text-[var(--ops-body)]"}`}>{i + 1}</span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className={`text-sm font-bold ${active ? "text-[var(--ops-accent)]" : "text-[var(--ops-heading)]"}`}>{step.title}</span>
              <span className="truncate text-[11px] text-[var(--ops-faint)]">{step.sub}</span>
            </span>
            {chip(step.status)}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * 반려가 전부 성공하면 닫는다(onDone). 실패한 건이 있으면 모달을 열어 둔 채
 * 실패한 건만 남겨 입력한 사유로 다시 시도할 수 있게 하고, 성공한 건은 목록에 반영한다(onChanged).
 */
function RejectModal({ targets: initialTargets, onClose, onDone, onChanged }: { targets: SignupRequest[]; onClose: () => void; onDone: () => void; onChanged: () => void }) {
  const [targets, setTargets] = useState(initialTargets);
  const { showToast } = useToast();
  const [code, setCode] = useState<RejectReasonCode>("BUSINESS_MISMATCH");
  const [reason, setReason] = useState<string>(REJECT_REASONS[0].template);
  const [allowReapply, setAllowReapply] = useState(true);
  const [busy, setBusy] = useState(false);
  const one = targets.length === 1 ? targets[0] : null;

  const pick = (next: RejectReasonCode) => {
    setCode(next);
    setReason(REJECT_REASONS.find((r) => r.code === next)?.template ?? "");
  };

  const submit = async () => {
    if (busy || !reason.trim()) return;
    setBusy(true);
    const results = await Promise.allSettled(targets.map((t) => opsAdminApi.rejectSignup(t.requestId, { reasonCode: code, reason: reason.trim(), allowReapply })));
    const failedTargets = targets.filter((_, i) => results[i].status === "rejected");
    setBusy(false);
    if (failedTargets.length === 0) {
      showToast(one ? `${one.companyName} 가입 신청을 반려했어요.` : `${targets.length}건을 반려했어요.`, "success");
      onDone();
      return;
    }
    const firstError = (results.find((r) => r.status === "rejected") as PromiseRejectedResult).reason;
    const done = targets.length - failedTargets.length;
    showToast(
      errorMessage(firstError, done > 0 ? `${done}건은 반려했고 ${failedTargets.length}건은 반려하지 못했어요.` : "반려하지 못했어요. 다시 시도해 주세요."),
      "error",
    );
    if (done > 0) onChanged();
    setTargets(failedTargets);
  };

  return (
    <OpsModal
      title="가입 신청을 반려할까요?"
      description={one ? `${one.companyName} · ${one.managerName ?? "담당자"} 담당자에게 반려 사유가 메일로 전달돼요.` : `선택한 ${targets.length}건의 담당자에게 반려 사유가 메일로 전달돼요.`}
      icon={<span className="flex size-10 items-center justify-center rounded-xl bg-[var(--color-danger-soft-bg)] text-[var(--color-danger-text)]"><OpsIcon name="alert" size={18} /></span>}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={BTN_SECONDARY}>취소</button>
          <button type="button" onClick={() => void submit()} disabled={busy || !reason.trim()} className="inline-flex h-9 items-center rounded-lg bg-[var(--color-danger-text)] px-5 text-[13px] font-medium text-white disabled:opacity-60">
            {busy ? "반려하는 중..." : "반려하기"}
          </button>
        </>
      }
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="pb-2 text-[13px] font-bold text-[var(--ops-heading)]">반려 사유</legend>
        {REJECT_REASONS.map((r) => (
          <label key={r.code} className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-[13px] font-medium ${code === r.code ? "border-[var(--ops-accent)] bg-[var(--ops-accent-soft)] text-[var(--ops-heading)]" : "border-[var(--ops-border)] text-[var(--ops-body)]"}`}>
            <input type="radio" name="reject-reason" checked={code === r.code} onChange={() => pick(r.code)} className="size-4 accent-[var(--ops-accent)]" />
            {r.label}
          </label>
        ))}
      </fieldset>
      <div className="relative">
        <textarea
          aria-label="반려 사유 내용"
          value={reason}
          onChange={(e) => setReason(e.target.value.slice(0, REJECT_REASON_MAX))}
          rows={3}
          placeholder="담당자에게 전달할 사유를 입력하세요."
          className="w-full rounded-lg border border-[var(--ops-border)] bg-[var(--ops-surface)] p-3 pb-6 text-[13px] text-[var(--ops-heading)] outline-none focus:border-[var(--ops-accent)]"
        />
        <span className="absolute bottom-2 right-3 text-[11px] text-[var(--ops-faint)]">{reason.length} / {REJECT_REASON_MAX}</span>
      </div>
      <label className="flex items-center gap-2 text-[13px] text-[var(--ops-heading)]">
        <input type="checkbox" checked={allowReapply} onChange={(e) => setAllowReapply(e.target.checked)} className="size-4 accent-[var(--ops-accent)]" />
        재신청 안내 링크 함께 보내기
      </label>
    </OpsModal>
  );
}

function SignupDetailPanel({ requestId, onClose, onReject, onChanged }: {
  requestId: string;
  onClose: () => void;
  onReject: (r: SignupRequest) => void;
  onChanged: () => void;
}) {
  const { showToast } = useToast();
  const [detail, setDetail] = useState<SignupDetail | null>(null);
  const [error, setError] = useState("");
  const [memo, setMemo] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    opsAdminApi.getSignupRequest(requestId)
      .then((d) => { if (alive) { setDetail(d); setMemo(d.memo); } })
      .catch((err) => alive && setError(errorMessage(err, "신청 정보를 불러오지 못했어요.")));
    return () => { alive = false; };
  }, [requestId]);

  const saveMemo = async () => {
    if (!detail || memo === detail.memo) return;
    try {
      await opsAdminApi.saveSignupMemo(detail.requestId, memo);
      setDetail({ ...detail, memo });
    } catch (err) {
      showToast(errorMessage(err, "메모를 저장하지 못했어요."), "error");
    }
  };

  const approve = async () => {
    if (!detail || busy) return;
    setBusy(true);
    try {
      await opsAdminApi.approveSignup(detail.requestId, memo);
      showToast(`${detail.companyName} 가입을 승인하고 입금 안내를 보냈어요.`, "success");
      onChanged();
      onClose();
    } catch (err) {
      showToast(errorMessage(err, "승인하지 못했어요."), "error");
      setBusy(false);
    }
  };

  const stepIndex = detail ? ["PENDING_APPROVAL", "PENDING_DEPOSIT", "ACTIVE"].indexOf(detail.status) + 1 : 0;
  const waiting = detail ? waitingLabel(detail.requestedAt) : null;

  return (
    <SidePanel
      title="가입 신청 상세"
      onClose={onClose}
      footer={detail?.status === "PENDING_APPROVAL" && (
        <>
          <button type="button" onClick={() => onReject(detail)} className={`${BTN_DANGER} flex-1`}>반려</button>
          <button type="button" onClick={() => void approve()} disabled={busy} className={`${BTN_PRIMARY} flex-[2.5]`}>
            <OpsIcon name="check" size={13} />
            {busy ? "승인하는 중..." : "승인하고 입금 안내 보내기"}
          </button>
        </>
      )}
    >
      {error ? (
        <CenterMessage tone="danger">{error}</CenterMessage>
      ) : !detail ? (
        <CenterMessage>불러오는 중...</CenterMessage>
      ) : (
        <div className="flex flex-col">
          <div className="flex items-center gap-3 pb-4">
            <span className="flex size-12 items-center justify-center rounded-xl bg-[var(--ops-chip-bg)] text-[var(--ops-body)]"><OpsIcon name="building" size={20} /></span>
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 text-lg font-bold text-[var(--ops-heading)]">
                {detail.companyName}
                <Chip tone={detail.status === "REJECTED" ? "danger" : detail.status === "ACTIVE" ? "success" : "warning"} dot>{SIGNUP_STATUS_LABEL[detail.status]}</Chip>
              </p>
              <p className="text-xs text-[var(--ops-faint)]">{formatDateTime(detail.requestedAt)} 신청{waiting ? ` · ${relativeTime(detail.requestedAt)}` : ""}</p>
            </div>
          </div>

          {detail.status !== "REJECTED" && (
            <ol className="mb-4 flex items-center rounded-xl bg-[var(--ops-bg)] px-4 py-3">
              {["신청", "운영자 승인", "입금 확인", "이용 시작"].map((label, i) => {
                const done = i < stepIndex;
                const now = i === stepIndex;
                return (
                  <li key={label} className="flex flex-1 flex-col items-center gap-1 text-[11px]">
                    <span className={`flex size-5 items-center justify-center rounded-full text-[10px] font-bold ${done ? "bg-[var(--ops-success-fg)] text-white" : now ? "bg-[var(--ops-accent)] text-white" : "bg-[var(--ops-border)] text-[var(--ops-body)]"}`}>
                      {done ? <OpsIcon name="check" size={10} /> : i + 1}
                    </span>
                    <span className={now ? "font-bold text-[var(--ops-accent)]" : "text-[var(--ops-body)]"}>{label}</span>
                  </li>
                );
              })}
            </ol>
          )}

          <PanelSection title="회사 정보">
            <InfoRow label="사업자등록번호" trailing={detail.businessVerified && <Chip tone="success">국세청 확인됨</Chip>}>{detail.businessNumber}</InfoRow>
            <InfoRow label="대표자">{detail.representative}</InfoRow>
            <InfoRow label="업종">{detail.industry}</InfoRow>
            <InfoRow label="주소">{detail.address}</InfoRow>
            <InfoRow label="등록 예정 현장">{`${detail.siteCount}개`}</InfoRow>
          </PanelSection>

          <PanelSection title="담당자">
            <InfoRow label="이름">{[detail.managerName, detail.managerTeam && `(${detail.managerTeam})`].filter(Boolean).join(" ")}</InfoRow>
            <InfoRow label="연락처">{detail.managerPhone}</InfoRow>
            <InfoRow label="이메일" trailing={detail.emailVerified && <Chip tone="success">인증 완료</Chip>}>{detail.email}</InfoRow>
          </PanelSection>

          <PanelSection title="제출 서류">
            {detail.documents.length === 0 ? (
              <p className="py-2 text-[13px] text-[var(--ops-faint)]">제출한 서류가 없어요.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {detail.documents.map((doc) => (
                  <li key={doc.documentId || doc.name} className="flex items-center gap-3 rounded-xl border border-[var(--ops-border)] p-3">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-[var(--color-danger-soft-bg)] text-[var(--color-danger-text)]"><OpsIcon name="file" /></span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-[13px] font-medium text-[var(--ops-heading)]">{doc.name}</span>
                      <span className="text-[11px] text-[var(--ops-faint)]">{[doc.contentType?.split("/")[1]?.toUpperCase(), formatFileSize(doc.size)].filter(Boolean).join(" · ")}</span>
                    </span>
                    {doc.url && (
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className={BTN_SECONDARY}>
                        <OpsIcon name="eye" size={15} />
                        미리보기
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </PanelSection>

          <PanelSection title="내부 메모">
            <textarea
              aria-label="내부 메모"
              value={memo}
              onChange={(e) => setMemo(e.target.value.slice(0, 1000))}
              onBlur={() => void saveMemo()}
              rows={3}
              placeholder="신청자에게 보이지 않아요. 확인한 내용을 남겨 두세요."
              className="w-full rounded-lg border border-[var(--ops-border)] bg-[var(--ops-surface)] p-3 text-[13px] text-[var(--ops-heading)] outline-none focus:border-[var(--ops-accent)]"
            />
          </PanelSection>
        </div>
      )}
    </SidePanel>
  );
}

const ALIGN = { left: "text-left", center: "text-center", right: "text-right" } as const;

const CHECKLIST: { title: string; sub: string }[] = [
  { title: "사업자등록번호 진위 확인", sub: "국세청 조회 결과와 회사명이 같은지" },
  { title: "제출 서류 확인", sub: "사업자등록증 이미지가 선명하고 정보가 일치하는지" },
  { title: "중복 가입 확인", sub: "같은 사업자번호로 이용 중인 회사가 없는지" },
];

export default function OpsSignupsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [status, setStatus] = useState<SignupStatus>("PENDING_APPROVAL");
  const [keyword, setKeyword] = useState("");
  const [requested, setRequested] = useState("all");
  const [documentFilter, setDocumentFilter] = useState("all");
  const [sort, setSort] = useState("oldest");
  const [q, setQ] = useState("");

  const [items, setItems] = useState<SignupRequest[] | null>(null);
  const [counts, setCounts] = useState<SignupCounts | null>(null);
  const [cursor, setCursor] = useState<string | undefined>();
  const [unavailable, setUnavailable] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailId, setDetailId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<SignupRequest[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [undo, setUndo] = useState<SignupRequest | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setQ(keyword.trim()), 300);
    return () => clearTimeout(t);
  }, [keyword]);

  const load = useCallback(async (more?: string) => {
    const id = ++seq.current;
    try {
      const res = await opsAdminApi.listSignupRequests({
        status,
        q: q || undefined,
        requested: requested === "all" ? undefined : requested,
        document: documentFilter === "all" ? undefined : documentFilter,
        sort,
        cursor: more,
      });
      if (id !== seq.current) return;
      if (res === null) {
        setUnavailable(true);
        return;
      }
      setItems((prev) => (more && prev ? [...prev, ...res.items] : res.items));
      setCounts(res.counts);
      setCursor(res.page.nextCursor);
      setError("");
    } catch (err) {
      if (id === seq.current) setError(errorMessage(err, "가입 신청을 불러오지 못했어요."));
    }
  }, [status, q, requested, documentFilter, sort]);

  useEffect(() => {
    setItems(null);
    setSelected(new Set());
    void load();
  }, [load]);

  useEffect(() => {
    if (!undo) return;
    const t = setTimeout(() => setUndo(null), 10_000);
    return () => clearTimeout(t);
  }, [undo]);

  const changeTab = (next: SignupStatus) => {
    setStatus(next);
    setSort(sortOptions(next)[0].value);
  };

  const approve = async (targets: SignupRequest[]) => {
    if (busyId) return;
    setBusyId(targets.length === 1 ? targets[0].requestId : "bulk");
    const results = await Promise.allSettled(targets.map((t) => opsAdminApi.approveSignup(t.requestId)));
    const failed = results.filter((r) => r.status === "rejected");
    setBusyId(null);
    if (failed.length === 0) showToast(targets.length === 1 ? `${targets[0].companyName} 가입을 승인하고 입금 안내를 보냈어요.` : `${targets.length}건을 승인했어요.`, "success");
    else showToast(errorMessage((failed[0] as PromiseRejectedResult).reason, `${failed.length}건을 승인하지 못했어요.`), "error");
    void load();
  };

  const confirmDeposit = async (target: SignupRequest) => {
    if (busyId) return;
    setBusyId(target.requestId);
    try {
      await opsAdminApi.confirmDeposit(target.requestId);
      setUndo(target);
      void load();
    } catch (err) {
      showToast(errorMessage(err, "입금을 확인하지 못했어요."), "error");
    } finally {
      setBusyId(null);
    }
  };

  const undoDeposit = async () => {
    if (!undo) return;
    const target = undo;
    setUndo(null);
    try {
      await opsAdminApi.undoDepositConfirmation(target.requestId);
      showToast(`${target.companyName} 입금 확인을 되돌렸어요.`, "success");
      void load();
    } catch (err) {
      showToast(errorMessage(err, "되돌리지 못했어요."), "error");
    }
  };

  const remind = async (target: SignupRequest) => {
    if (busyId) return;
    setBusyId(target.requestId);
    try {
      await opsAdminApi.sendDepositReminder(target.requestId);
      showToast(`${target.companyName} 담당자에게 입금 안내를 다시 보냈어요.`, "success");
    } catch (err) {
      showToast(errorMessage(err, "안내를 보내지 못했어요."), "error");
    } finally {
      setBusyId(null);
    }
  };

  const toggle = (id: string) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  const selectedItems = (items ?? []).filter((i) => selected.has(i.requestId));
  const allChecked = !!items?.length && items.every((i) => selected.has(i.requestId));
  const tabs = SIGNUP_STATUSES.map((s) => ({ key: s, label: SIGNUP_TAB_LABEL[s], count: counts?.[s] }));

  const th = (label: string, align: "left" | "center" | "right" = "left") => (
    <th key={label} scope="col" className={`px-4 py-2.5 font-medium ${ALIGN[align]}`}>{label}</th>
  );
  const companyCell = (r: SignupRequest) => (
    <td className="px-4 py-3">
      <button type="button" onClick={() => setDetailId(r.requestId)} className="flex flex-col text-left">
        <span className="text-sm font-bold text-[var(--ops-heading)] hover:underline">{r.companyName}</span>
        <span className="text-xs text-[var(--ops-faint)]">{r.businessNumber}</span>
      </button>
    </td>
  );
  const managerCell = (r: SignupRequest) => (
    <td className="px-4 py-3">
      <span className="flex flex-col">
        <span className="font-medium text-[var(--ops-heading)]">{r.managerName ?? "–"}</span>
        <span className="text-xs text-[var(--ops-faint)]">{r.managerPhone}</span>
      </span>
    </td>
  );

  const docChip = (r: SignupRequest) =>
    r.documents.length > 0
      ? <Chip tone="accent"><OpsIcon name="file" size={12} />{r.documents[0].name.split(/[_.]/)[0] || "제출 서류"}</Chip>
      : <Chip tone="neutral">미제출</Chip>;

  return (
    <OpsLayout>
      <div className="flex w-full flex-col gap-4 px-4 pb-24 md:px-8">
        <div className="mb-2">
          <OpsPageHeader
            crumb="회원 › 가입 승인"
            title="본사 가입 승인"
            description="본사 관리 페이지를 신청한 회사예요. 승인 → 입금 확인을 마치면 실제로 이용할 수 있어요."
            actions={
              <button type="button" onClick={() => navigate("/ops/settings#policy")} className={BTN_SECONDARY}>
                <OpsIcon name="settings" size={15} />
                승인 정책
              </button>
            }
          />
        </div>

        {unavailable ? (
          <UnavailableState feature="가입 승인" />
        ) : (
          <>
            <StepBar counts={counts} current={status} />
            <UnderlineTabs label="신청 상태" tabs={tabs} value={status} onChange={changeTab} />

            <div className="flex flex-wrap items-center gap-2">
              <SearchBox value={keyword} onChange={setKeyword} placeholder="회사명, 담당자, 이메일, 사업자번호" label="신청 검색" />
              <OpsSelect label="신청일" icon="calendar" value={requested} onChange={setRequested} options={REQUESTED_OPTIONS} />
              <OpsSelect label="서류" icon="file" value={documentFilter} onChange={setDocumentFilter} options={DOCUMENT_OPTIONS} />
              <span className="flex-1" />
              <OpsSelect label="정렬" icon="sort" value={sort} onChange={setSort} options={sortOptions(status)} />
            </div>

            {undo && (
              <div role="status" className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[var(--ops-heading)] px-4 py-3 text-[13px] text-[var(--ops-surface)]">
                <span className="flex items-center gap-2"><OpsIcon name="check" size={13} />{undo.companyName} 입금을 확인했어요. 계정이 활성화되고 안내 메일을 보냈어요.</span>
                <button type="button" onClick={() => void undoDeposit()} className="font-bold text-[var(--ops-donut-site)] hover:underline">되돌리기</button>
              </div>
            )}

            <section aria-label="가입 신청 목록" className={`${CARD} flex min-h-[240px] flex-col overflow-hidden`}>
              {error && !items ? (
                <CenterMessage tone="danger">{error}</CenterMessage>
              ) : !items ? (
                <CenterMessage>불러오는 중...</CenterMessage>
              ) : items.length === 0 ? (
                <CenterMessage>{SIGNUP_TAB_LABEL[status]} 건이 없어요.</CenterMessage>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[960px] text-[13px]">
                    <thead className="bg-[var(--ops-bg)] text-xs text-[var(--ops-faint)]">
                      {status === "PENDING_APPROVAL" ? (
                        <tr>
                          <th scope="col" className="w-12 px-4 py-2.5">
                            <input type="checkbox" aria-label="전체 선택" checked={allChecked} onChange={() => setSelected(allChecked ? new Set() : new Set(items.map((i) => i.requestId)))} className="size-4 accent-[var(--ops-accent)]" />
                          </th>
                          {[th("회사명"), th("담당자"), th("이메일"), th("신청일"), th("현장 수", "center"), th("제출 서류", "center"), th("관리", "center")]}
                        </tr>
                      ) : status === "PENDING_DEPOSIT" ? (
                        <tr>{[th("회사명"), th("담당자"), th("승인일"), th("이용 요금"), th("입금 기한"), th("입금 상태"), th("관리", "right")]}</tr>
                      ) : (
                        <tr>{[th("회사명"), th("담당자"), th("이메일"), th("신청일"), th(status === "ACTIVE" ? "승인일" : "처리일"), th("상태")]}</tr>
                      )}
                    </thead>
                    <tbody className="divide-y divide-[var(--ops-divider)]">
                      {items.map((r) => {
                        if (status === "PENDING_APPROVAL") {
                          const wait = waitingLabel(r.requestedAt);
                          const checked = selected.has(r.requestId);
                          return (
                            <tr key={r.requestId} className={checked ? "bg-[var(--ops-accent-soft)]" : ""}>
                              <td className="px-4 py-3"><input type="checkbox" aria-label={`${r.companyName} 선택`} checked={checked} onChange={() => toggle(r.requestId)} className="size-4 accent-[var(--ops-accent)]" /></td>
                              {companyCell(r)}
                              {managerCell(r)}
                              <td className="px-4 py-3 text-[var(--ops-body)]">{r.email ?? "–"}</td>
                              <td className="px-4 py-3">
                                <span className="flex flex-col items-start gap-1">
                                  <span className="text-[var(--ops-heading)]">{formatDateTime(r.requestedAt)}</span>
                                  {wait && <Chip tone={wait.overdue ? "warning" : "neutral"}>{wait.overdue && <OpsIcon name="clock" size={11} />}{wait.label}</Chip>}
                                </span>
                              </td>
                              <td className="font-mono-num px-4 py-3 text-center font-medium text-[var(--ops-heading)]">{r.siteCount}개</td>
                              <td className="px-4 py-3 text-center">{docChip(r)}</td>
                              <td className="px-4 py-3">
                                <span className="flex justify-center gap-1.5">
                                  <button type="button" onClick={() => void approve([r])} disabled={!!busyId} className={`${BTN_PRIMARY} h-8 px-3`}><OpsIcon name="check" size={12} />승인</button>
                                  <button type="button" onClick={() => setRejecting([r])} disabled={!!busyId} className={`${BTN_DANGER} h-8 px-3`}>반려</button>
                                </span>
                              </td>
                            </tr>
                          );
                        }
                        if (status === "PENDING_DEPOSIT") {
                          const due = depositDueLabel(r.depositDueAt);
                          const overdue = r.depositOverdue || !!due?.overdue;
                          return (
                            <tr key={r.requestId}>
                              {companyCell(r)}
                              {managerCell(r)}
                              <td className="px-4 py-3 text-[var(--ops-body)]">{formatDateTime(r.approvedAt, false) || "–"}</td>
                              <td className="px-4 py-3 font-medium text-[var(--ops-heading)]">{[r.planName, r.monthlyFee != null && `월 ${formatWon(r.monthlyFee)}`].filter(Boolean).join(" · ") || "–"}</td>
                              <td className="px-4 py-3">{due ? <Chip tone={overdue ? "danger" : "warning"}><OpsIcon name="clock" size={11} />{due.label}</Chip> : "–"}</td>
                              <td className="px-4 py-3">{overdue ? <Chip dot>미입금</Chip> : <Chip tone="accent" dot>입금 확인 필요</Chip>}</td>
                              <td className="px-4 py-3 text-right">
                                {/* 기한이 지나도 늦게 입금될 수 있어 입금 확인은 항상 둔다 */}
                                <span className="flex justify-end gap-1.5">
                                  {overdue && (
                                    <button type="button" onClick={() => void remind(r)} disabled={!!busyId} className={`${BTN_SECONDARY} h-8 px-3`}><OpsIcon name="send" size={13} />안내 재발송</button>
                                  )}
                                  <button type="button" onClick={() => void confirmDeposit(r)} disabled={!!busyId} className={`${BTN_PRIMARY} h-8 px-3`}><OpsIcon name="card" size={13} />입금 확인</button>
                                </span>
                              </td>
                            </tr>
                          );
                        }
                        return (
                          <tr key={r.requestId}>
                            {companyCell(r)}
                            {managerCell(r)}
                            <td className="px-4 py-3 text-[var(--ops-body)]">{r.email ?? "–"}</td>
                            <td className="px-4 py-3 text-[var(--ops-body)]">{formatDateTime(r.requestedAt, false) || "–"}</td>
                            <td className="px-4 py-3 text-[var(--ops-body)]">{formatDateTime(r.approvedAt, false) || "–"}</td>
                            <td className="px-4 py-3"><Chip tone={status === "ACTIVE" ? "success" : "danger"} dot>{SIGNUP_STATUS_LABEL[status]}</Chip></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {cursor && (
              <button type="button" onClick={() => void load(cursor)} className={`${BTN_SECONDARY} self-center`}>더 보기</button>
            )}

            {status === "PENDING_APPROVAL" && (
              <section aria-label="승인 전 확인" className={`${CARD} flex flex-col gap-3 p-5`}>
                <div>
                  <h2 className="flex items-center gap-2 text-[15px] font-bold text-[var(--ops-heading)]"><OpsIcon name="shield" size={18} />승인 전에 확인해 주세요</h2>
                  <p className="pt-1 text-xs text-[var(--ops-faint)]">승인하면 담당자에게 이용료 입금 안내 메일이 자동으로 발송돼요.</p>
                </div>
                <ul className="grid gap-2 md:grid-cols-3">
                  {CHECKLIST.map((c) => (
                    <li key={c.title} className="flex items-start gap-2 rounded-xl bg-[var(--ops-bg)] p-3">
                      <span className="pt-0.5 text-[var(--ops-success-fg)]"><OpsIcon name="check" size={12} /></span>
                      <span className="flex flex-col">
                        <span className="text-[13px] font-bold text-[var(--ops-heading)]">{c.title}</span>
                        <span className="text-[11px] text-[var(--ops-faint)]">{c.sub}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {status === "PENDING_DEPOSIT" && (
              <p className="flex items-center gap-2 rounded-xl bg-[var(--ops-accent-soft)] px-4 py-3 text-[13px] text-[var(--ops-accent)]">
                <OpsIcon name="info" size={16} />
                입금 기한이 지나면 담당자에게 안내 메일이 한 번 더 발송되고, 정해진 기간이 지나면 자동으로 반려돼요.
              </p>
            )}
          </>
        )}
      </div>

      {selectedItems.length > 0 && status === "PENDING_APPROVAL" && (
        <div role="toolbar" aria-label="선택 작업" className="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-2xl bg-[#1f2533] px-4 py-2.5 text-[13px] text-white shadow-2xl">
          <span className="pr-2 font-bold">{selectedItems.length}개 선택됨</span>
          <button type="button" onClick={() => void approve(selectedItems)} disabled={!!busyId} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[var(--ops-accent)] px-3 font-medium disabled:opacity-60"><OpsIcon name="check" size={12} />선택 승인</button>
          <button type="button" onClick={() => setRejecting(selectedItems)} disabled={!!busyId} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white/10 px-3 font-medium"><OpsIcon name="close" size={11} />선택 반려</button>
          <button type="button" onClick={() => setSelected(new Set())} className="h-8 px-3 font-medium text-white/80">선택 해제</button>
        </div>
      )}

      {detailId && (
        <SignupDetailPanel
          requestId={detailId}
          onClose={() => setDetailId(null)}
          onReject={(r) => setRejecting([r])}
          onChanged={() => void load()}
        />
      )}
      {rejecting && (
        <RejectModal
          targets={rejecting}
          onClose={() => setRejecting(null)}
          onDone={() => {
            setRejecting(null);
            setDetailId(null);
            setSelected(new Set());
            void load();
          }}
          onChanged={() => void load()}
        />
      )}
    </OpsLayout>
  );
}

