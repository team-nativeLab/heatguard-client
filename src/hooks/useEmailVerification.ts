import { useEffect, useRef, useState } from "react";
import { sendEmailCode } from "../api/emailVerification";
import { ApiError, errorMessage } from "../api/client";

const EMPTY = { email: "", expiresAt: 0, resendAt: 0 };
const RESEND_INTERVAL_MS = 60_000;

export function useEmailVerification(email: string) {
  const [challenge, setChallenge] = useState(EMPTY);
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now);
  const requestId = useRef(0);
  const pending = useRef(false);
  const address = email.trim();
  const sent = challenge.email === address && challenge.expiresAt > 0;
  const remaining = sent ? Math.max(0, Math.ceil((challenge.expiresAt - now) / 1000)) : 0;
  const cooldown = challenge.email === address ? Math.max(0, Math.ceil((challenge.resendAt - now) / 1000)) : 0;

  useEffect(() => {
    const deadline = Math.max(challenge.expiresAt, challenge.resendAt);
    if (!deadline) return;
    const timer = window.setInterval(() => {
      const time = Date.now();
      setNow(time);
      if (time >= deadline) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [challenge.expiresAt, challenge.resendAt]);

  const reset = () => {
    requestId.current += 1;
    pending.current = false;
    setSending(false);
    setChallenge(EMPTY);
    setCode("");
    setError("");
  };

  const send = async () => {
    if (pending.current || (challenge.email === address && Date.now() < challenge.resendAt)) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
      setError("이메일 형식을 확인해주세요.");
      return;
    }
    const id = ++requestId.current;
    pending.current = true;
    setSending(true);
    setError("");
    try {
      const response = await sendEmailCode(address);
      if (id !== requestId.current) return;
      const time = Date.now();
      const expiresAt = Date.parse(response?.expiresAt);
      if (!Number.isFinite(expiresAt) || expiresAt <= time) throw new Error("Invalid verification expiry");
      setChallenge({ email: address, expiresAt, resendAt: time + RESEND_INTERVAL_MS });
      setCode("");
      setNow(time);
    } catch (err) {
      if (id !== requestId.current) return;
      if (err instanceof ApiError && err.status === 429) {
        const time = Date.now();
        setChallenge((prev) => ({ ...(prev.email === address ? prev : EMPTY), email: address, resendAt: time + RESEND_INTERVAL_MS }));
        setNow(time);
      }
      setError(err instanceof ApiError && err.status === 503
        ? "현재 인증 메일을 보낼 수 없어요. 잠시 후 다시 시도해주세요."
        : err instanceof ApiError && err.status === 429
          ? "요청이 많아요. 60초 후 다시 발송해주세요."
          : errorMessage(err, "인증 메일을 발송하지 못했어요."));
    } finally {
      if (id === requestId.current) {
        pending.current = false;
        setSending(false);
      }
    }
  };

  const inputError = () => {
    if (!sent) return "먼저 이메일 인증코드를 발송해주세요.";
    if (Date.now() >= challenge.expiresAt) return "인증코드가 만료됐어요. 다시 발송해주세요.";
    if (!/^\d{6}$/.test(code)) return "이메일로 받은 6자리 인증코드를 입력해주세요.";
    return null;
  };

  const editCode = (value: string) => {
    setCode(value);
    setError("");
  };

  return { code, setCode: editCode, sending, send, sent, remaining, cooldown, error, reset, inputError };
}
