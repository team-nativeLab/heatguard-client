/** 화면에서 쓰는 이메일 형식 검사 (공백·@ 없는 아이디@도메인.최상위도메인). 최종 판단은 서버가 한다. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}
