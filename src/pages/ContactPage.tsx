import { useEffect, useState } from "react";
import HomeLayout from "../components/home/HomeLayout";
import ModalShell, { btnPrimary, btnSecondary, inputCls } from "../components/home/ModalShell";
import { useToast } from "../shared/ui/Toast";
import { SkeletonList } from "../shared/ui/Skeleton";
import { inquiriesApi, isDemoFallback, errorMessage, type Inquiry, type InquiryStatus } from "../api";

const MAX_TITLE = 50;
const MAX_CONTENT = 1000;

const TYPES = ["계정", "기록", "현장", "기타"] as const;
type InquiryType = (typeof TYPES)[number];
const TYPE_RE = /^\[(계정|기록|현장|기타)\]\s*/;

/** 서버에는 유형 필드가 없어 제목 앞에 "[유형] "을 붙여 저장하고, 화면에서 분리해 보여준다. */
function splitTitle(raw: string): { type: InquiryType; title: string } {
  const m = raw.match(TYPE_RE);
  return m ? { type: m[1] as InquiryType, title: raw.replace(TYPE_RE, "") } : { type: "기타", title: raw };
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
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

const GRID = "grid grid-cols-[72px_minmax(0,1fr)_92px_80px] gap-3 sm:grid-cols-[96px_minmax(0,1fr)_104px_88px]";

export default function ContactPage() {
  const { showToast } = useToast();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [composing, setComposing] = useState(false);
  const [detail, setDetail] = useState<Inquiry | null>(null);

  useEffect(() => {
    let alive = true;
    inquiriesApi
      .listInquiries()
      .then((res) => {
        if (alive) {
          setInquiries(res.items);
          setLoaded(true);
        }
      })
      .catch((err) => {
        if (!alive) return;
        if (!isDemoFallback(err)) showToast(errorMessage(err, "문의 목록을 불러오지 못했어요."), "error");
        setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, [showToast]);

  return (
    <HomeLayout>
      <div className="flex w-full justify-center">
        <div className="flex w-full max-w-[695px] flex-col gap-6">
          <div className="flex items-end gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1 leading-[1.45]">
              <h1 className="text-xl font-bold text-[var(--color-text-heading)]">문의하기</h1>
              <p className="text-[13px] text-[var(--color-text-body)]">서비스 이용 중 불편한 점이나 궁금한 점을 남겨주세요.</p>
            </div>
            <button
              type="button"
              onClick={() => setComposing(true)}
              className="flex shrink-0 items-center gap-1.5 rounded bg-[var(--color-accent)] px-4 py-2 font-medium text-white transition hover:brightness-110"
            >
              <span className="text-[15px] leading-none">+</span>
              <span className="text-[13px] leading-[1.45]">새 문의</span>
            </button>
          </div>

          <section className="overflow-hidden rounded-lg border border-[var(--home-card-border)] bg-[var(--home-card-bg)]">
            <div className="flex items-center gap-1.5 px-5 py-4 leading-[1.45]">
              <h2 className="text-[15px] font-bold text-[var(--color-text-heading)]">내 문의 목록</h2>
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
                    onClick={() => setDetail(item)}
                    className={`${GRID} w-full items-center border-t border-[var(--home-card-border)] px-5 py-3.5 text-left transition-colors hover:bg-[var(--color-bg-surface)]`}
                  >
                    <span className="text-[13px] leading-[1.45] text-[var(--color-text-body)]">{type}</span>
                    <span className="truncate text-sm font-medium leading-[1.45] text-[var(--color-text-heading)]">{title}</span>
                    <span className="text-[13px] leading-[1.45] text-[var(--color-text-body)]">{formatDate(item.createdAt)}</span>
                    <span>
                      <StatusBadge status={item.status} />
                    </span>
                  </button>
                );
              })
            )}
          </section>
        </div>
      </div>

      {composing && (
        <NewInquiryModal
          onClose={() => setComposing(false)}
          onCreated={(created) => {
            setInquiries((prev) => [created, ...prev]);
            setComposing(false);
          }}
        />
      )}
      {detail && <InquiryDetailModal inquiry={detail} onClose={() => setDetail(null)} />}
    </HomeLayout>
  );
}

function NewInquiryModal({ onClose, onCreated }: { onClose: () => void; onCreated: (i: Inquiry) => void }) {
  const { showToast } = useToast();
  const [type, setType] = useState<InquiryType | "">("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!type) return showToast("문의 유형을 선택해 주세요.", "error");
    if (!title.trim()) return showToast("제목을 입력해 주세요.", "error");
    if (!content.trim()) return showToast("문의 내용을 입력해 주세요.", "error");
    if (submitting) return;
    setSubmitting(true);
    const payload = { title: `[${type}] ${title.trim()}`, content: content.trim() };
    try {
      const created = await inquiriesApi.createInquiry(payload);
      onCreated({ ...payload, ...created, reply: null });
      showToast("문의가 등록됐어요.", "success");
    } catch (err) {
      if (isDemoFallback(err)) {
        onCreated({ inquiryId: `local-${Date.now()}`, ...payload, status: "OPEN", reply: null, createdAt: new Date().toISOString() });
        showToast("문의가 등록됐어요. (데모)", "success");
        return;
      }
      showToast(errorMessage(err, "문의 등록에 실패했어요."), "error");
      setSubmitting(false);
    }
  };

  const label = "text-xs font-medium leading-[1.45] text-[var(--color-text-label)]";

  return (
    <ModalShell
      title="새 문의"
      onClose={onClose}
      busy={submitting}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={submitting} className={btnSecondary}>
            취소
          </button>
          <button type="button" onClick={handleSubmit} disabled={submitting} className={btnPrimary}>
            {submitting ? "등록 중..." : "등록"}
          </button>
        </>
      }
    >
      <label className="flex flex-col gap-1.5">
        <span className={label}>문의 유형</span>
        <div className="relative">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as InquiryType)}
            className={`${inputCls} appearance-none pr-9 ${type ? "" : "text-[var(--color-text-faint)]"}`}
          >
            <option value="" disabled>
              유형을 선택해 주세요
            </option>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-body)]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={label}>제목</span>
        <input type="text" value={title} maxLength={MAX_TITLE} onChange={(e) => setTitle(e.target.value)} placeholder="제목을 입력해 주세요" className={inputCls} />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={label}>내용</span>
        <textarea
          value={content}
          maxLength={MAX_CONTENT}
          onChange={(e) => setContent(e.target.value)}
          placeholder="문의 내용을 자세히 적어주시면 빠르게 답변드릴게요."
          className="h-[140px] w-full resize-none rounded border border-[var(--home-card-border)] bg-[var(--color-bg-surface)] px-3 py-2.5 text-[13px] leading-[1.45] text-[var(--color-text-heading)] outline-none transition-colors placeholder:text-[var(--color-text-faint)] focus:border-[var(--color-accent)]"
        />
        <span className="text-[11px] leading-[1.45] text-[var(--color-text-body)]">
          {content.length} / {MAX_CONTENT}자
        </span>
      </label>
    </ModalShell>
  );
}

function InquiryDetailModal({ inquiry, onClose }: { inquiry: Inquiry; onClose: () => void }) {
  const { type, title } = splitTitle(inquiry.title);
  return (
    <ModalShell
      title="문의 상세"
      onClose={onClose}
      footer={
        <button type="button" onClick={onClose} className={btnSecondary}>
          닫기
        </button>
      }
    >
      <div className="flex items-center gap-2">
        <StatusBadge status={inquiry.status} />
        <span className="text-xs leading-[1.45] text-[var(--color-text-body)]">
          {type} · {formatDate(inquiry.createdAt)}
        </span>
      </div>

      <div className="flex flex-col gap-1.5 leading-[1.45]">
        <p className="text-[15px] font-bold text-[var(--color-text-heading)]">{title}</p>
        <p className="whitespace-pre-wrap text-[13px] text-[var(--color-text-label)]">{inquiry.content}</p>
      </div>

      {inquiry.reply && (
        <div className="flex flex-col gap-1.5 rounded-md bg-[var(--color-bg-app)] px-4 py-3.5 leading-[1.45]">
          <p className="text-xs font-medium text-[var(--color-accent)]">관리자 답변</p>
          <p className="whitespace-pre-wrap text-[13px] text-[var(--color-text-heading)]">{inquiry.reply}</p>
        </div>
      )}
    </ModalShell>
  );
}
