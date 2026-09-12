export interface ScreenMeta {
  nodeId: string;
  title: string;
  path: string;
}

export const SCREENS: ScreenMeta[] = [
  { nodeId: "109:2236", title: "01_본사_로그인", path: "/screen/14" },
  { nodeId: "110:2300", title: "02_본사_회원가입", path: "/screen/13" },
  { nodeId: "1:3969", title: "03_현장관리_체크리스트 (대시보드)", path: "/screen/01" },
  { nodeId: "1:3502", title: "대시보드 · 긴급호출 확인 모달", path: "/screen/02" },
  { nodeId: "1:3116", title: "현장관리_팀관리 (대시보드)", path: "/screen/05" },
  { nodeId: "1:4438", title: "04_현장관리_시간설정", path: "/screen/06" },
  { nodeId: "1:4792", title: "05_계정설정 (팀별 오늘 현황)", path: "/screen/11" },
  { nodeId: "1:5175", title: "06_현장관리_팀관리 사본", path: "/screen/12" },
  { nodeId: "1:5425", title: "07_현장관리_체크리스트 사본", path: "/screen/15" },
  { nodeId: "1:5615", title: "08_현장관리_시간설정 사본", path: "/screen/17" },
  { nodeId: "1:5828", title: "09_계정설정 사본", path: "/screen/20" },
  { nodeId: "1:5947", title: "10_문의하기", path: "/screen/22" },
];

export const SKIPPED_NODES: { nodeId: string; reason: string }[] = [
  { nodeId: "8:1930", reason: "Arrow1 — 캔버스 플로우 연결용 화살표 아이콘 (실제 화면 아님)" },
  { nodeId: "8:1931", reason: "Arrow2 — 캔버스 플로우 연결용 화살표 아이콘 (실제 화면 아님)" },
  { nodeId: "8:1932", reason: "Arrow3 — 캔버스 플로우 연결용 화살표 아이콘 (실제 화면 아님)" },
  { nodeId: "12:1965", reason: "Vector 1 — 9452×1482 크기의 배경 장식 벡터 (실제 화면 아님)" },
  { nodeId: "8:1934", reason: "Arrow5 — 캔버스 플로우 연결용 화살표 아이콘 (실제 화면 아님)" },
  { nodeId: "8:1933", reason: "Arrow4 — 캔버스 플로우 연결용 화살표 아이콘 (실제 화면 아님)" },
  { nodeId: "8:1935", reason: "Arrow6 — 캔버스 플로우 연결용 화살표 아이콘 (실제 화면 아님)" },
  { nodeId: "8:1936", reason: "Arrow7 — 캔버스 플로우 연결용 화살표 아이콘 (실제 화면 아님)" },
  { nodeId: "8:1937", reason: "Arrow8 — 캔버스 플로우 연결용 화살표 아이콘 (실제 화면 아님)" },
  { nodeId: "8:1938", reason: "Arrow9 — 캔버스 플로우 연결용 화살표 아이콘 (실제 화면 아님)" },
];
