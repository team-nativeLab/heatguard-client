import { apiFetch } from "./client";
import type { CreateInquiryPayload, Inquiry, Page } from "./types";

export function listInquiries(params?: { status?: Inquiry["status"]; cursor?: string }) {
  return apiFetch<Page<Inquiry>>("/api/v1/site/inquiries", { params });
}

export function createInquiry(payload: CreateInquiryPayload) {
  return apiFetch<Inquiry>("/api/v1/site/inquiries", { method: "POST", body: payload });
}

export function getInquiry(inquiryId: string) {
  return apiFetch<Inquiry>(`/api/v1/site/inquiries/${inquiryId}`);
}
