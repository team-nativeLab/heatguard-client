import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import OpsLayout, { OpsPageHeader } from "../../components/ops/OpsLayout";
import { ChevronDownIcon } from "../../components/home/HomeIcons";
import { ApiError, NetworkError, errorMessage, opsApi, type OpsInquiry } from "../../api";
import { useToast } from "../../shared/ui/toastContext";
import {
  REPLY_MAX_LENGTH,
  REPLY_TEMPLATES,
  STATUS_LABEL,
  clearDraft,
  formatDateTime,
  inquiryType,
  loadDraft,
  matchesTab,
  mayHaveBeenSaved,
  lockedCloseAfterReply,
  newIdempotencyKey,
  relativeTime,
  replyKeyFor,
  replyLanded,
  type PendingReplyKey,
  saveDraft,
  type InquiryTab,
} from "../../lib/opsInquiry";

const TYPE_ALL = "__all__";

function StatusBadge({ status }: { status: OpsInquiry["status"] }) {
  const tone =
    status === "OPEN"
      ? "bg-[var(--ops-warning-bg)] text-[var(--ops-warning-fg)]"
      : "bg-[var(--ops-chip-bg)] text-[var(--ops-body)]";
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${tone}`}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status]}
    </span>
  );
}

function TypeChip({ title }: { title: string }) {
  return (
    <span className="inline-flex shrink-0 rounded bg-[var(--ops-chip-bg)] px-1.5 py-0.5 text-[11px] text-[var(--ops-body)]">
      {inquiryType(title)}
    </span>
  );
}

export default function OpsInquiriesPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<OpsInquiry[] | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [loadError, setLoadError] = useState("");
  // 대시보드의 "최근 문의"에서 ?tab=all&id=… 로 들어오면 그 문의를 바로 연다.
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab");
  const [tab, setTab] = useState<InquiryTab>(initialTab === "all" || initialTab === "done" ? initialTab : "open");
  const [type, setType] = useState(TYPE_ALL);
  const [keyword, setKeyword] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(() => searchParams.get("id"));
  const [detail, setDetail] = useState<OpsInquiry | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [closeAfterReply, setCloseAfterReply] = useState(true);
  const [sending, setSending] = useState(false);
  const [reopening, setReopening] = useState(false);
  // 결과가 불확실한 전송(503·네트워크 오류)을 다시 보낼 때 같은 키를 쓰기 위해 기억한다.
  const pendingKey = useRef<PendingReplyKey | null>(null);
  // 화면(완료 표시 고정)에도 반영해야 해서 상태로도 들고 있는다.
  const [pending, setPendingState] = useState<PendingReplyKey | null>(null);
  const setPending = (next: PendingReplyKey | null) => {
    pendingKey.current = next;
    setPendingState(next);
  };
  // 저장 여부가 불확실한 전송이 남아 있으면 재시도는 그때의 완료 표시로 보내야 한다.
  const lockedClose = lockedCloseAfterReply(pending, detail?.inquiryId, reply);
  const effectiveClose = lockedClose ?? closeAfterReply;

  const loadList = useCallback(async () => {
    try {
      const res = await opsApi.listInquiries();
      // 최근 문의가 위로 오도록 정렬한다.
      res.items.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
      setItems(res.items);
      setTruncated(res.truncated);
      setLoadError("");
    } catch (err) {
      setLoadError(errorMessage(err, "문의 목록을 불러오지 못했어요."));
    }
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const counts = useMemo(() => {
    const list = items ?? [];
    return {
      all: list.length,
      open: list.filter((i) => matchesTab(i.status, "open")).length,
      done: list.filter((i) => matchesTab(i.status, "done")).length,
    };
  }, [items]);

  const types = useMemo(() => [...new Set((items ?? []).map((i) => inquiryType(i.title)))].sort(), [items]);

  const visible = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return (items ?? []).filter(
      (i) =>
        matchesTab(i.status, tab) &&
        (type === TYPE_ALL || inquiryType(i.title) === type) &&
        (!q || i.title.toLowerCase().includes(q) || i.content.toLowerCase().includes(q)),
    );
  }, [items, tab, type, keyword]);

  // 선택한 문의가 필터에서 빠지면 첫 항목을 고른다.
  useEffect(() => {
    if (!items) return;
    if (selectedId && visible.some((i) => i.inquiryId === selectedId)) return;
    setSelectedId(visible[0]?.inquiryId ?? null);
  }, [items, visible, selectedId]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let alive = true;
    setDetailLoading(true);
    setReply(loadDraft(selectedId));
    opsApi.getInquiry(selectedId)
      .then((res) => alive && setDetail(res))
      .catch((err) => {
        if (alive) showToast(errorMessage(err, "문의를 불러오지 못했어요."), "error");
      })
      .finally(() => alive && setDetailLoading(false));
    return () => { alive = false; };
  }, [selectedId, showToast]);

  const insertTemplate = (body: string) => {
    setReply((prev) => {
      const next = prev.trim() ? `${prev.trimEnd()}\n\n${body}` : body;
      return next.slice(0, REPLY_MAX_LENGTH);
    });
  };

  const saveTemporarily = () => {
    if (!detail) return;
    const saved = saveDraft(detail.inquiryId, reply);
    showToast(saved ? "임시 저장했어요. 이 브라우저에서만 보관돼요." : "이 브라우저에서는 임시 저장을 쓸 수 없어요.", saved ? "success" : "error");
  };

  const send = async () => {
    if (!detail || sending) return;
    const content = reply.trim();
    if (!content) return showToast("답변 내용을 입력해주세요.", "error");
    // 전송 중 다른 문의를 고를 수 있으므로 대상과 기준 답변 수를 먼저 고정한다.
    const inquiryId = detail.inquiryId;
    const before = detail.replies;
    const close = effectiveClose;
    const attempt = replyKeyFor(pendingKey.current, inquiryId, content, close, newIdempotencyKey);
    setPending(attempt);
    setSending(true);
    try {
      let delayed = false;
      try {
        await opsApi.replyToInquiry(inquiryId, content, close, attempt.key);
      } catch (err) {
        if (err instanceof ApiError && err.code === "IDEMPOTENCY_KEY_REUSED") {
          // 같은 키로 설정이 다른 요청을 보낸 경우다. 첫 요청이 저장됐을 수 있으므로 키를 유지한다.
          showToast("이전 전송과 설정이 달라 보내지 않았어요. 새로고침해 답변이 등록됐는지 확인해주세요.", "error");
          return;
        }
        if (err instanceof ApiError && err.code === "INQUIRY_CLOSED") {
          setPending(null);
          showToast("종료된 문의에는 답변할 수 없어요. 다시 열고 답변해주세요.", "error");
          void loadList();
          return;
        }
        const failure = { network: err instanceof NetworkError, status: err instanceof ApiError ? err.status : undefined };
        if (!mayHaveBeenSaved(failure)) {
          // 서버가 거부해 저장되지 않은 것이 확실하므로 다음 전송은 새 키로 한다.
          setPending(null);
          showToast(errorMessage(err, "답변을 보내지 못했어요."), "error");
          return;
        }
        // 503·네트워크 오류는 저장됐을 수 있다. 다시 보내게 하면 중복 등록되므로 먼저 확인한다.
        const fresh = await opsApi.getInquiry(inquiryId).catch(() => null);
        if (!fresh) {
          showToast("답변이 저장됐는지 확인하지 못했어요. 새로고침해 답변을 확인한 뒤 다시 보내주세요.", "error");
          return;
        }
        if (!replyLanded(before, fresh.replies, content)) {
          showToast("답변을 보내지 못했어요. 잠시 후 다시 시도해주세요.", "error");
          return;
        }
        delayed = true;
      }

      // 여기부터는 답변이 저장된 것이 확실하다. 이후 새로고침이 실패해도 "보내지 못함"으로 안내하지 않는다.
      setPending(null);
      clearDraft(inquiryId);
      setReply("");
      showToast(
        delayed ? "답변은 저장됐어요. 회사로 전달되는 데 시간이 걸릴 수 있어요." : "답변을 보냈어요.",
        "success",
      );
      try {
        const [fresh] = await Promise.all([opsApi.getInquiry(inquiryId), loadList()]);
        setDetail((current) => (current?.inquiryId === inquiryId ? fresh : current));
      } catch {
        void loadList();
      }
    } finally {
      setSending(false);
    }
  };

  const reopen = async () => {
    if (!detail || reopening) return;
    setReopening(true);
    try {
      const updated = await opsApi.updateInquiryStatus(detail.inquiryId, "OPEN", detail.version);
      setDetail({ ...updated, replies: detail.replies });
      showToast("문의를 다시 열었어요.", "success");
      void loadList();
    } catch (err) {
      showToast(
        err instanceof ApiError && err.status === 409
          ? "다른 운영자가 먼저 변경했어요. 새로고침 후 다시 시도해주세요."
          : errorMessage(err, "상태를 바꾸지 못했어요."),
        "error",
      );
    } finally {
      setReopening(false);
    }
  };

  const tabButton = (key: InquiryTab, label: string, count: number) => (
    <button
      key={key}
      type="button"
      role="tab"
      aria-selected={tab === key}
      onClick={() => setTab(key)}
      className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
        tab === key ? "bg-[var(--ops-accent)] font-medium text-white" : "text-[var(--ops-body)] hover:bg-[var(--ops-chip-bg)]"
      }`}
    >
      {label} {count}
    </button>
  );

  const closed = detail?.status === "CLOSED";

  return (
    <OpsLayout openInquiries={items ? counts.open : null}>
      <div className="flex w-full flex-col gap-6 px-4 pb-8 md:px-8">
        <OpsPageHeader crumb="운영 › 민원 처리" title="민원 처리" description="회사에서 보낸 문의에 답변해요." />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="tablist" aria-label="문의 상태" className="inline-flex gap-1 rounded-full border border-[var(--ops-border)] bg-[var(--ops-surface)] p-1">
            {tabButton("all", "전체", counts.all)}
            {tabButton("open", "답변 대기", counts.open)}
            {tabButton("done", "답변 완료", counts.done)}
          </div>
          {/* 기본 화살표는 브라우저마다 달라 끄고, 다른 화면과 같은 아이콘을 얹는다. */}
          <label className="relative inline-flex items-center">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              aria-label="문의 유형"
              className="h-10 cursor-pointer appearance-none rounded-lg border border-[var(--ops-border)] bg-[var(--ops-surface)] pl-3 pr-9 text-sm text-[var(--ops-body)] outline-none [color-scheme:var(--native-color-scheme)] focus-visible:ring-2 focus-visible:ring-[var(--ops-accent)]"
            >
              <option value={TYPE_ALL}>유형 전체</option>
              {types.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-3 size-3.5 text-[var(--ops-body)]" />
          </label>
        </div>

        {truncated && (
          <p className="text-xs text-[var(--ops-faint)]">문의가 많아 최근 1,000건만 불러왔어요.</p>
        )}

        {loadError ? (
          <div className="flex flex-col items-center gap-3 p-10 rounded-[14px] border border-[var(--ops-border)] bg-[var(--ops-surface)] shadow-[var(--ops-card-shadow)]">
            <p role="alert" className="text-sm text-[var(--color-danger-text)]">{loadError}</p>
            <button type="button" onClick={() => void loadList()} className="rounded-lg border border-[var(--ops-border)] px-4 py-2 text-sm">다시 시도</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
            {/* 목록 */}
            <section className="flex min-h-[480px] flex-col rounded-[14px] border border-[var(--ops-border)] bg-[var(--ops-surface)] shadow-[var(--ops-card-shadow)]">
              <div className="p-3">
                <input
                  type="search"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="제목, 내용 검색"
                  aria-label="문의 검색"
                  className="h-10 w-full rounded-lg bg-[var(--ops-chip-bg)] px-3 text-sm text-[var(--ops-heading)] outline-none focus:ring-2 focus:ring-[var(--ops-accent)]"
                />
              </div>
              {!items ? (
                <p role="status" className="p-6 text-center text-sm text-[var(--ops-faint)]">문의를 불러오는 중...</p>
              ) : visible.length === 0 ? (
                <p className="p-6 text-center text-sm text-[var(--ops-faint)]">조건에 맞는 문의가 없어요.</p>
              ) : (
                <ul className="flex flex-col px-2 pb-2">
                  {visible.map((item) => {
                    const active = item.inquiryId === selectedId;
                    return (
                      <li key={item.inquiryId}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(item.inquiryId)}
                          aria-current={active ? "true" : undefined}
                          className={`flex w-full flex-col gap-1.5 rounded-md border-l-2 px-4 py-3 text-left transition-colors ${
                            active ? "border-[var(--ops-accent)] bg-[var(--ops-accent-soft)]" : "border-transparent hover:bg-[var(--ops-chip-bg)]"
                          }`}
                        >
                          <span className="flex items-center justify-between gap-2">
                            <TypeChip title={item.title} />
                            <StatusBadge status={item.status} />
                          </span>
                          <span className="truncate text-sm font-medium text-[var(--ops-heading)]">{item.title}</span>
                          <span className="text-xs text-[var(--ops-faint)]">{relativeTime(item.createdAt)}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* 상세 */}
            <section className="flex min-h-[480px] flex-col rounded-[14px] border border-[var(--ops-border)] bg-[var(--ops-surface)] shadow-[var(--ops-card-shadow)]">
              {!detail ? (
                <p className="m-auto p-6 text-sm text-[var(--ops-faint)]">
                  {detailLoading ? "문의를 불러오는 중..." : "왼쪽에서 문의를 선택하세요."}
                </p>
              ) : (
                <>
                  <header className="flex flex-col gap-2 border-b border-[var(--ops-border)] p-6">
                    <div className="flex items-center justify-between gap-2">
                      <TypeChip title={detail.title} />
                      <StatusBadge status={detail.status} />
                    </div>
                    <h2 className="text-lg font-semibold text-[var(--ops-heading)]">{detail.title}</h2>
                    <p className="text-xs text-[var(--ops-faint)]">{formatDateTime(detail.createdAt)}</p>
                  </header>

                  <div className="flex flex-1 flex-col gap-5 p-6">
                    <p className="whitespace-pre-wrap rounded-lg bg-[var(--ops-chip-bg)] p-4 text-sm leading-6 text-[var(--ops-heading)]">{detail.content}</p>

                    {detail.replies.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <h3 className="text-sm font-medium text-[var(--ops-heading)]">보낸 답변 {detail.replies.length}</h3>
                        {detail.replies.map((r, index) => (
                          <div key={r.replyId || index} className="rounded-lg border border-[var(--ops-border)] p-4">
                            <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--ops-heading)]">{r.content}</p>
                            {r.answeredAt && <p className="pt-2 text-xs text-[var(--ops-faint)]">{formatDateTime(r.answeredAt)}</p>}
                          </div>
                        ))}
                      </div>
                    )}

                    {closed ? (
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--ops-border)] p-4">
                        <p className="text-sm text-[var(--ops-body)]">종료된 문의예요. 답변하려면 다시 열어주세요.</p>
                        <button type="button" onClick={() => void reopen()} disabled={reopening} className="rounded-lg border border-[var(--ops-border)] px-4 py-2 text-sm disabled:opacity-60">
                          {reopening ? "여는 중..." : "다시 열기"}
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <label htmlFor="ops-reply" className="text-sm font-medium text-[var(--ops-heading)]">답변 작성</label>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs text-[var(--ops-faint)]">템플릿</span>
                            {REPLY_TEMPLATES.map((t) => (
                              <button
                                key={t.label}
                                type="button"
                                onClick={() => insertTemplate(t.body)}
                                className="rounded-full bg-[var(--ops-accent-soft)] px-2.5 py-1 text-xs text-[var(--ops-accent)] transition hover:brightness-95"
                              >
                                + {t.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="relative">
                          <textarea
                            id="ops-reply"
                            value={reply}
                            onChange={(e) => setReply(e.target.value.slice(0, REPLY_MAX_LENGTH))}
                            rows={7}
                            placeholder="답변 내용을 입력하세요."
                            className="w-full resize-y rounded-lg border border-[var(--ops-border)] bg-[var(--ops-surface)] p-4 pb-8 text-sm leading-6 text-[var(--ops-heading)] outline-none focus:border-[var(--ops-accent)]"
                          />
                          <span className="pointer-events-none absolute bottom-3 right-4 text-xs text-[var(--ops-faint)]">
                            {reply.length} / {REPLY_MAX_LENGTH}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className={`flex items-center gap-2 text-sm text-[var(--ops-body)] ${lockedClose !== null ? "opacity-70" : ""}`}>
                            <input
                              type="checkbox"
                              checked={effectiveClose}
                              disabled={lockedClose !== null}
                              onChange={(e) => setCloseAfterReply(e.target.checked)}
                              className="size-4 accent-[var(--ops-accent)] disabled:cursor-not-allowed"
                            />
                            답변을 보내면 완료로 표시
                          </label>
                          {lockedClose !== null && (
                            <p className="text-xs text-[var(--ops-faint)]">
                              이전 전송의 저장 여부를 확인 중이라 같은 설정으로 다시 보내요. 내용을 바꾸면 새 답변으로 보내져요.
                            </p>
                          )}
                        </div>
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={saveTemporarily} disabled={sending} className="rounded-lg border border-[var(--ops-border)] px-5 py-2.5 text-sm disabled:opacity-60">
                            임시 저장
                          </button>
                          <button type="button" onClick={() => void send()} disabled={sending || !reply.trim()} className="rounded-lg bg-[var(--ops-accent)] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60">
                            {sending ? "보내는 중..." : "답변 보내기"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </section>
          </div>
        )}
      </div>
    </OpsLayout>
  );
}
