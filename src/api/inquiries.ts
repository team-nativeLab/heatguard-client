import { apiFetch } from "./client";
import type { CreateInquiryPayload, Inquiry, Page } from "./types";

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

export function listInquiries(params?: { status?: Inquiry["status"]; cursor?: string }) {
  return (async () => {
    const items: Inquiry[] = [];
    let cursor = params?.cursor;
    let page: Page<BackendInquiry>["page"] = { nextCursor: null };
    do {
      const result = await apiFetch<Page<BackendInquiry>>("/api/v1/site/inquiries", {
        params: { status: params?.status, cursor },
      });
      items.push(...result.items.map(normalizeInquiry));
      page = result.page;
      cursor = page.nextCursor ?? undefined;
    } while (cursor);
    return { items, page };
  })();
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
