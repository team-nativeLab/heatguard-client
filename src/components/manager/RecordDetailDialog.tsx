import { useState } from "react";
import ModalShell, { btnPrimary, btnSecondary } from "../home/ModalShell";
import { useToast } from "../../shared/ui/toastContext";

type MetricValue = string | number | null | undefined;

function formatMetric(value: MetricValue, suffix: string) {
  if (value == null || value === "") return "미입력";
  if (typeof value === "string") return value === "-" ? "미입력" : value;
  return `${value}${suffix}`;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[var(--color-bg-tile)] px-3 py-2.5">
      <dt className="text-xs text-[var(--color-text-body)]">{label}</dt>
      <dd className="pt-1 text-sm font-medium text-[var(--color-text-heading)]">{value}</dd>
    </div>
  );
}

export default function RecordDetailDialog({
  type,
  place,
  takenAt,
  siteName,
  temperature,
  humidity,
  apparentTemperature,
  photoUrl,
  onClose,
}: {
  type: string;
  place: string;
  takenAt: string;
  siteName: string;
  temperature: MetricValue;
  humidity: MetricValue;
  apparentTemperature: MetricValue;
  photoUrl?: string | null;
  onClose: () => void;
}) {
  const { showToast } = useToast();
  const [broken, setBroken] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const hasPhoto = Boolean(photoUrl) && !broken;

  const downloadPhoto = async () => {
    if (!photoUrl || downloading) return;
    setDownloading(true);
    try {
      const response = await fetch(photoUrl, { credentials: "include" });
      if (!response.ok) throw new Error(String(response.status));
      const objectUrl = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `heatguard_${takenAt.replace(/[^0-9]/g, "") || "record"}.jpg`;
      anchor.click();
      URL.revokeObjectURL(objectUrl);
      showToast("사진을 저장했어요.", "success");
    } catch {
      window.open(photoUrl, "_blank", "noopener,noreferrer");
      showToast("사진을 새 탭에서 열었어요.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <ModalShell
      title="기록 상세"
      onClose={onClose}
      maxWidth={560}
      footer={
        <>
          <button type="button" onClick={onClose} className={btnSecondary}>닫기</button>
          {photoUrl && (
            <button type="button" onClick={downloadPhoto} disabled={!hasPhoto || downloading} className={btnPrimary}>
              {downloading ? "저장 중..." : "사진 다운로드"}
            </button>
          )}
        </>
      }
    >
      <p className="text-xs text-[var(--color-text-body)]">{takenAt}</p>
      <div className="flex h-[240px] w-full items-center justify-center overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-app)]">
        {hasPhoto ? (
          <img src={photoUrl!} alt={`${siteName} ${place} 기록 사진`} className="size-full object-contain" onError={() => setBroken(true)} />
        ) : (
          <p className="px-4 text-center text-sm text-[var(--color-text-faint)]">
            {broken ? "사진을 불러오지 못했어요." : "이 기록에는 표시할 사진이 없어요."}
          </p>
        )}
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-body)]">{siteName}</p>
        <h3 className="pt-1 text-sm font-semibold text-[var(--color-text-heading)]">{type} · {place || "장소 미입력"}</h3>
      </div>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Metric label="온도" value={formatMetric(temperature, "°")} />
        <Metric label="습도" value={formatMetric(humidity, "%")} />
        <Metric label="체감온도" value={formatMetric(apparentTemperature, "°C")} />
      </dl>
    </ModalShell>
  );
}

