

export interface ResourceEnvelope {
  id: string;
  version: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Page<T> {
  items: T[];
  page: { nextCursor: string | null; hasMore?: boolean };
}

export interface SiteUser {
  userId: string;
  name: string;
  email: string;
  role: "SITE_MANAGER";
  siteId?: string;
}

export interface SiteLoginResponse {
  user: SiteUser;
}

export interface SiteRegisterPayload {
  companyName: string;
  managerName: string;
  siteName: string;
  email: string;
  password: string;
}

export interface SiteRegisterResponse {
  userId: string;
  siteId: string;
  defaultTeamId: string;
  createdAt: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface SiteProfile {
  siteId: string;
  siteName: string;
  manager: { name: string; phone?: string };
}

export interface UpdateSiteProfilePayload {
  siteName?: string;
  managerPhone?: string;
}

export interface WithdrawSitePayload {
  currentPassword: string;
}

export interface WeatherInfo {
  temperature: number;
  humidity: number;
  feelsLike: number;
  apparentTemperature?: number | null;
  condition?: string;
  skyStatus?: string | null;
  heatWarningLevel?: string;
  /** 전일 같은 시각 대비 온도 변화(°C) */
  deltaFromYesterday?: number;
}

export type HeatLevel = "미입력" | "관심" | "주의보" | "경보" | "중대경보" | string;

export interface DashboardResponse {
  summary: {
    teamCount: number;
    todayRecordCount: number;
    activeEmergencyCount: number;
    /** 팀에서 올린 현장 요청 건수 (서버 미제공 시 0) */
    siteRequestCount?: number;
  };
  weather: WeatherInfo;
  heatLevel: HeatLevel;
}

export interface ManualWeather {
  temperature?: number | null;
  humidity?: number | null;
  apparentTemperature?: number | null;
  heatLevel?: string | null;
  observedAt?: string | null;
}

export type RecordType = "온도계" | "작업사진" | "휴식사진";

export interface RecordItem {
  id: string;
  type: RecordType;
  place: string;
  temperature?: number;
  humidity?: number;
  apparentTemperature?: number;
  time: string;
  photoUrl?: string | null;
  teamId?: string;
  teamName?: string;
}

export interface RecordDetail extends ResourceEnvelope {
  record: RecordItem;
}

export interface PrintSummaryResponse {
  date: string;
  site: { siteName: string; address?: string; managerName?: string };
  weather: WeatherInfo;
  records: RecordItem[];
    teamsChecklist: { teamName: string; completed: number; total: number }[];
    approvalLine: { role: string; name: string; approved: boolean }[];
}

export interface TeamSummary {
  id: string;
  leaderName: string;
  workLocation: string;
  contact: string;
  memberCount: number;
  accessUrl: string;
  qrCodeUrl?: string;
  active: boolean;
}

export interface CreateTeamPayload {
  leaderName: string;
  workLocation?: string;
  contact?: string;
  memberCount?: number;
}

export interface UpdateTeamPayload {
  leaderName?: string;
  workLocation?: string;
  contact?: string;
  memberCount?: number;
}

export interface TokenRotationResponse extends ResourceEnvelope {
  accessUrl: string;
}

export type ChecklistQuickAddKey = "식수" | "그늘막" | "건강상태" | "옥외작업자제" | "2시간휴식";

export interface ChecklistItem {
  id: string;
  text: string;
  sortOrder: number;
  active: boolean;
}

export interface CreateChecklistItemPayload {
  text?: string;
  quickAddKey?: ChecklistQuickAddKey;
}

export interface UpdateChecklistItemPayload {
  text?: string;
  sortOrder?: number;
}

export interface CheckTimesResponse {
  times: string[];
  updatedAt: string;
}

export interface CheckTimesPayload {
  times: string[];
}

export interface ManualWeatherPayload {
  temperature: number;
  humidity: number;
  observedAt: string;
}

export interface EmergencyCall {
  callId: string;
  teamId: string;
  teamName: string;
  status: "ACTIVE" | "ACKNOWLEDGED";
  createdAt: string;
}

export interface ActiveEmergencyCallsResponse {
  items: EmergencyCall[];
}

export type InquiryStatus = "OPEN" | "ANSWERED" | "CLOSED";

export interface Inquiry {
  inquiryId: string;
  title: string;
  content: string;
  status: InquiryStatus;
  reply?: string | null;
  createdAt: string;
}

export interface CreateInquiryPayload {
  title: string;
  content: string;
}

export interface TeamMember {
  id: string;
  name: string;
  teamId: string;
  teamName: string;
  active: boolean;
  withdrawnAt?: string;
}

export interface RetentionInfo {
  retentionUntil: string;
  retentionDays: number;
  canPurge: boolean;
}
