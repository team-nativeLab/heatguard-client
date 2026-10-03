import { CameraIcon } from "./HomeIcons";

export default function RecordThumb({ src, onClick }: { scene?: number; src?: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="사진 크게 보기"
      className="flex items-center justify-center size-7 rounded overflow-hidden shrink-0 bg-[var(--home-mini-tile-bg)] border border-[var(--home-card-border)] text-[var(--color-text-faint)] hover:text-[var(--color-text-body)] hover:border-[var(--color-accent)]/40 transition-colors"
    >
      {src ? <img src={src} alt="" className="size-full object-cover" /> : <CameraIcon className="size-3.5" />}
    </button>
  );
}
