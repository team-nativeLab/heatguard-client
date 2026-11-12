export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_POLICY_HINT = "8자 이상 입력해 주세요.";
export const SIGNUP_PASSWORD_MIN_LENGTH = PASSWORD_MIN_LENGTH;
export const SIGNUP_PASSWORD_POLICY_HINT = PASSWORD_POLICY_HINT;

export function getPasswordError(password: string, minimumLength = PASSWORD_MIN_LENGTH): string | undefined {
  if (!password) return "비밀번호를 입력해 주세요.";
  if (password.length < minimumLength) return `${minimumLength}자 이상 입력해 주세요.`;
  return undefined;
}

export function getPasswordConfirmationError(
  password: string,
  confirmation: string,
): string | undefined {
  if (!confirmation) return "비밀번호를 한 번 더 입력해 주세요.";
  if (password !== confirmation) return "비밀번호가 일치하지 않아요.";
  return undefined;
}
