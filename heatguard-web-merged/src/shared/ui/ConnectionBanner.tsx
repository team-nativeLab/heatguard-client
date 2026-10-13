// ⚠️ 자동 생성 파일 — heatguard-shared/src 에서 수정한 뒤 `node sync.mjs`로 반영하세요.
import { useEffect, useState } from "react";
import { CONNECTION_EVENT, DEMO_MODE, getConnectionState } from "../api/client";

/** 서버에 연결되지 않았을 때 화면 구석에 알려주는 작은 배지 */
export default function ConnectionBanner() {
  const [online, setOnline] = useState<boolean | null>(getConnectionState());

  useEffect(() => {
    const handler = (e: Event) => setOnline((e as CustomEvent<{ online: boolean }>).detail.online);
    window.addEventListener(CONNECTION_EVENT, handler);
    return () => window.removeEventListener(CONNECTION_EVENT, handler);
  }, []);

  if (online !== false) return null;

  return (
    <div
      role="status"
      className={`print:hidden fixed bottom-4 right-4 z-[80] flex items-center gap-2 rounded-full border bg-[var(--color-bg-card)]/95 backdrop-blur px-3.5 py-1.5 shadow-lg text-[11px] ${
        DEMO_MODE
          ? "border-[var(--color-border)] text-[var(--color-text-body)]"
          : "border-[var(--color-danger-border,var(--color-modal-danger-border))] text-[var(--color-danger-text)]"
      }`}
    >
      <span className={`size-1.5 rounded-full ${DEMO_MODE ? "bg-[#f59e0b]" : "bg-[#ef4444] animate-pulse"}`} />
      {DEMO_MODE ? "서버 미연결 · 데모 데이터로 표시 중" : "서버에 연결할 수 없어요 · 자동으로 다시 시도 중"}
    </div>
  );
}
