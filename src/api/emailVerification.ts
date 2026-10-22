import { apiFetch } from "./client";

/** 202 응답은 발송 성공이며, 코드 검증은 register에서 수행한다. */
export function sendEmailCode(email: string) {
  return apiFetch<{ expiresAt: string }>("/api/v1/auth/email-codes", {
    method: "POST",
    body: { email },
  });
}
