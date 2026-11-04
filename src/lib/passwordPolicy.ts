export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_POLICY_HINT =
  "영문·숫자·특수문자로 8자 이상 입력해 주세요. 한글과 공백은 사용할 수 없어요.";

export function getPasswordCharacterError(password: string): string | undefined {
  if (/[^!-~]/.test(password)) {
    return "한글·공백은 사용할 수 없어요. 영문·숫자·특수문자로 입력해 주세요.";
  }
  return undefined;
}

export function getPasswordError(password: string): string | undefined {
  if (!password) return "비밀번호를 입력해 주세요.";
  const characterError = getPasswordCharacterError(password);
  if (characterError) return characterError;
  if (password.length < PASSWORD_MIN_LENGTH) return `${PASSWORD_MIN_LENGTH}자 이상 입력해 주세요.`;
  return undefined;
}

export function getPasswordConfirmationError(
  password: string,
  confirmation: string,
): string | undefined {
  if (!confirmation) return "비밀번호를 한 번 더 입력해 주세요.";
  const characterError = getPasswordCharacterError(confirmation);
  if (characterError) return characterError;
  if (password !== confirmation) return "비밀번호가 일치하지 않아요.";
  return undefined;
}
