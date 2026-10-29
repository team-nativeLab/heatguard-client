import { ApiError, NetworkError } from "./client";

const EMAIL_CODE_URL = "https://d2f845gr2v9cs2.cloudfront.net/api/v1/auth/team/email-codes";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** 공개 이메일 인증 API만 지정된 서비스에 직접 요청한다. 로그인 쿠키·토큰은 전송하지 않는다. */
async function requestEmailCode(url: string, body: { email: string; verificationCode?: string }, expectedStatus: number): Promise<unknown> {
  let response: Response;
  let text: string;
  try {
    response = await fetch(url, {
      method: "POST",
      credentials: "omit",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    text = await response.text();
  } catch {
    throw new NetworkError();
  }

  let result: unknown;
  try { result = text ? JSON.parse(text) : undefined; } catch { result = undefined; }
  if (!response.ok) {
    const error = isRecord(result) && isRecord(result.error) ? result.error : result;
    const message = isRecord(error) && typeof error.message === "string" && error.message
      ? error.message : `요청에 실패했어요. (${response.status})`;
    const code = isRecord(error) && typeof error.code === "string" ? error.code : undefined;
    throw new ApiError(response.status, message, code);
  }
  if (response.status !== expectedStatus) throw new Error("Unexpected email verification status");
  if (expectedStatus === 202) return undefined;
  if (!isRecord(result) || result.success !== true || !("data" in result)) {
    throw new Error("Invalid email verification response");
  }
  return result.data;
}

/** 202는 발송 접수이며 인증 완료는 verify 응답으로 확인한다. */
export async function sendEmailCode(email: string): Promise<void> {
  await requestEmailCode(EMAIL_CODE_URL, { email }, 202);
}

export function verifyEmailCode(email: string, verificationCode: string) {
  return requestEmailCode(`${EMAIL_CODE_URL}/verify`, { email, verificationCode }, 200);
}
