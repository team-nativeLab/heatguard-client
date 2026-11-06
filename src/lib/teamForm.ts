export interface TeamFormValues {
  leaderName: string;
  workLocation: string;
  contact: string;
  memberCount: string;
  leaderEmail: string;
  initialPassword: string;
}

const PHONE_RE = /^0\d{1,2}-?\d{3,4}-?\d{4}$/;

export function formatTeamPhone(value: string): string {
  let digits = value.replace(/\D/g, "");
  const isSeoulNumber = digits.startsWith("02");
  const areaLength = isSeoulNumber ? 2 : 3;
  digits = digits.slice(0, isSeoulNumber ? 10 : 11);
  if (digits.length <= areaLength) return digits;

  const area = digits.slice(0, areaLength);
  const subscriber = digits.slice(areaLength);
  const middle = subscriber.slice(0, 4);
  const last = subscriber.slice(4, 8);
  return \`\${area}-\${middle}\${last ? \`-\${last}\` : ""}\`;
}

/** 팀 추가/수정 폼 검증. 문제가 있으면 안내 문구를 돌려준다. */
export function validateTeamForm(v: Pick<TeamFormValues, "leaderName" | "workLocation" | "contact" | "memberCount">): string | null {
  if (!v.leaderName.trim()) return "이름은 필수예요.";
  if (v.leaderName.trim().length > 20) return "이름은 20자 이내로 입력해주세요.";
  if (v.workLocation.trim().length > 50) return "작업 장소는 50자 이내로 입력해주세요.";
  if (v.contact.trim() && !PHONE_RE.test(v.contact.trim())) return "전화번호 형식을 확인해주세요. (예: 010-1234-5678)";
  if (v.memberCount.trim()) {
    const n = Number(v.memberCount.trim());
    if (!Number.isInteger(n) || n < 1 || n > 999) return "인원은 1~999 사이 숫자로 입력해주세요.";
  }
  return null;
}
