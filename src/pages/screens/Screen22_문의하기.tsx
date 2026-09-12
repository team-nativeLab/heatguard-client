import { useState } from "react";
import ManagerLayout from "../../components/manager/ManagerLayout";
import { useToast } from "../../components/ui/Toast";

interface Inquiry {
  id: number;
  title: string;
  content: string;
  createdAt: string;
}

export default function Screen22_문의하기() {
  const { showToast } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) {
      showToast("제목과 내용을 모두 입력해주세요.", "error");
      return;
    }
    setInquiries((prev) => [
      { id: Date.now(), title: title.trim(), content: content.trim(), createdAt: new Date().toLocaleDateString("ko-KR") },
      ...prev,
    ]);
    setTitle("");
    setContent("");
    showToast("문의가 등록됐어요.", "success");
  };

  return (
    <ManagerLayout>
      <div className="w-full flex justify-center">
        <div className="w-full max-w-[512px] flex flex-col items-start">
          <h1 className="font-semibold text-xl text-[var(--color-text-heading)] leading-7">문의하기</h1>

          <div className="flex flex-col w-full pt-6 gap-4">
            <label className="flex flex-col w-full gap-1.5">
              <span className="text-[var(--color-text-body)] text-xs leading-4">제목</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded h-[38px] w-full px-3 text-sm text-[var(--color-text-heading)] outline-none focus:border-[var(--color-accent)] transition-colors"
              />
            </label>

            <label className="flex flex-col w-full gap-1.5">
              <span className="text-[var(--color-text-body)] text-xs leading-4">내용</span>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                className="bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded w-full p-3 text-sm text-[var(--color-text-heading)] outline-none focus:border-[var(--color-accent)] transition-colors resize-none"
              />
            </label>

            <button
              type="button"
              onClick={handleSubmit}
              className="bg-[var(--color-accent)] h-[26px] px-[18px] rounded text-sm font-medium text-white self-start hover:brightness-110 transition"
            >
              문의 등록
            </button>
          </div>

          <div className="border-[var(--color-border)] border-t flex flex-col w-full pt-6 mt-6">
            <h2 className="text-[var(--color-text-label)] text-sm font-medium">내 문의 목록</h2>
            {inquiries.length === 0 ? (
              <p className="text-[var(--color-text-faint)] text-sm pt-3">등록된 문의가 없습니다.</p>
            ) : (
              <div className="flex flex-col gap-2 pt-3 w-full">
                {inquiries.map((item) => (
                  <div key={item.id} className="bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg px-4 py-3 w-full">
                    <div className="flex items-center justify-between">
                      <p className="text-[var(--color-text-heading)] text-sm font-medium">{item.title}</p>
                      <span className="text-[var(--color-text-faint)] text-xs font-['JetBrains_Mono',monospace]">{item.createdAt}</span>
                    </div>
                    <p className="text-[var(--color-text-body)] text-xs pt-1.5 whitespace-pre-wrap">{item.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ManagerLayout>
  );
}
