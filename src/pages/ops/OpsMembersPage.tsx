import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import OpsLayout, { OpsPageHeader } from "../../components/ops/OpsLayout";
import OpsIcon from "../../components/ops/OpsIcon";
import { CARD } from "../../components/ops/opsStyles";
import {
  BTN_DANGER, BTN_PRIMARY, BTN_SECONDARY, CenterMessage, Chip, InfoRow, OpsModal, OpsSelect, PanelSection, PillTabs, SearchBox, SidePanel, UnavailableState,
  type ChipTone,
} from "../../components/ops/OpsUi";
import { errorMessage, opsAdminApi } from "../../api";
import {
  COMPANY_STATUS_LABEL, SITE_HEALTH_LABEL,
  type CompanyCounts, type CompanyStatus, type OpsCompany, type OpsCompanyDetail, type SiteHealth,
} from "../../lib/opsAdmin";
import { formatDateTime, relativeTime } from "../../lib/opsInquiry";
import { formatCount } from "../../lib/opsDashboard";
import { downloadCsv, toCsv } from "../../lib/csv";
import { useToast } from "../../shared/ui/toastContext";

/*
 * 회원 관리 (Figma 03_회원 관리 2958:968, 03-1 회사 상세 2958:1243).
 * API: GET /api/v1/ops/companies, GET /companies/{id}, POST /companies/{id}/suspend·resume
 * 서버에 아직 없으면 "서버 준비 중"을 보여준다.
 */

type Tab = "all" | CompanyStatus;

const STATUS_TONE: Record<CompanyStatus, ChipTone> = { ACTIVE: "success", SUSPENDED: "danger", WITHDRAWN: "neutral" };
const HEALTH_TONE: Record<SiteHealth, ChipTone> = { NORMAL: "success", CAUTION: "warning", NO_INPUT: "neutral" };

const JOINED_OPTIONS = [
  { value: "all", label: "가입일 전체" },
  { value: "7", label: "최근 7일" },
  { value: "30", label: "최근 30일" },
  { value: "90", label: "최근 90일" },
];
const SORT_OPTIONS = [
  { value: "recentActivity", label: "최근 활동순" },
  { value: "joinedAt", label: "가입일순" },
  { value: "recordCount", label: "기록 많은 순" },
];

function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function CompanyDetailPanel({ companyId, onClose, onChanged }: { companyId: string; onClose: () => void; onChanged: () => void }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [detail, setDetail] = useState<OpsCompanyDetail | null>(null);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setDetail(await opsAdminApi.getCompany(companyId));
      setError("");
    } catch (err) {
      setError(errorMessage(err, "회사 정보를 불러오지 못했어요."));
    }
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const suspended = detail?.status === "SUSPENDED";

  const toggleSuspend = async () => {
    if (!detail || busy) return;
    setBusy(true);
    try {
      if (suspended) await opsAdminApi.resumeCompany(detail.companyId);
      else await opsAdminApi.suspendCompany(detail.companyId, reason.trim());
      showToast(suspended ? `${detail.name} 이용을 다시 시작했어요.` : `${detail.name} 이용을 정지했어요.`, "success");
      setConfirming(false);
      setReason("");
      await load();
      onChanged();
    } catch (err) {
      showToast(errorMessage(err, "상태를 바꾸지 못했어요."), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SidePanel
      title="회사 상세"
      onClose={onClose}
      footer={detail && (
        <>
          {detail.status !== "WITHDRAWN" && (
            <button type="button" onClick={() => (suspended ? void toggleSuspend() : setConfirming(true))} disabled={busy} className={`${suspended ? BTN_SECONDARY : BTN_DANGER} flex-1`}>
              <OpsIcon name={suspended ? "check" : "ban"} size={15} />
              {suspended ? "이용 재개" : "이용 정지"}
            </button>
          )}
          <button type="button" onClick={() => navigate(`/ops/activity?companyId=${encodeURIComponent(detail.companyId)}&companyName=${encodeURIComponent(detail.name)}`)} className={`${BTN_SECONDARY} flex-1`}>
            활동 로그
          </button>
          {detail.email && (
            <a href={`mailto:${detail.email}`} className={`${BTN_PRIMARY} flex-[1.5]`}>
              <OpsIcon name="mail" size={15} />
              담당자에게 메일
            </a>
          )}
        </>
      )}
    >
      {error ? (
        <CenterMessage tone="danger">{error}</CenterMessage>
      ) : !detail ? (
        <CenterMessage>불러오는 중...</CenterMessage>
      ) : (
        <div className="flex flex-col">
          <div className="flex items-center gap-3 pb-5">
            <span className="flex size-12 items-center justify-center rounded-xl bg-[var(--ops-chip-bg)] text-[var(--ops-body)]">
              <OpsIcon name="building" size={20} />
            </span>
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 text-lg font-bold text-[var(--ops-heading)]">
                {detail.name}
                <Chip tone={STATUS_TONE[detail.status]} dot>{COMPANY_STATUS_LABEL[detail.status]}</Chip>
              </p>
              <p className="text-xs text-[var(--ops-faint)]">
                {[detail.businessNumber, detail.joinedAt && `가입 ${formatDateTime(detail.joinedAt, false)}`, detail.planName].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pb-5">
            {[
              ["등록 현장", `${formatCount(detail.siteCount)}개`],
              ["누적 기록", `${formatCount(detail.recordCount)}건`],
              ["이번 달 접속", detail.monthlyLogins == null ? "–" : `${formatCount(detail.monthlyLogins)}회`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-[var(--ops-bg)] p-3">
                <p className="text-xs text-[var(--ops-faint)]">{label}</p>
                <p className="font-mono-num pt-1 text-lg font-bold text-[var(--ops-heading)]">{value}</p>
              </div>
            ))}
          </div>

          <PanelSection title="담당자">
            <InfoRow label="이름">{[detail.managerName, detail.managerTeam && `(${detail.managerTeam})`].filter(Boolean).join(" ")}</InfoRow>
            <InfoRow label="연락처">{detail.managerPhone}</InfoRow>
            <InfoRow label="이메일">{detail.email}</InfoRow>
          </PanelSection>

          <PanelSection title="현장">
            {detail.sites.length === 0 ? (
              <p className="py-2 text-[13px] text-[var(--ops-faint)]">등록된 현장이 없어요.</p>
            ) : (
              <ul className="divide-y divide-[var(--ops-divider)]">
                {detail.sites.map((site) => (
                  <li key={site.siteId} className="flex items-center gap-2 py-2.5 text-[13px]">
                    <OpsIcon name="mapPin" className="text-[var(--ops-faint)]" />
                    <span className="min-w-0 flex-1 truncate font-medium text-[var(--ops-heading)]">{site.name}</span>
                    <span className="text-xs text-[var(--ops-faint)]">기록 {formatCount(site.recordCount)}건</span>
                    <Chip tone={HEALTH_TONE[site.health]}>{SITE_HEALTH_LABEL[site.health]}</Chip>
                  </li>
                ))}
              </ul>
            )}
          </PanelSection>

          <PanelSection title="최근 활동">
            {detail.recentActivities.length === 0 ? (
              <p className="py-2 text-[13px] text-[var(--ops-faint)]">최근 활동이 없어요.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {detail.recentActivities.map((a, i) => (
                  <li key={i} className="flex items-center gap-2 text-[13px]">
                    <span className={`size-1.5 rounded-full ${i === 0 ? "bg-[var(--ops-accent)]" : "bg-[var(--ops-border)]"}`} aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-[var(--ops-heading)]">{a.message}</span>
                    <span className="text-xs text-[var(--ops-faint)]">{relativeTime(a.at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </PanelSection>
        </div>
      )}

      {confirming && detail && (
        <OpsModal
          title="이용을 정지할까요?"
          description={`${detail.name}의 관리자와 작업자가 더 이상 로그인할 수 없어요. 기록은 보존돼요.`}
          onClose={() => setConfirming(false)}
          footer={
            <>
              <button type="button" onClick={() => setConfirming(false)} className={BTN_SECONDARY}>취소</button>
              <button type="button" onClick={() => void toggleSuspend()} disabled={busy || !reason.trim()} className="inline-flex h-9 items-center rounded-lg bg-[var(--color-danger-text)] px-4 text-[13px] font-medium text-white disabled:opacity-60">
                {busy ? "정지하는 중..." : "정지하기"}
              </button>
            </>
          }
        >
          <label className="flex flex-col gap-1.5 text-[13px] font-medium text-[var(--ops-heading)]">
            정지 사유
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, 300))}
              rows={3}
              placeholder="예: 이용료 미납"
              className="rounded-lg border border-[var(--ops-border)] bg-[var(--ops-surface)] p-3 text-[13px] font-normal outline-none focus:border-[var(--ops-accent)]"
            />
          </label>
        </OpsModal>
      )}
    </SidePanel>
  );
}

export default function OpsMembersPage() {
  const { showToast } = useToast();
  const [params] = useSearchParams();
  const [tab, setTab] = useState<Tab>("all");
  // 상단 검색창에서 넘어온 검색어(?q=)로 시작한다.
  const [keyword, setKeyword] = useState(() => params.get("q") ?? "");
  const urlQ = params.get("q") ?? "";
  useEffect(() => {
    setKeyword(urlQ);
  }, [urlQ]);
  const [joined, setJoined] = useState("all");
  const [sort, setSort] = useState("recentActivity");
  const q = useDebounced(keyword.trim());

  const [items, setItems] = useState<OpsCompany[] | null>(null);
  const [counts, setCounts] = useState<CompanyCounts | null>(null);
  const [cursor, setCursor] = useState<string | undefined>();
  const [unavailable, setUnavailable] = useState(false);
  const [error, setError] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const seq = useRef(0);

  const load = useCallback(async (more?: string) => {
    const id = ++seq.current;
    if (more) setLoadingMore(true);
    try {
      const res = await opsAdminApi.listCompanies({
        status: tab === "all" ? undefined : tab,
        q: q || undefined,
        joined: joined === "all" ? undefined : joined,
        sort,
        cursor: more,
      });
      if (id !== seq.current) return;
      if (res === null) {
        setUnavailable(true);
        return;
      }
      setItems((prev) => (more && prev ? [...prev, ...res.items] : res.items));
      setCounts(res.counts);
      setCursor(res.page.nextCursor);
      setError("");
    } catch (err) {
      if (id === seq.current) setError(errorMessage(err, "회원 목록을 불러오지 못했어요."));
    } finally {
      if (id === seq.current) setLoadingMore(false);
    }
  }, [tab, q, joined, sort]);

  useEffect(() => {
    setItems(null);
    void load();
  }, [load]);

  const [exporting, setExporting] = useState(false);
  // 화면에 불러온 쪽만이 아니라 현재 조건의 목록 전체를 내보낸다 (최대 50쪽).
  const exportCsv = async () => {
    if (!items?.length || exporting) return;
    setExporting(true);
    const all = [...items];
    try {
      let next = cursor;
      for (let page = 0; next && page < 50; page += 1) {
        const res = await opsAdminApi.listCompanies({ status: tab === "all" ? undefined : tab, q: q || undefined, joined: joined === "all" ? undefined : joined, sort, cursor: next });
        if (!res) break;
        all.push(...res.items);
        next = res.page.nextCursor;
      }
    } catch (err) {
      showToast(errorMessage(err, "전체 목록을 불러오지 못해 불러온 만큼만 내보냈어요."), "error");
    } finally {
      setExporting(false);
    }
    const csv = toCsv(
      ["회사명", "사업자번호", "담당자", "이메일", "가입일", "현장 수", "기록 수", "최근 활동", "상태"],
      all.map((c) => [c.name, c.businessNumber, c.managerName, c.email, formatDateTime(c.joinedAt, false), c.siteCount, c.recordCount, formatDateTime(c.lastActivityAt), COMPANY_STATUS_LABEL[c.status]]),
    );
    downloadCsv(`회원목록_${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "all", label: "전체", count: counts?.all },
    { key: "ACTIVE", label: "이용 중", count: counts?.active },
    { key: "SUSPENDED", label: "정지", count: counts?.suspended },
    { key: "WITHDRAWN", label: "탈퇴", count: counts?.withdrawn },
  ];

  return (
    <OpsLayout>
      <div className="flex w-full flex-col gap-4 px-4 pb-8 md:px-8">
        <div className="mb-2">
          <OpsPageHeader
            crumb="회원 › 회원 관리"
            title="회원 관리"
            description="가입한 회사와 이용 상태를 관리해요."
            actions={!unavailable && (
              <button type="button" onClick={() => void exportCsv()} disabled={!items?.length || exporting} className={BTN_SECONDARY}>
                <OpsIcon name="download" size={15} />
                {exporting ? "내보내는 중..." : "내보내기"}
              </button>
            )}
          />
        </div>

        {unavailable ? (
          <UnavailableState feature="회원 관리" />
        ) : (
          <>
            <PillTabs label="회원 상태" tabs={tabs} value={tab} onChange={setTab} />
            <div className="flex flex-wrap items-center gap-2">
              <SearchBox value={keyword} onChange={setKeyword} placeholder="회사명, 담당자, 이메일, 사업자번호" label="회원 검색" />
              <OpsSelect label="가입일" icon="calendar" value={joined} onChange={setJoined} options={JOINED_OPTIONS} />
              <span className="flex-1" />
              <OpsSelect label="정렬" icon="sort" value={sort} onChange={setSort} options={SORT_OPTIONS} />
            </div>

            <section aria-label="회원 목록" className={`${CARD} flex min-h-[320px] flex-col overflow-hidden`}>
              {error && !items ? (
                <CenterMessage tone="danger">{error}</CenterMessage>
              ) : !items ? (
                <CenterMessage>불러오는 중...</CenterMessage>
              ) : items.length === 0 ? (
                <CenterMessage>조건에 맞는 회사가 없어요.</CenterMessage>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[960px] text-[13px]">
                    <thead className="bg-[var(--ops-bg)] text-xs text-[var(--ops-faint)]">
                      <tr>
                        {["회사명", "담당자", "이메일", "가입일", "현장 수", "기록 수", "최근 활동", "상태", ""].map((h, i) => (
                          <th key={i} scope="col" className={`px-4 py-2.5 font-medium ${i >= 4 && i <= 5 ? "text-center" : "text-left"}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--ops-divider)]">
                      {items.map((c) => (
                        <tr key={c.companyId} onClick={() => setSelectedId(c.companyId)} className={`cursor-pointer transition-colors hover:bg-[var(--ops-bg)] ${c.status === "WITHDRAWN" ? "opacity-60" : ""}`}>
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-3">
                              <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--ops-chip-bg)] text-[var(--ops-body)]"><OpsIcon name="building" /></span>
                              <span className="flex min-w-0 flex-col">
                                <span className="truncate text-sm font-bold text-[var(--ops-heading)]">{c.name}</span>
                                <span className="text-xs text-[var(--ops-faint)]">{c.businessNumber}</span>
                              </span>
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-[var(--ops-heading)]">{c.managerName ?? "–"}</td>
                          <td className="px-4 py-3 text-[var(--ops-body)]">{c.email ?? "–"}</td>
                          <td className="px-4 py-3 text-[var(--ops-body)]">{formatDateTime(c.joinedAt, false) || "–"}</td>
                          <td className="font-mono-num px-4 py-3 text-center font-medium text-[var(--ops-heading)]">{c.siteCount}개</td>
                          <td className="font-mono-num px-4 py-3 text-center font-medium text-[var(--ops-heading)]">{formatCount(c.recordCount)}</td>
                          <td className="px-4 py-3 text-[var(--ops-body)]">{relativeTime(c.lastActivityAt) || "–"}</td>
                          <td className="px-4 py-3"><Chip tone={STATUS_TONE[c.status]} dot>{COMPANY_STATUS_LABEL[c.status]}</Chip></td>
                          <td className="px-4 py-3 text-right">
                            <button type="button" aria-label={`${c.name} 상세`} onClick={(e) => { e.stopPropagation(); setSelectedId(c.companyId); }} className="inline-flex size-8 items-center justify-center rounded-lg bg-[var(--ops-chip-bg)] text-[var(--ops-body)]">
                              <OpsIcon name="more" size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {items && items.length > 0 && (
              <div className="flex items-center justify-between text-xs text-[var(--ops-faint)]">
                {/* counts는 검색·가입일 필터와 무관한 수라, 필터 중에는 불러온 수만 보여준다 */}
                <span>{counts && !q && joined === "all" ? `총 ${formatCount(tab === "all" ? counts.all : counts[tab === "ACTIVE" ? "active" : tab === "SUSPENDED" ? "suspended" : "withdrawn"])}개 중 1–${items.length}` : `${items.length}개${cursor ? " 이상" : ""}`}</span>
                {cursor && (
                  <button type="button" onClick={() => void load(cursor)} disabled={loadingMore} className={BTN_SECONDARY}>
                    {loadingMore ? "불러오는 중..." : "더 보기"}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {selectedId && <CompanyDetailPanel companyId={selectedId} onClose={() => setSelectedId(null)} onChanged={() => void load()} />}
    </OpsLayout>
  );
}
