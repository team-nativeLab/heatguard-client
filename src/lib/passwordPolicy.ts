export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_POLICY_HINT =
  "영문·숫자·특수문자만 8자 이상 입력해 주세요. 반복·연속 문자와 흔한 비밀번호는 사용할 수 없어요.";

const COMMON_PASSWORD_WORDS = new Set([
  "password",
  "qwerty",
  "letmein",
  "welcome",
  "admin",
  "administrator",
  "test",
  "iloveyou",
  "changeme",
]);

export function getPasswordCharacterError(password: string): string | undefined {
  if (/[^\x21-\x7e]/.test(password)) {
    return "한글·공백 등은 사용할 수 없어요. 영문·숫자·특수문자로 입력해 주세요.";
  }
  return undefined;
}

function hasRepeatedBlock(password: string): boolean {
  // A prefix table keeps repeated-pattern checks linear even for long pasted input.
  const prefixLengths = new Uint32Array(password.length);
  for (let position = 1, matchedLength = 0; position < password.length; position++) {
    while (matchedLength > 0 && password[position] !== password[matchedLength]) {
      matchedLength = prefixLengths[matchedLength - 1];
    }
    if (password[position] === password[matchedLength]) matchedLength++;
    prefixLengths[position] = matchedLength;
  }
  const blockLength = password.length - prefixLengths[password.length - 1];
  return blockLength < password.length && password.length % blockLength === 0;
}

function hasSequence(password: string): boolean {
  for (let position = 0; position <= password.length - 4; position++) {
    const firstCode = password.charCodeAt(position);
    const isDigit = firstCode >= 48 && firstCode <= 57;
    const isLetter = firstCode >= 97 && firstCode <= 122;
    if (!isDigit && !isLetter) continue;
    const direction = password.charCodeAt(position + 1) - firstCode;
    if (direction !== 1 && direction !== -1) continue;
    let sequenceLength = 1;
    for (let offset = 1; offset < 4; offset++) {
      const nextCode = password.charCodeAt(position + offset);
      const inRange = isDigit
        ? nextCode >= 48 && nextCode <= 57
        : nextCode >= 97 && nextCode <= 122;
      if (!inRange || nextCode !== firstCode + offset * direction) break;
      sequenceLength++;
    }
    if (sequenceLength === 4) return true;
  }
  return false;
}

export function getPasswordError(password: string): string | undefined {
  if (!password) return "비밀번호를 입력해 주세요.";
  const characterError = getPasswordCharacterError(password);
  if (characterError) return characterError;
  if (password.length < PASSWORD_MIN_LENGTH) return `${PASSWORD_MIN_LENGTH}자 이상 입력해 주세요.`;

  const comparablePassword = password.toLowerCase();
  for (let position = 2; position < comparablePassword.length; position++) {
    if (
      comparablePassword[position] === comparablePassword[position - 1] &&
      comparablePassword[position] === comparablePassword[position - 2]
    ) {
      return "같은 문자를 3번 이상 연속해서 사용할 수 없어요.";
    }
  }
  if (hasRepeatedBlock(comparablePassword)) return "같은 문자 묶음을 반복한 비밀번호는 사용할 수 없어요.";
  if (hasSequence(comparablePassword)) return "숫자나 영문을 4자리 이상 순서대로 사용할 수 없어요.";
  const lettersOnly = comparablePassword.replace(/[^a-z]/g, "");
  if (COMMON_PASSWORD_WORDS.has(lettersOnly)) return "흔히 쓰는 비밀번호예요. 다른 비밀번호를 입력해 주세요.";
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
