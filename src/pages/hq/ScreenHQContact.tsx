import { useCallback, useEffect, useState, type ReactNode } from "react";
import HQLayout, { HQContent } from "../../components/hq/HQLayout";
import ModalShell, { btnPrimary, btnSecondary, inputCls } from "../../components/hq/ModalShell";
import { errorMessage, inquiriesApi, type Inquiry, type InquiryStatus } from "../../api";
import { SkeletonList } from "../../shared/ui/Skeleton";
import { useToast } from "../../shared/ui/toastContext";

const TYPE_RE = /^\[(계정|기록|현장|기타)\]\s*/;
function splitTitle(raw: string) {
  const match = raw.match(TYPE_RE);
  return {
    type: match?.[1] ?? "기타",
    title: match ? raw.replace(TYPE_RE, "") : raw,
  };
}

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

const STATUS_LABEL: Record<InquiryStatus, string> = { OPEN: "답변 대기", ANSWERED: "답변 완료", CLOSED: "종료" };
const STATUS_CLS: Record<InquiryStatus, string> = {
  OPEN: "bg-[var(--color-warn-soft-bg)] text-[var(--color-warn)]",
  ANSWERED: "bg-[var(--color-success-soft-bg)] text-[var(--color-success)]",
  CLOSED: "bg-[var(--color-bg-tile)] text-[var(--color-text-body)]",
};

function StatusBadge({ status }: { status: InquiryStatus }) {
  return (
    <span className={`inline-flex rounded-[10px] px-2 py-[3px] text-xs font-medium leading-[1.45] ${STATUS_CLS[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

const GRID = "grid grid-cols-[64px_minmax(0,1fr)_88px_78px] gap-2 sm:grid-cols-[82px_minmax(0,1fr)_100px_88px] sm:gap-3";

export default function ScreenHQContact() {
  const { showToast } = useToast();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [detail, setDetail] = useState<Inquiry | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const refreshInquiries = useCallback(async () => {
    setLoaded(false);
    try {
      const result = await inquiriesApi.listHqInquiries();
      setInquiries(result.items);
    } catch (error) {
      showToast(errorMessage(error, "문의 목록을 불러오지 못했어요."), "error");
    } finally {
      setLoaded(true);
    }
  }, [showToast]);

  useEffect(() => {
    void refreshInquiries();
  }, [refreshInquiries]);

  const openDetail = async (inquiryId: string) => {
    setLoadingDetail(true);
    try {
      setDetail(await inquiriesApi.getHqInquiry(inquiryId));
    } catch (error) {
      showToast(errorMessage(error, "문의 상세를 불러오지 못했어요."), "error");
    } finally {
      setLoadingDetail(false);
    }
  };

  const refreshDetail = async (inquiryId: string) => {
    const updated = await inquiriesApi.getHqInquiry(inquiryId);
    setDetail(updated);
    await refreshInquiries();
  };

  return (
    <HQLayout>
      <HQContent maxWidth={900}>
        <div className="flex w-full flex-col gap-6">
          <div className="flex min-w-0 flex-col gap-1 leading-[1.45]">
            <h1 className="text-xl font-medium text-[var(--color-text-heading)]">문의 관리</h1>
            <p className="text-[13px] text-[var(--color-text-body)]">현장관리자가 남긴 문의를 확인하고 답변할 수 있어요.</p>
          </div>

          <section className="overflow-hidden rounded-lg border border-[var(--home-card-border)] bg-[var(--home-card-bg)]">
            <div className="flex items-center gap-1.5 px-5 py-4 leading-[1.45]">
              <h2 className="text-[15px] font-bold text-[var(--color-text-heading)]">현장 문의</h2>
              <span className="text-[13px] font-medium text-[var(--color-accent)]">{inquiries.length}</span>
            </div>
            <div className={`${GRID} items-center border-t border-[var(--home-card-border)] bg-[var(--color-bg-surface)] px-5 py-2.5 text-xs font-medium leading-[1.45] text-[var(--color-text-body)]`}>
              <span>유형</span>
              <span>제목</span>
              <span>등록일</span>
              <span>상태</span>
            </div>

            {!loaded ? (
              <div className="border-t border-[var(--home-card-border)] p-4">
                <SkeletonList count={3} itemClassName="h-[44px]" />
              </div>
            ) : inquiries.length === 0 ? (
              <p className="border-t border-[var(--home-card-border)] px-5 py-8 text-center text-sm text-[var(--color-text-faint)]">
                등록된 문의가 없습니다.
              </p>
            ) : (
              inquiries.map((item) => {
                const { type, title } = splitTitle(item.title);
                return (
                  <button
                    key={item.inquiryId}
                    type="button"
                    onClick={() => void openDetail(item.inquiryId)}
                    className={`${GRID} w-full items-center border-t border-[var(--home-card-border)] px-5 py-3.5 text-left transition-colors hover:bg-[var(--color-bg-surface)]`}
                  >
                    <span className="text-[13px] leading-[1.45] text-[var(--color-text-body)]">{type}</span>
                    <span className="truncate text-sm font-medium leading-[1.45] text-[var(--color-text-heading)]">{title}</span>
                    <span className="text-[13px] leading-[1.45] text-[var(--color-text-body)]">{formatDate(item.createdAt)}</span>
                    <span><StatusBadge status={item.status} /></span>
                  </button>
                );
              })
            )}
          </section>
        </div>
      </HQContent>

      {loadingDetail && (
        <div role="status" className="fixed inset-0 z-[90] flex items-center justify-center bg-black/30" aria-label="문의 상세 불러오는 중">
          <div className="rounded-lg bg-[var(--home-card-bg)] px-5 py-4 text-sm text-[var(--color-text-body)]">문의 내용을 불러오고 있어요.</div>
        </div>
      )}
      {detail && (
        <InquiryDetailModal
          inquiry={detail}
          onClose={() => setDetail(null)}
          onUpdated={() => refreshDetail(detail.inquiryId)}
        />
      )}
    </HQLayout>
  );
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium text-[var(--color-text-body)]">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function InquiryDetailModal({
  inquiry,
  onClose,
  onUpdated,
}: {
  inquiry: Inquiry;
  onClose: () => void;
  onUpdated: () => Promise<void>;
}) {
  const { showToast } = useToast();
  const { type, title } = splitTitle(inquiry.title);
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState<InquiryStatus>(inquiry.status);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setStatus(inquiry.status);
  }, [inquiry.status]);

  const handleReply = async () => {
    const content = reply.trim();
    if (!content || busy) return;
    setBusy(true);
    try {
      const version = inquiry.version;
      if (version == null || !Number.isFinite(version)) throw new Error("문의 버전 정보를 불러오지 못했어요. 상세를 다시 열어주세요.");
      await inquiriesApi.replyToHqInquiry(inquiry.inquiryId, content, version);
      if (inquiry.status !== "ANSWERED") {
        const latest = await inquiriesApi.getHqInquiry(inquiry.inquiryId);
        const latestVersion = latest.version;
        if (latestVersion == null || !Number.isFinite(latestVersion)) throw new Error("문의 버전 정보를 불러오지 못했어요. 상세를 다시 열어주세요.");
        await inquiriesApi.updateHqInquiryStatus(inquiry.inquiryId, "ANSWERED", latestVersion);
      }
      await onUpdated();
      setReply("");
      showToast("답변을 등록했어요.", "success");
    } catch (error) {
      showToast(errorMessage(error, "답변을 등록하지 못했어요."), "error");
    } finally {
      setBusy(false);
    }
  };

  const handleStatusChange = async () => {
    if (busy || status === inquiry.status) return;
    setBusy(true);
    try {
      const version = inquiry.version;
      if (version == null || !Number.isFinite(version)) throw new Error("문의 버전 정보를 불러오지 못했어요. 상세를 다시 열어주세요.");
      await inquiriesApi.updateHqInquiryStatus(inquiry.inquiryId, status, version);
      await onUpdated();
      showToast("문의 상태를 변경했어요.", "success");
    } catch (error) {
      setStatus(inquiry.status);
      showToast(errorMessage(error, "문의 상태를 변경하지 못했어요."), "error");
    } finally {
      setBusy(false);
    }
  };

  const label = "text-xs font-medium leading-[1.45] text-[var(--color-text-label)]";

  return (
    <ModalShell
      title="문의 상세"
      onClose={onClose}
      busy={busy}
      maxWidth={600}
      footer={
        <button type="button" onClick={onClose} disabled={busy} className={btnSecondary}>닫기</button>
      }
    >
      <dl className="flex flex-col gap-3.5 leading-[1.45]">
        <DetailRow label="유형">
          <span className="text-[13px] text-[var(--color-text-heading)]">{type}</span>
        </DetailRow>
        <DetailRow label="제목">
          <span className="text-[15px] font-medium text-[var(--color-text-heading)]">{title}</span>
        </DetailRow>
        <DetailRow label="등록일">
          <span className="text-[13px] text-[var(--color-text-heading)]">{formatDate(inquiry.createdAt)}</span>
        </DetailRow>
        <DetailRow label="상태">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={inquiry.status} />
            <select
              aria-label="문의 상태"
              value={status}
              onChange={(event) => setStatus(event.target.value as InquiryStatus)}
              disabled={busy}
              className={`${inputCls} max-w-[150px]`}
            >
              <option value="OPEN">답변 대기</option>
              <option value="ANSWERED">답변 완료</option>
              <option value="CLOSED">종료</option>
            </select>
            <button type="button" onClick={() => void handleStatusChange()} disabled={busy || status === inquiry.status} className={btnSecondary}>
              상태 변경
            </button>
          </div>
        </DetailRow>
        <DetailRow label="내용">
          <span className="whitespace-pre-wrap text-[13px] text-[var(--color-text-label)]">{inquiry.content}</span>
        </DetailRow>
      </dl>

      {inquiry.reply && (
        <div className="flex flex-col gap-1.5 rounded-md bg-[var(--color-bg-app)] px-4 py-3.5 leading-[1.45]">
          <p className="text-xs font-medium text-[var(--color-accent)]">이전 답변</p>
          <p className="whitespace-pre-wrap text-[13px] text-[var(--color-text-heading)]">{inquiry.reply}</p>
        </div>
      )}

      <label className="flex flex-col gap-1.5">
        <span className={label}>{inquiry.reply ? "추가 답변" : "답변"}</span>
        <textarea
          value={reply}
          maxLength={1000}
          onChange={(event) => setReply(event.target.value)}
          placeholder="현장관리자에게 전달할 답변을 입력해 주세요."
          disabled={busy || inquiry.status === "CLOSED"}
          className="h-[120px] w-full resize-y rounded border border-[var(--home-card-border)] bg-[var(--color-bg-surface)] px-3 py-2.5 text-[13px] leading-[1.45] text-[var(--color-text-heading)] outline-none transition-colors placeholder:text-[var(--color-text-faint)] focus:border-[var(--color-accent)] disabled:opacity-60"
        />
      </label>
      {inquiry.status === "CLOSED" && <p className="text-xs text-[var(--color-text-body)]">종료된 문의는 상태를 답변 대기 또는 답변 완료로 바꾼 뒤 답변할 수 있어요.</p>}
      <div className="flex justify-end">
        <button type="button" onClick={() => void handleReply()} disabled={busy || !reply.trim() || inquiry.status === "CLOSED"} className={btnPrimary}>
          {busy ? "처리 중..." : "답변 등록"}
        </button>
      </div>
    </ModalShell>
  );
}
