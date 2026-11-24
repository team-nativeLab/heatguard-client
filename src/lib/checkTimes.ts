/** 체크 시간 설정 화면의 칸: 01:00 ~ 24:00 (한 시간 간격) */
export const CHECK_TIME_SLOTS = Array.from({ length: 24 }, (_, index) => `${String(index + 1).padStart(2, "0")}:00`);

/**
 * 서버에서 받은 체크 시간을 화면 칸에 맞춘다.
 * 서버는 24:00을 00:00으로 저장하므로(00:00~23:59), 00:00은 24:00 칸으로 보여준다.
 */
export function toCheckTimeSlots(times: string[]): Record<string, boolean> {
  return Object.fromEntries(
    times.map((time) => (time === "00:00" ? "24:00" : time)).filter((time) => CHECK_TIME_SLOTS.includes(time)).map((time) => [time, true]),
  );
}

/**
 * 화면 칸에 없는 시간(정각이 아닌 09:30 등). 앱 등 다른 경로로 저장됐을 수 있어
 * 이 화면에서 저장할 때 지우지 않고 그대로 함께 보낸다.
 */
export function otherCheckTimes(times: string[]): string[] {
  return times.filter((time) => time !== "00:00" && !CHECK_TIME_SLOTS.includes(time));
}
