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

export function listRecords(params?: { date?: string; cursor?: string }) {
  return apiFetch<Page<BackendRecord>>("/api/v1/site/records", { params }).then((page) => ({
    ...page,
    items: page.items.map(normalizeRecord),
  }));
}

export async function listAllRecords(params?: { date?: string }) {
  const items: RecordItem[] = [];
  let cursor: string | undefined;
  let page: Page<RecordItem>["page"] = { nextCursor: null };
  do {
    const result = await listRecords({ ...params, cursor });
    items.push(...result.items);
    page = result.page;
    cursor = page.nextCursor ?? undefined;
  } while (cursor);
  return { items, page };
}

export function getRecord(recordId: string) {
  return apiFetch<RecordDetail>(`/api/v1/site/records/${encodeURIComponent(recordId)}`);
}
