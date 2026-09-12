import { CloseIcon, ImagePlaceholderIcon, DownloadIcon } from "../icons/Icons";

export default function PhotoLightbox({
  takenAt,
  siteName,
  onClose,
}: {
  takenAt: string;
  siteName: string;
  onClose?: () => void;
}) {
  return (
    <div
      className="absolute inset-0 backdrop-blur-sm bg-black/80 flex items-center justify-center z-50 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl shadow-2xl w-full max-w-[512px] overflow-hidden">
        <div className="border-[var(--color-border)] border-b flex items-center justify-between px-5 py-4">
          <p className="font-['JetBrains_Mono',monospace] leading-5 text-[var(--color-text-label)] text-sm">
            촬영 일시 : {takenAt}
          </p>
          <button type="button" onClick={onClose} className="flex items-center justify-center text-[var(--color-text-body)] hover:text-[var(--color-text-heading)] transition">
            <CloseIcon className="size-5" />
          </button>
        </div>

        <div className="flex flex-col p-5 gap-4">
          <div className="bg-[var(--color-bg-app)] border border-[var(--color-border)] rounded-lg flex items-center justify-center h-[264px] w-full">
            <div className="flex flex-col items-center gap-2">
              <ImagePlaceholderIcon className="size-12 text-[var(--color-text-faint)]" />
              <p className="leading-4 text-[var(--color-text-faint)] text-xs">사진 미리보기</p>
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="leading-5 text-[var(--color-text-label)] text-sm">현장명 : {siteName}</p>
            <button
              type="button"
              className="bg-[var(--color-bg-tile)] flex gap-2 items-center px-4 py-2 rounded text-[var(--color-text-label)] text-sm hover:brightness-125 transition"
            >
              <DownloadIcon className="size-4" />
              다운로드
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
