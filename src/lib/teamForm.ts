export interface TeamFormValues {
  leaderName: string;
  workLocation: string;
  contact: string;
  memberCount: string;
  leaderEmail: string;
  initialPassword: string;
}

const PHONE_RE = /^0\d{1,2}-?\d{3,4}-?\d{4}$/;

/** 입력하는 대로 하이픈을 넣는다. 02는 10자리, 그 외는 11자리까지. */
export function formatTeamPhone(value: string): string {
  let digits = value.replace(/\D/g, "");
  const isSeoulNumber = digits.startsWith("02");
  const areaLength = isSeoulNumber ? 2 : 3;
  digits = digits.slice(0, isSeoulNumber ? 10 : 11);
  if (digits.length <= areaLength) return digits;
  const area = digits.slice(0, areaLength);
  const subscriber = digits.slice(areaLength);
  // 가입자 번호가 7자리(예: 02-123-4567, 011-123-4567)면 3-4, 아니면 4-4로 나눈다.
  const middleLength = subscriber.length <= 7 && digits.length === (isSeoulNumber ? 9 : 10) ? 3 : 4;
  const middle = subscriber.slice(0, middleLength);
  const last = subscriber.slice(middleLength, middleLength + 4);
  return `${area}-${middle}${last ? `-${last}` : ""}`;
}

/**
 * 팀 추가/수정 폼 검증. 문제가 있으면 안내 문구를 돌려준다.
 * 팀장 전화번호는 서버 필수 값이고 작업자 앱 연동 확인에 쓰이므로 반드시 받는다.
 */
export function validateTeamForm(v: Pick<TeamFormValues, "leaderName" | "workLocation" | "contact" | "memberCount">): string | null {
  if (!v.leaderName.trim()) return "이름은 필수예요.";
  if (v.leaderName.trim().length > 20) return "이름은 20자 이내로 입력해주세요.";
  if (!v.contact.trim()) return "팀장 전화번호를 입력해주세요.";
  if (!PHONE_RE.test(v.contact.trim())) return "전화번호 형식을 확인해주세요. (예: 010-1234-5678)";
  if (v.workLocation.trim().length > 50) return "작업 장소는 50자 이내로 입력해주세요.";
  if (v.memberCount.trim()) {
    const n = Number(v.memberCount.trim());
    if (!Number.isInteger(n) || n < 1 || n > 999) return "인원은 1~999 사이 숫자로 입력해주세요.";
  }
  return null;
}
