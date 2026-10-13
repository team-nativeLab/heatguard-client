// ⚠️ 자동 생성 파일 — heatguard-shared/src 에서 수정한 뒤 `node sync.mjs`로 반영하세요.
import { useEffect, useRef } from "react";

/** 모달이 열려 있는 동안 Esc 키로 닫기 */
export function useEscapeKey(onEscape: (() => void) | undefined) {
  const ref = useRef(onEscape);
  ref.current = onEscape;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") ref.current?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
