import { apiFetch } from "./client";
import type { BackendRecord, Page, RecordDetail, RecordItem } from "./types";

const RECORD_TYPES: Record<BackendRecord["type"], RecordItem["type"]> = {
  THERMOMETER: "온도계",
  WORK: "작업사진",
  REST: "휴식사진",
};

export function normalizeRecord(record: BackendRecord): RecordItem {
  const measuredAt = new Date(record.measuredAt);
  const time = Number.isNaN(measuredAt.getTime())
    ? record.measuredAt
    : new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Seoul",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(measuredAt);

  return {
    id: record.recordId,
    type: RECORD_TYPES[record.type],
    place: record.workplace ?? "",
    temperature: record.temperature ?? undefined,
    humidity: record.humidity ?? undefined,
    apparentTemperature: record.apparentTemperature ?? undefined,
    time,
    photoUrl: record.photoUrls?.[0] ?? null,
    teamId: record.teamId,
    teamName: record.teamName ?? undefined,
  };
}

/** limit: 한 번에 받을 개수 (서버 기본 20, 최대 100) */
export function listRecords(params?: { date?: string; cursor?: string; limit?: number }) {
  return apiFetch<Page<BackendRecord>>("/api/v1/site/records", { params }).then((page) => ({
    ...page,
    items: page.items.map(normalizeRecord),
  }));
}

/** 모든 페이지를 이어 받는다. 요청 수를 줄이려고 한 번에 최대치(100건)씩 받는다. */
export async function listAllRecords(params?: { date?: string }) {
  const items: RecordItem[] = [];
  let cursor: string | undefined;
  let page: Page<RecordItem>["page"] = { nextCursor: null };
  do {
    const result = await listRecords({ ...params, cursor, limit: 100 });
    items.push(...result.items);
    page = result.page;
    cursor = page.nextCursor ?? undefined;
  } while (cursor);
  return { items, page };
}

export function getRecord(recordId: string) {
  return apiFetch<RecordDetail>(`/api/v1/site/records/${encodeURIComponent(recordId)}`);
}
