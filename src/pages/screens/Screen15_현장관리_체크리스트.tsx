import { useEffect, useState } from "react";
import HomeLayout from "../../components/home/HomeLayout";
import SiteManagementHeader from "../../components/manager/SiteManagementHeader";
import { ChecklistDeleteIcon } from "../../components/icons/Icons";
import { useToast } from "../../components/ui/Toast";
import { checklistsApi, isNetworkError, ApiError, type ChecklistItem, type ChecklistQuickAddKey } from "../../api";

const FALLBACK_ITEMS: ChecklistItem[] = [
  "식수(음용수) 비치 확인",
  "그늘막·휴게시설 설치 확인",
  "근로자 건강상태(온열질환 증상) 확인",
  "무더위 시간대(14~17시) 옥외작업 자제",
  "2시간마다 20분 이상 휴식 실시",
  "응급처치 키트 위치 확인",
].map((text, i) => ({ id: `fallback-${i}`, text, sortOrder: i, active: true }));

const QUICK_ADD_KEYS: ChecklistQuickAddKey[] = ["식수", "그늘막", "건강상태", "옥외작업자제", "2시간휴식"];

export default function Screen15_현장관리_체크리스트() {
  const { showToast } = useToast();
  const [items, setItems] = useState<ChecklistItem[]>(FALLBACK_ITEMS);
  const [draft, setDraft] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    checklistsApi
      .listChecklistItems()
      .then((res) => {
        if (alive) setItems(res.items);
      })
      .catch((err) => {
        console.warn("체크리스트 목록 조회 실패 — 데모 데이터로 표시합니다.", err);
      });
    return () => {
      alive = false;
    };
  }, []);

  const addItem = async (payload: { text?: string; quickAddKey?: ChecklistQuickAddKey }) => {
    const key = payload.quickAddKey ?? payload.text ?? "";
    if (busyKey) return;
    setBusyKey(key);
    try {
      const created = await checklistsApi.createChecklistItem(payload);
      setItems((prev) => [...prev, created]);
      if (payload.text) setDraft("");
    } catch (err) {
      if (isNetworkError(err)) {
        setItems((prev) => [
          ...prev,
          { id: `local-${Date.now()}`, text: payload.text ?? payload.quickAddKey ?? "", sortOrder: prev.length, active: true },
        ]);
        if (payload.text) setDraft("");
        return;
      }
      showToast(err instanceof ApiError ? err.message : "항목 추가에 실패했어요.", "error");
    } finally {
      setBusyKey(null);
    }
  };

  const deleteItem = async (item: ChecklistItem) => {
    const prevItems = items;
    setItems((current) => current.filter((i) => i.id !== item.id));
    try {
      await checklistsApi.deleteChecklistItem(item.id);
    } catch (err) {
      if (isNetworkError(err)) return;
      setItems(prevItems);
      showToast(err instanceof ApiError ? err.message : "삭제에 실패했어요.", "error");
    }
  };

  return (
    <HomeLayout>
      <SiteManagementHeader active="checklist" />

      <div className="flex flex-col items-start pt-8 w-full max-w-[576px]">
        <div className="bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg w-full overflow-hidden">
          {items.map((item, i) => (
            <div
              key={item.id}
              className="flex gap-3 items-center px-4 py-3 border-b border-[var(--color-border)] last:border-b-0"
            >
              <span className="font-['JetBrains_Mono',monospace] text-[var(--color-accent)] text-[11px] w-5 shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="flex-1 text-[var(--color-text-value)] text-sm">{item.text}</span>
              <button
                type="button"
                onClick={() => deleteItem(item)}
                className="opacity-70 hover:opacity-100 transition text-[var(--color-text-faint)]"
                aria-label="삭제"
              >
                <ChecklistDeleteIcon className="size-4" />
              </button>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-[var(--color-text-faint)] text-sm px-4 py-6">등록된 항목이 없습니다.</p>
          )}
        </div>

        <div className="w-full pt-6">
          <p className="text-[var(--color-text-body)] text-xs">빠른 추가</p>
          <div className="flex gap-1.5 pt-2 flex-wrap">
            {QUICK_ADD_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                disabled={busyKey === key}
                onClick={() => addItem({ quickAddKey: key })}
                className="border border-[var(--color-border)] text-[var(--color-text-label)] text-xs px-3 py-1.5 rounded-full hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition disabled:opacity-50"
              >
                + {key}
              </button>
            ))}
          </div>
          <div className="flex gap-2 pt-4">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && draft.trim() && addItem({ text: draft.trim() })}
              placeholder="직접 입력"
              className="bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded px-3 py-2 flex-1 text-[var(--color-text-heading)] text-sm placeholder:text-[var(--color-text-heading)]/50 outline-none focus:border-[var(--color-accent)] transition"
            />
            <button
              type="button"
              onClick={() => draft.trim() && addItem({ text: draft.trim() })}
              disabled={busyKey === draft.trim()}
              className="bg-[var(--color-accent)] rounded px-4 py-2 text-white text-sm font-medium hover:brightness-110 transition disabled:opacity-60"
            >
              추가
            </button>
          </div>
        </div>
      </div>
    </HomeLayout>
  );
}
