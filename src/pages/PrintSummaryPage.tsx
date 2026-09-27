import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { printApi, isNetworkError, ApiError, type PrintSummaryResponse } from "../api";
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
    weather: { temperature: 36.2, humidity: 65, feelsLike: 36.2, condition: "맑음", heatWarningLevel: "폭염 경보" },
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
  const date = params.get("date") || todayStr();

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
        if (isNetworkError(err)) {

          setData(buildFallback(date));
          setIsDemo(true);
          return;
        }
        setError(err instanceof ApiError ? err.message : "인쇄 데이터를 불러오지 못했어요.");
      });
    return () => {
      alive = false;
    };
  }, [date]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-white text-gray-900 p-8">
        <p className="text-sm">{error}</p>
        <button
          type="button"
          onClick={() => window.close()}
          className="print:hidden border border-gray-300 rounded px-4 py-1.5 text-sm hover:bg-gray-50"
        >
          닫기
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-gray-500 text-sm">
        불러오는 중...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {}
      <div className="print:hidden sticky top-0 z-10 bg-gray-50 border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-600">{date} 기록 인쇄 미리보기</p>
          {isDemo && (
            <span className="text-[11px] px-2 py-0.5 rounded bg-amber-100 text-amber-700">
              백엔드 미연결 — 데모 데이터
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded hover:brightness-110 transition"
          >
            인쇄하기
          </button>
          <button
            type="button"
            onClick={() => window.close()}
            className="border border-gray-300 text-sm px-4 py-1.5 rounded hover:bg-gray-100 transition"
          >
            닫기
          </button>
        </div>
      </div>

      {}
      <div className="max-w-[820px] mx-auto p-8 print:p-0">
        <div className="flex items-start justify-between border-b-2 border-gray-900 pb-4">
          <div>
            <h1 className="text-xl font-bold">현장 온열질환 예방 기록</h1>
            <p className="text-sm text-gray-600 pt-1">{data.site.siteName}</p>
            {data.site.address && <p className="text-xs text-gray-500">{data.site.address}</p>}
          </div>
          <p className="font-['JetBrains_Mono',monospace] text-sm text-gray-700">{data.date}</p>
        </div>

        {}
        <div className="grid grid-cols-4 gap-4 py-5 border-b border-gray-200">
          {[
            ["현재 온도", `${data.weather.temperature.toFixed(1)}°C`],
            ["습도", `${data.weather.humidity}%`],
            ["체감온도", `${data.weather.feelsLike.toFixed(1)}°C`],
            ["폭염 단계", data.weather.heatWarningLevel || "-"],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-[11px] text-gray-500">{label}</p>
              <p className="text-sm font-medium pt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {}
        <div className="pt-6">
          <h2 className="text-sm font-semibold">작업 기록</h2>
          <table className="w-full mt-2 border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-400 text-left text-gray-500">
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
                <tr key={r.id} className="border-b border-gray-200">
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
                  <td colSpan={6} className="py-4 text-center text-gray-400">
                    해당 날짜의 기록이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {}
        <div className="pt-6">
          <h2 className="text-sm font-semibold">팀별 온열질환 예방 체크리스트</h2>
          <table className="w-full mt-2 border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-400 text-left text-gray-500">
                <th className="py-1.5 font-medium">팀</th>
                <th className="py-1.5 font-medium">완료</th>
              </tr>
            </thead>
            <tbody>
              {data.teamsChecklist.map((t) => (
                <tr key={t.teamName} className="border-b border-gray-200">
                  <td className="py-1.5">{t.teamName}</td>
                  <td className="py-1.5">
                    {t.completed}/{t.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {}
        <div className="pt-8">
          <h2 className="text-sm font-semibold pb-2">결재</h2>
          <table className="border-collapse text-xs w-full max-w-[360px] ml-auto">
            <tbody>
              <tr>
                {data.approvalLine.map((row) => (
                  <td key={row.role} className="border border-gray-400 text-center text-gray-500 py-1 w-1/3">
                    {row.role}
                  </td>
                ))}
              </tr>
              <tr>
                {data.approvalLine.map((row) => (
                  <td key={row.role} className="border border-gray-400 text-center h-14 align-bottom pb-1.5">
                    {row.name || "\u00A0"}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
