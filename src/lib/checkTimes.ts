/** 체크 시간 설정 화면의 칸: 01:00 ~ 24:00 (한 시간 간격) */
export const CHECK_TIME_SLOTS = Array.from({ length: 24 }, (_, index) => `${String(index + 1).padStart(2, "0")}:00`);

/**
 * 서버에서 받은 체크 시간을 화면 칸에 맞춘다.
 * 서버는 24:00을 00:00으로 저장하므로(00:00~23:59), 00:00은 24:00 칸으로 보여준다.
 */
export function toCheckTimeSlots(times: string[]): Record<string, boolean> {
  return Object.fromEntries(times.map((time) => [time === "00:00" ? "24:00" : time, true]));
}
