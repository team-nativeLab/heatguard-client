

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
  version: number;
}

export interface UpdateSiteProfilePayload {
  siteName?: string;
  managerPhone?: string;
  version: number;
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
    teamCount?: number;
    todayRecordCount: number;
    activeEmergencyCount: number;
    workPhotoCount?: number;
    restPhotoCount?: number;
    /** 팀에서 올린 현장 요청 건수 (서버 미제공 시 0) */
    siteRequestCount?: number;
  };
  weather: (Partial<WeatherInfo> & Pick<WeatherInfo, "temperature" | "humidity">) | null;
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
  teamId?: string | null;
  teamName?: string;
}

export interface BackendRecord {
  recordId: string;
  type: "THERMOMETER" | "WORK" | "REST";
  measuredAt: string;
  temperature?: number | null;
  humidity?: number | null;
  apparentTemperature?: number | null;
  photoUrls?: string[];
  photoKeys?: string[];
  teamId?: string | null;
  teamName?: string | null;
  workplace?: string | null;
}

export interface RecordDetail extends BackendRecord {
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface PrintSummaryResponse {
  date: string;
  site: { siteName: string; address?: string; managerName?: string };
  weather: {
    temperature: number | null;
    humidity: number | null;
    feelsLike: number | null;
    heatWarningLevel?: string;
  } | null;
  records: RecordItem[];
  teamsChecklist: { teamName: string; completed: number; total: number }[];
  approvalLine: { role: string; name: string; approved: boolean }[];
}

export interface TeamSummary {
  id: string;
  name: string;
  leaderName: string;
  workLocation: string;
  contact: string;
  memberCount: number;
  active: boolean;
  version: number;
  loginEmail?: string | null;
  memberUserId?: string | null;
}

export interface CreateTeamPayload {
  name: string;
  workplace: string;
  leaderName: string;
  leaderPhone: string;
  leaderEmail: string;
  initialPassword: string;
  workerCount: number;
}

export interface UpdateTeamPayload {
  name?: string;
  workplace?: string;
  leaderName?: string;
  leaderPhone?: string;
  workerCount?: number;
  version?: number;
}

export interface TeamCredentialsPayload {
  leaderEmail?: string;
  newPassword: string;
}

export interface TeamCredentialsResponse {
  teamId: string;
  userId: string;
  loginEmail: string;
  passwordChangedAt: string;
}

export type ChecklistQuickAddKey = "식수" | "그늘막" | "건강상태" | "옥외작업자제" | "2시간휴식";

export interface ChecklistItem {
  id: string;
  text: string;
  sortOrder: number;
  active: boolean;
  version?: number;
}

export interface CreateChecklistItemPayload {
  text: string;
  sortOrder: number;
}

export interface UpdateChecklistItemPayload {
  text?: string;
  sortOrder?: number;
}

export interface CheckTimesResponse {
  times: string[];
  updatedAt: string | null;
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
  teamId?: string | null;
  teamName?: string | null;
  active: boolean;
  withdrawnAt?: string;
}

export interface RetentionInfo {
  retentionUntil: string;
  retentionDays: number;
  canPurge: boolean;
}
