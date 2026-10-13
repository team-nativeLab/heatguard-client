/** 목록 화면에서 공통으로 쓰는 불러오는 중 / 오류 / 빈 상태 표시 */
export function LoadingBlock() {
  return (
    <div role="status" aria-label="불러오는 중" className="flex justify-center py-16">
      <span className="size-6 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)]" />
    </div>
  );
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-[var(--color-danger-border)] bg-[var(--color-danger-soft-bg)] px-5 py-8 text-center">
      <p className="text-sm text-[var(--color-danger-text)]">{message}</p>
      <button type="button" onClick={onRetry} className="h-8 rounded-md bg-[var(--color-accent)] px-3 text-xs font-medium text-white transition hover:brightness-110">
        다시 시도
      </button>
    </div>
  );
}

export function EmptyBlock({ children }: { children: string }) {
  return (
    <p className="rounded-lg border border-[var(--home-card-border)] bg-[var(--home-card-bg)] px-5 py-8 text-center text-sm text-[var(--color-text-faint)]">{children}</p>
  );
}
