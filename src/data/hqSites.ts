/** 본사 화면 공용 현장 샘플 데이터 (대시보드 · 현장 관리 · 현장 상세에서 함께 사용) */
export interface HQSite {
  id: string;
  name: string;
  manager: string;
  email: string;
  /** 현재 최고 온도. 미입력이면 빈 문자열 */
  temp: string;
  status: string;
  tone: "red" | "orange" | "yellow" | "none";
  /** 전체 체크리스트 진행 */
  done: string;
  /** 오늘 기록 건수 */
  count: number;
  teams: { name: string; done: string }[];
}

export const HQ_SITES: HQSite[] = [
  {
    id: "ulsan",
    name: "울산 석유화학 플랜트 증설",
    manager: "이민준",
    email: "minjun@ex.com",
    temp: "38.7°C",
    status: "폭염 중대경보",
    tone: "red",
    done: "4/6 완료",
    count: 8,
    teams: [
      { name: "A팀", done: "4/6 완료" },
      { name: "B팀", done: "5/6 완료" },
      { name: "C팀", done: "2/6 완료" },
    ],
  },
  {
    id: "incheon",
    name: "인천 복합물류센터 신축",
    manager: "김철수",
    email: "chulsoo@ex.com",
    temp: "36.2°C",
    status: "폭염 경보",
    tone: "orange",
    done: "5/6 완료",
    count: 12,
    teams: [
      { name: "A팀", done: "5/6 완료" },
      { name: "B팀", done: "6/6 완료" },
      { name: "C팀", done: "4/6 완료" },
    ],
  },
  {
    id: "busan",
    name: "부산항 3부두 확장",
    manager: "박지현",
    email: "jihyun@ex.com",
    temp: "33.1°C",
    status: "폭염 주의보",
    tone: "yellow",
    done: "6/6 완료",
    count: 5,
    teams: [
      { name: "A팀", done: "6/6 완료" },
      { name: "B팀", done: "6/6 완료" },
    ],
  },
  {
    id: "gyeonggi",
    name: "경기 북부 산단 기반시설",
    manager: "최도현",
    email: "dohyun@ex.com",
    temp: "",
    status: "미입력",
    tone: "none",
    done: "0/6 완료",
    count: 0,
    teams: [
      { name: "A팀", done: "0/6 완료" },
      { name: "B팀", done: "0/6 완료" },
      { name: "C팀", done: "0/6 완료" },
      { name: "D팀", done: "0/6 완료" },
    ],
  },
];

export function findSite(id: string | undefined) {
  return HQ_SITES.find((s) => s.id === id);
}
