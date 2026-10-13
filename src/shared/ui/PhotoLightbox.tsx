// ⚠️ 자동 생성 파일 — heatguard-shared/src 에서 수정한 뒤 `node sync.mjs`로 반영하세요.
import { useState } from "react";
import { useToast } from "./Toast";
import { useEscapeKey } from "./useEscapeKey";

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M5 15L15 5M5 5L15 15" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2.667 10.667v.666a2 2 0 0 0 2 2h6.666a2 2 0 0 0 2-2v-.666M5.333 8 8 10.667 10.667 8M8 10.667v-8" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ImagePlaceholderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M8 32l9.172-9.172a4 4 0 0 1 5.656 0L32 32m-4-4 3.172-3.172a4 4 0 0 1 5.656 0L40 28M28 16h.02M12 40h24a4 4 0 0 0 4-4V12a4 4 0 0 0-4-4H12a4 4 0 0 0-4 4v24a4 4 0 0 0 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function PhotoLightbox({
  takenAt,
  siteName,
  photoUrl,
  onClose,
}: {
  takenAt: string;
  siteName: string;
  photoUrl?: string | null;
  onClose?: () => void;
}) {
  const { showToast } = useToast();
  const [broken, setBroken] = useState(false);
  const [downloading, setDownloading] = useState(false);
  useEscapeKey(onClose);

  const hasPhoto = !!photoUrl && !broken;

  const handleDownload = async () => {
    if (!photoUrl || downloading) return;
    setDownloading(true);
    const filename = `heatguard_${takenAt.replace(/[^0-9]/g, "") || "photo"}.jpg`;
    try {
      const res = await fetch(photoUrl, { credentials: "include" });
      if (!res.ok) throw new Error(String(res.status));
      const blobUrl = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(blobUrl);
      showToast("사진을 저장했어요.", "success");
    } catch {
      // CORS 등으로 blob 저장이 막히면 새 탭으로 연다.
      window.open(photoUrl, "_blank", "noopener,noreferrer");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="사진 크게 보기"
      className="fixed inset-0 backdrop-blur-sm bg-black/70 flex items-center justify-center z-50 px-4 animate-[fadeIn_0.15s_ease-out]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl shadow-2xl w-full max-w-[560px] overflow-hidden">
        <div className="border-[var(--color-border)] border-b flex items-center justify-between px-5 py-4">
          <p className="font-['JetBrains_Mono',monospace] leading-5 text-[var(--color-text-label)] text-sm">
            촬영 일시 : {takenAt}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex items-center justify-center size-7 rounded-md text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] hover:bg-[var(--color-bg-tile)] transition"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>

        <div className="flex flex-col p-5 gap-4">
          <div className="bg-[var(--color-bg-app)] border border-[var(--color-border)] rounded-lg flex items-center justify-center h-[300px] w-full overflow-hidden">
            {hasPhoto ? (
              <img src={photoUrl!} alt={`${siteName} 현장 사진`} className="size-full object-contain" onError={() => setBroken(true)} />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <ImagePlaceholderIcon className="size-12 text-[var(--color-text-faint)]" />
                <p className="leading-4 text-[var(--color-text-faint)] text-xs">
                  {broken ? "사진을 불러오지 못했어요." : "등록된 사진이 없어요."}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="leading-5 text-[var(--color-text-label)] text-sm">현장명 : {siteName}</p>
            <button
              type="button"
              onClick={handleDownload}
              disabled={!hasPhoto || downloading}
              className="bg-[var(--color-bg-tile)] flex gap-2 items-center px-4 py-2 rounded-lg text-[var(--color-text-label)] text-sm hover:brightness-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <DownloadIcon className="size-4" />
              {downloading ? "저장 중..." : "다운로드"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
