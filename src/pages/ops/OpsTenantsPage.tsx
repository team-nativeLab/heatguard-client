import { useEffect, useMemo, useState } from "react";
import OpsLayout from "../../components/ops/OpsLayout";
import { errorMessage, opsApi, type OpsTenant } from "../../api";

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(date);
}

export default function OpsTenantsPage() {
  const [items, setItems] = useState<OpsTenant[] | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const result = await opsApi.listTenants();
      setItems(result.items);
      setTruncated(result.truncated);
      setError("");
    } catch (err) {
      setError(errorMessage(err, "본사 목록을 불러오지 못했어요."));
    }
  };

  useEffect(() => { void load(); }, []);
  const sorted = useMemo(
    () => [...(items ?? [])].sort((a, b) => a.name.localeCompare(b.name, "ko")),
    [items],
  );

  return (
    <OpsLayout>
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 p-4 md:p-8">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-xs text-[var(--color-text-faint)]">운영</p>
            <h1 className="text-2xl font-semibold text-[var(--color-text-heading)]">본사 목록</h1>
            <p className="text-sm text-[var(--color-text-body)]">운영 중인 본사 정보를 확인합니다.</p>
          </div>
          {items && <span className="text-sm text-[var(--color-text-faint)]">총 {items.length}{truncated ? "+" : ""}곳</span>}
        </header>

        {error ? (
          <section className="flex flex-col items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-10">
            <p role="alert" className="text-sm text-[var(--color-danger-text)]">{error}</p>
            <button type="button" onClick={() => void load()} className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm">다시 시도</button>
          </section>
        ) : !items ? (
          <p role="status" className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8 text-center text-sm text-[var(--color-text-faint)]">불러오는 중...</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)]">
            {truncated && <p className="border-b border-[var(--color-border)] px-5 py-3 text-xs text-[var(--color-text-faint)]">목록이 많아 일부만 표시하고 있어요.</p>}
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-[var(--color-border)] text-xs text-[var(--color-text-faint)]">
                <tr><th className="px-5 py-3 font-medium">본사명</th><th className="px-5 py-3 font-medium">상태</th><th className="px-5 py-3 font-medium">등록일</th></tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {sorted.map((tenant) => (
                  <tr key={tenant.tenantId || tenant.name}>
                    <td className="px-5 py-4 font-medium text-[var(--color-text-heading)]">{tenant.name}</td>
                    <td className="px-5 py-4 text-[var(--color-text-body)]">{tenant.status ?? "—"}</td>
                    <td className="px-5 py-4 text-[var(--color-text-faint)]">{formatDate(tenant.createdAt)}</td>
                  </tr>
                ))}
                {sorted.length === 0 && <tr><td colSpan={3} className="px-5 py-12 text-center text-[var(--color-text-faint)]">등록된 본사가 없어요.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </OpsLayout>
  );
}
