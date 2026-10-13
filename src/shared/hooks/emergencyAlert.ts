// ⚠️ 자동 생성 파일 — heatguard-shared/src 에서 수정한 뒤 `node sync.mjs`로 반영하세요.
/**
 * 긴급호출이 오면 사용자가 다른 탭을 보고 있어도 알 수 있게
 * 브라우저 알림 · 경고음 · 탭 제목 깜빡임을 함께 보낸다.
 */

let audioCtx: AudioContext | null = null;
let permissionAsked = false;

/** 첫 클릭/키 입력 때 알림 권한을 묻고 오디오를 깨운다. (브라우저는 사용자 동작 없이 소리/권한 요청을 막는다) */
export function primeEmergencyAlerts() {
  const prime = () => {
    try {
      audioCtx ??= new AudioContext();
      if (audioCtx.state === "suspended") void audioCtx.resume();
    } catch {
      // 오디오 미지원 환경
    }
    if (!permissionAsked && "Notification" in window && Notification.permission === "default") {
      permissionAsked = true;
      void Notification.requestPermission();
    }
    window.removeEventListener("pointerdown", prime);
    window.removeEventListener("keydown", prime);
  };
  window.addEventListener("pointerdown", prime);
  window.addEventListener("keydown", prime);
  return () => {
    window.removeEventListener("pointerdown", prime);
    window.removeEventListener("keydown", prime);
  };
}

function playAlarm() {
  if (!audioCtx || audioCtx.state !== "running") return;
  const now = audioCtx.currentTime;
  // 짧은 삐-삐-삐 3회
  for (let i = 0; i < 3; i++) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "square";
    osc.frequency.value = 880;
    const t = now + i * 0.28;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  }
}

let titleTimer: number | undefined;
let originalTitle = "";

function flashTitle(message: string) {
  if (titleTimer) return;
  originalTitle = document.title;
  let on = false;
  titleTimer = window.setInterval(() => {
    on = !on;
    document.title = on ? `🚨 ${message}` : originalTitle;
  }, 1000);
  const stop = () => {
    if (document.hidden) return;
    window.clearInterval(titleTimer);
    titleTimer = undefined;
    document.title = originalTitle;
    document.removeEventListener("visibilitychange", stop);
  };
  document.addEventListener("visibilitychange", stop);
  if (!document.hidden) window.setTimeout(stop, 6000);
}

export function notifyEmergency({ title, body, tag, onClick }: { title: string; body: string; tag: string; onClick?: () => void }) {
  playAlarm();
  if (document.hidden) flashTitle(title);
  if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
    try {
      const n = new Notification(title, { body, tag, requireInteraction: true });
      n.onclick = () => {
        window.focus();
        onClick?.();
        n.close();
      };
    } catch {
      // 일부 브라우저는 페이지 컨텍스트 알림을 지원하지 않는다.
    }
  }
}
