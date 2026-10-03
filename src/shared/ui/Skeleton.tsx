// ⚠️ 자동 생성 파일 — heatguard-shared/src 에서 수정한 뒤 `node sync.mjs`로 반영하세요.
/** 데이터를 불러오는 동안 자리를 잡아두는 회색 블록 */
export function Skeleton({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`block animate-pulse rounded-md bg-[var(--color-bg-tile)] ${className}`} />;
}

/** 불러오기 실패 안내 */
export function LoadError({ message = "정보를 불러오지 못했어요.", onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-6 py-10 text-center">
      <p className="text-sm text-[var(--color-text-heading)]">{message}</p>
      <p className="pt-1 text-xs text-[var(--color-text-body)]">네트워크 상태를 확인한 뒤 다시 시도해주세요.</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 h-8 rounded-lg border border-[var(--color-border)] px-3 text-xs text-[var(--color-text-label)] transition hover:bg-[var(--color-bg-tile)]"
        >
          다시 시도
        </button>
      )}
    </div>
  );
}

/** 목록형 카드 자리표시 */
export function SkeletonList({ count = 3, itemClassName = "h-[74px]" }: { count?: number; itemClassName?: string }) {
  return (
    <div role="status" aria-label="불러오는 중" className="flex w-full flex-col gap-2">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className={`w-full rounded-lg ${itemClassName}`} />
      ))}
    </div>
  );
}

/** 표 자리표시 */
export function SkeletonTable({ rows = 4 }: { rows?: number }) {
  return (
    <div role="status" aria-label="불러오는 중" className="w-full overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]">
      <div className="border-b border-[var(--color-border)] px-4 py-3">
        <Skeleton className="h-2.5 w-1/3" />
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-[var(--color-border)] px-4 py-3 last:border-b-0">
          <Skeleton className="size-8 shrink-0" />
          <Skeleton className="h-3 flex-1" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  );
}
