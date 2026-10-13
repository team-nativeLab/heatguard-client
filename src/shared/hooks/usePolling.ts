// ⚠️ 자동 생성 파일 — heatguard-shared/src 에서 수정한 뒤 `node sync.mjs`로 반영하세요.
import { useEffect, useRef } from "react";

/**
 * 주기적으로 fn을 실행한다.
 * - 처음 한 번은 즉시 실행
 * - 탭이 가려져 있으면 hiddenIntervalMs 간격으로 늦추고(null이면 멈춤)
 * - 탭이 다시 보이면 바로 한 번 실행한다.
 */
export function usePolling(fn: () => void | Promise<void>, intervalMs: number, hiddenIntervalMs: number | null = null) {
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });

  useEffect(() => {
    let timer: number | undefined;
    let stopped = false;

    const schedule = () => {
      if (stopped) return;
      const delay = document.hidden ? hiddenIntervalMs : intervalMs;
      if (delay == null) return;
      timer = window.setTimeout(tick, delay);
    };

    const tick = async () => {
      try {
        await fnRef.current();
      } finally {
        schedule();
      }
    };

    const onVisibility = () => {
      window.clearTimeout(timer);
      if (!document.hidden) tick();
      else schedule();
    };

    tick();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intervalMs, hiddenIntervalMs]);
}
