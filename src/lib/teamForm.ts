export interface TeamFormValues {
  leaderName: string;
  workLocation: string;
  memberCount: string;
  leaderEmail: string;
  initialPassword: string;
}

/** 팀 추가/수정 폼 검증. 문제가 있으면 안내 문구를 돌려준다. */
export function validateTeamForm(v: Pick<TeamFormValues, "leaderName" | "workLocation" | "memberCount">): string | null {
  if (!v.leaderName.trim()) return "이름은 필수예요.";
  if (v.leaderName.trim().length > 20) return "이름은 20자 이내로 입력해주세요.";
  if (v.workLocation.trim().length > 50) return "작업 장소는 50자 이내로 입력해주세요.";
  if (v.memberCount.trim()) {
    const n = Number(v.memberCount.trim());
    if (!Number.isInteger(n) || n < 1 || n > 999) return "인원은 1~999 사이 숫자로 입력해주세요.";
  }
  return null;
}
