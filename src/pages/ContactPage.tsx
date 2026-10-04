import { useEffect, useState } from "react";
import HomeLayout from "../components/home/HomeLayout";
import { useToast } from "../shared/ui/Toast";
import { SkeletonList } from "../shared/ui/Skeleton";
import { inquiriesApi, isDemoFallback, errorMessage, type Inquiry, type InquiryStatus } from "../api";

const STATUS_LABEL: Record<InquiryStatus, string> = { OPEN: "답변 대기", ANSWERED: "답변 완료", CLOSED: "종료" };
const MAX_TITLE = 50;
const MAX_CONTENT = 1000;

export default function ContactPage() {
  const { showToast } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      showToast("제목과 내용을 모두 입력해주세요.", "error");
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    const payload = { title: title.trim(), content: content.trim() };
    try {
      const created = await inquiriesApi.createInquiry(payload);
      setInquiries((prev) => [created, ...prev]);
      setTitle("");
      setContent("");
      showToast("문의가 등록됐어요.", "success");
    } catch (err) {
      if (isDemoFallback(err)) {
        setInquiries((prev) => [
          { inquiryId: `local-${Date.now()}`, ...payload, status: "OPEN", reply: null, createdAt: new Date().toISOString() },
          ...prev,
        ]);
        setTitle("");
        setContent("");
        showToast("문의가 등록됐어요. (데모)", "success");
        return;
      }
      showToast(errorMessage(err, "문의 등록에 실패했어요."), "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <HomeLayout>
      <div className="w-full flex justify-center">
        <div className="w-full max-w-[512px] flex flex-col items-start">
          <h1 className="font-semibold text-xl text-[var(--color-text-heading)] leading-7">문의하기</h1>

          <div className="flex flex-col w-full pt-6 gap-4">
            <label className="flex flex-col w-full gap-1.5">
              <span className="text-[var(--color-text-body)] text-xs leading-4">제목</span>
              <input
                type="text"
                value={title}
                maxLength={MAX_TITLE}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded h-[38px] w-full px-3 text-sm text-[var(--color-text-heading)] outline-none focus:border-[var(--color-accent)] transition-colors"
              />
            </label>

            <label className="flex flex-col w-full gap-1.5">
              <span className="flex justify-between text-[var(--color-text-body)] text-xs leading-4">
                내용
                <span className="text-[var(--color-text-faint)] font-['JetBrains_Mono',monospace]">
                  {content.length}/{MAX_CONTENT}
                </span>
              </span>
              <textarea
                value={content}
                maxLength={MAX_CONTENT}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                className="bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded w-full p-3 text-sm text-[var(--color-text-heading)] outline-none focus:border-[var(--color-accent)] transition-colors resize-none"
              />
            </label>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-[var(--color-accent)] h-9 px-5 rounded-lg text-sm font-medium text-white self-start hover:brightness-110 transition disabled:opacity-60"
            >
              {submitting ? "등록 중..." : "문의 등록"}
            </button>
          </div>

          <div className="border-[var(--color-border)] border-t flex flex-col w-full pt-6 mt-6">
            <h2 className="text-[var(--color-text-label)] text-sm font-medium">내 문의 목록</h2>
            {!loaded ? (
              <div className="pt-3"><SkeletonList count={2} itemClassName="h-[64px]" /></div>
            ) : inquiries.length === 0 ? (
              <p className="text-[var(--color-text-faint)] text-sm pt-3">등록된 문의가 없습니다.</p>
            ) : (
              <div className="flex flex-col gap-2 pt-3 w-full">
                {inquiries.map((item) => (
                  <div key={item.inquiryId} className="bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg px-4 py-3 w-full">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            item.status === "OPEN"
                              ? "bg-[var(--color-bg-tile)] text-[var(--color-text-body)]"
                              : item.status === "ANSWERED"
                                ? "bg-[var(--color-accent-soft-bg)] text-[var(--color-accent)]"
                                : "bg-[var(--color-success-soft-bg)] text-[var(--color-success)]"
                          }`}
                        >
                          {STATUS_LABEL[item.status]}
                        </span>
                        <p className="text-[var(--color-text-heading)] text-sm font-medium truncate">{item.title}</p>
                      </div>
                      <span className="shrink-0 text-[var(--color-text-faint)] text-xs font-['JetBrains_Mono',monospace]">
                        {new Date(item.createdAt).toLocaleDateString("ko-KR")}
                      </span>
                    </div>
                    <p className="text-[var(--color-text-body)] text-xs pt-1.5 whitespace-pre-wrap">{item.content}</p>
                    {item.reply && (
                      <div className="mt-2 pt-2 border-t border-[var(--color-border)]">
                        <p className="text-[var(--color-accent)] text-[11px] font-medium pb-1">운영팀 답변</p>
                        <p className="text-[var(--color-text-body)] text-xs whitespace-pre-wrap">{item.reply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </HomeLayout>
  );
}
