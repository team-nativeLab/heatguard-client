import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { printApi, isDemoFallback, errorMessage, type PrintSummaryResponse } from "../api";
import { feelsLikeColorClass } from "../lib/records";

const pad = (n: number) => String(n).padStart(2, "0");
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

function buildFallback(date: string): PrintSummaryResponse {
  return {
    date,
    site: { siteName: "인천 복합물류센터 신축", address: "인천광역시 서구 원창동", managerName: "김철수" },
    weather: { temperature: 36.2, humidity: 65, feelsLike: 36.2, heatWarningLevel: "폭염 경보" },
    records: [
      { id: "r1", type: "온도계", place: "3층 외벽", temperature: 36, humidity: 65, apparentTemperature: 36.2, time: "09:02" },
      { id: "r2", type: "작업사진", place: "지하 배관", temperature: 34, humidity: 72, apparentTemperature: 34.5, time: "10:30" },
      { id: "r3", type: "휴식사진", place: "옥상 그늘막", temperature: 38, humidity: 80, apparentTemperature: 38.7, time: "12:05" },
      { id: "r4", type: "온도계", place: "3층 외벽", temperature: 35, humidity: 60, apparentTemperature: 35.1, time: "14:00" },
    ],
    teamsChecklist: [
      { teamName: "A팀", completed: 4, total: 6 },
      { teamName: "B팀", completed: 4, total: 6 },
      { teamName: "C팀 (하청)", completed: 4, total: 6 },
    ],
    approvalLine: [
      { role: "담당", name: "", approved: false },
      { role: "검토", name: "", approved: false },
      { role: "승인", name: "", approved: false },
    ],
  };
}

export default function PrintSummaryPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const date = params.get("date") || todayStr();

  // 새 탭으로 열린 경우 탭을 닫고, 직접 들어온 경우엔 대시보드로 돌아간다.
  const closePreview = () => {
    window.close();
    window.setTimeout(() => navigate("/manager"), 150);
  };

  const [data, setData] = useState<PrintSummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    let alive = true;
    setData(null);
    setError(null);
    printApi
      .getPrintSummary(date)
      .then((res) => {
        if (alive) setData(res);
      })
      .catch((err) => {
        if (!alive) return;
        if (isDemoFallback(err)) {

          setData(buildFallback(date));
          setIsDemo(true);
          return;
        }
        setError(errorMessage(err, "인쇄 데이터를 불러오지 못했어요."));
      });
    return () => {
      alive = false;
    };
  }, [date]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[var(--color-bg-app)] text-[var(--color-text-heading)] p-8">
        <p className="text-sm">{error}</p>
        <button
          type="button"
          onClick={closePreview}
          className="print:hidden border border-[var(--color-border)] text-[var(--color-text-label)] rounded px-4 py-1.5 text-sm hover:bg-[var(--color-bg-tile)]"
        >
          닫기
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-app)] text-[var(--color-text-body)] text-sm">
        불러오는 중...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-app)] text-[var(--color-text-heading)]">
      <div className="print:hidden sticky top-0 z-10 bg-[var(--color-bg-surface)] border-b border-[var(--color-border)] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm text-[var(--color-text-label)]">{date} 기록 인쇄 미리보기</p>
          {isDemo && (
            <span className="text-[11px] px-2 py-0.5 rounded bg-[var(--color-heat-badge-bg)] text-[#f59e0b]">
              백엔드 미연결 — 데모 데이터
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="bg-[var(--color-accent)] text-white text-sm px-4 py-1.5 rounded hover:brightness-110 transition"
          >
            인쇄하기
          </button>
          <button
            type="button"
            onClick={closePreview}
            className="border border-[var(--color-border)] text-[var(--color-text-label)] text-sm px-4 py-1.5 rounded hover:bg-[var(--color-bg-tile)] transition"
          >
            닫기
          </button>
        </div>
      </div>

      <div className="max-w-[820px] mx-auto p-8 print:p-0">
        <div className="flex items-start justify-between border-b-2 border-[var(--color-text-heading)] pb-4">
          <div>
            <h1 className="text-xl font-bold">현장 온열질환 예방 기록</h1>
            <p className="text-sm text-[var(--color-text-label)] pt-1">{data.site.siteName}</p>
            {data.site.address && <p className="text-xs text-[var(--color-text-body)]">{data.site.address}</p>}
          </div>
          <p className="font-['JetBrains_Mono',monospace] text-sm text-[var(--color-text-label)]">{data.date}</p>
        </div>

        <div className="grid grid-cols-4 gap-4 py-5 border-b border-[var(--color-border)]">
          {[
            ["현재 온도", data.weather?.temperature != null ? `${data.weather.temperature.toFixed(1)}°C` : "-"],
            ["습도", data.weather?.humidity != null ? `${data.weather.humidity}%` : "-"],
            ["체감온도", data.weather?.feelsLike != null ? `${data.weather.feelsLike.toFixed(1)}°C` : "-"],
            ["폭염 단계", data.weather?.heatWarningLevel || "-"],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-[11px] text-[var(--color-text-body)]">{label}</p>
              <p className="text-sm font-medium pt-0.5">{value}</p>
            </div>
          ))}
        </div>

        <div className="pt-6">
          <h2 className="text-sm font-semibold">작업 기록</h2>
          <table className="w-full mt-2 border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--color-text-faint)] text-left text-[var(--color-text-body)]">
                <th className="py-1.5 font-medium">유형</th>
                <th className="py-1.5 font-medium">장소</th>
                <th className="py-1.5 font-medium">온도</th>
                <th className="py-1.5 font-medium">습도</th>
                <th className="py-1.5 font-medium">체감온도</th>
                <th className="py-1.5 font-medium">시간</th>
              </tr>
            </thead>
            <tbody>
              {data.records.map((r) => (
                <tr key={r.id} className="border-b border-[var(--color-border)]">
                  <td className="py-1.5">{r.type}</td>
                  <td className="py-1.5">{r.place}</td>
                  <td className="py-1.5">{r.temperature}°</td>
                  <td className="py-1.5">{r.humidity}%</td>
                  <td className={`py-1.5 font-medium ${feelsLikeColorClass(r.apparentTemperature ?? 0)}`}>{(r.apparentTemperature ?? 0).toFixed(1)}°C</td>
                  <td className="py-1.5">{r.time}</td>
                </tr>
              ))}
              {data.records.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-[var(--color-text-faint)]">
                    해당 날짜의 기록이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pt-6">
          <h2 className="text-sm font-semibold">팀별 온열질환 예방 체크리스트</h2>
          <table className="w-full mt-2 border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--color-text-faint)] text-left text-[var(--color-text-body)]">
                <th className="py-1.5 font-medium">팀</th>
                <th className="py-1.5 font-medium">완료</th>
              </tr>
            </thead>
            <tbody>
              {data.teamsChecklist.map((t) => (
                <tr key={t.teamName} className="border-b border-[var(--color-border)]">
                  <td className="py-1.5">{t.teamName}</td>
                  <td className="py-1.5">
                    {t.completed}/{t.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-8">
          <h2 className="text-sm font-semibold pb-2">결재</h2>
          {data.approvalLine.length ? (
            <table className="border-collapse text-xs w-full max-w-[360px] ml-auto">
              <tbody>
                <tr>
                  {data.approvalLine.map((row) => (
                    <td key={row.role} className="border border-[var(--color-text-faint)] text-center text-[var(--color-text-body)] py-1 w-1/3">
                      {row.role}
                    </td>
                  ))}
                </tr>
                <tr>
                  {data.approvalLine.map((row) => (
                    <td key={row.role} className="border border-[var(--color-text-faint)] text-center h-14 align-bottom pb-1.5">
                      {row.name || "\u00A0"}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          ) : (
            <p className="text-xs text-[var(--color-text-faint)] text-right">결재선 정보가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}
