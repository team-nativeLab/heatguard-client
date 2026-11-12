import { useEffect, useRef } from "react";

/** 모달이 열려 있는 동안 Esc 키로 닫기 */
export function useEscapeKey(onEscape: (() => void) | undefined) {
  const ref = useRef(onEscape);

  // 렌더 중에 ref를 쓰지 않는다 — 커밋되지 않은 렌더의 값이 남을 수 있다.
  useEffect(() => {
    ref.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") ref.current?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
