import { apiFetch } from "./client";
import type { CreateInquiryPayload, Inquiry, InquiryStatus, Page } from "./types";

interface BackendInquiry extends Omit<Inquiry, "reply"> {
  replies?: { content?: string }[];
  reply?: string | null;
}

function normalizeInquiry(inquiry: BackendInquiry): Inquiry {
  return {
    inquiryId: inquiry.inquiryId,
    title: inquiry.title,
    content: inquiry.content,
    status: inquiry.status,
    reply: inquiry.reply ?? inquiry.replies?.at(-1)?.content ?? null,
    createdAt: inquiry.createdAt,
  };
}

async function listFrom(path: string, params?: { status?: InquiryStatus; cursor?: string }) {
  const items: Inquiry[] = [];
  let cursor = params?.cursor;
  let page: Page<BackendInquiry>["page"] = { nextCursor: null };
  do {
    const result = await apiFetch<Page<BackendInquiry>>(path, {
      params: { status: params?.status, cursor },
    });
    items.push(...result.items.map(normalizeInquiry));
    page = result.page;
    cursor = page.nextCursor ?? undefined;
  } while (cursor);
  return { items, page };
}

export function listInquiries(params?: { status?: InquiryStatus; cursor?: string }) {
  return listFrom("/api/v1/site/inquiries", params);
}

export function createInquiry(payload: CreateInquiryPayload) {
  return apiFetch<Pick<Inquiry, "inquiryId" | "status" | "createdAt">>(
    "/api/v1/site/inquiries",
    { method: "POST", body: payload },
  ).then((created): Inquiry => ({
    ...payload,
    ...created,
    reply: null,
  }));
}

export function getInquiry(inquiryId: string) {
  return apiFetch<BackendInquiry>(`/api/v1/site/inquiries/${encodeURIComponent(inquiryId)}`).then(normalizeInquiry);
}

/** 본사 관리자가 확인하는 현장관리자 문의 목록 */
export function listHqInquiries(params?: { status?: InquiryStatus; cursor?: string }) {
  return listFrom("/api/v1/hq/inquiries", params);
}

export function getHqInquiry(inquiryId: string) {
  return apiFetch<BackendInquiry>(`/api/v1/hq/inquiries/${encodeURIComponent(inquiryId)}`).then(normalizeInquiry);
}

export function replyToHqInquiry(inquiryId: string, content: string) {
  return apiFetch<unknown>(`/api/v1/hq/inquiries/${encodeURIComponent(inquiryId)}/replies`, {
    method: "POST",
    body: { content },
  });
}

export function updateHqInquiryStatus(inquiryId: string, status: InquiryStatus) {
  return apiFetch<unknown>(`/api/v1/hq/inquiries/${encodeURIComponent(inquiryId)}/status`, {
    method: "PATCH",
    body: { status },
  });
}
