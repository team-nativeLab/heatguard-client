import { useState } from "react";
import ManagerLayout from "../../components/manager/ManagerLayout";
import SiteManagementHeader from "../../components/manager/SiteManagementHeader";
import { ChecklistDeleteIcon } from "../../components/icons/Icons";

const DEFAULT_ITEMS = [
  "식수(음용수) 비치 확인",
  "그늘막·휴게시설 설치 확인",
  "근로자 건강상태(온열질환 증상) 확인",
  "무더위 시간대(14~17시) 옥외작업 자제",
  "2시간마다 20분 이상 휴식 실시",
  "응급처치 키트 위치 확인",
];

export default function Screen15_현장관리_체크리스트() {
  const [items, setItems] = useState(DEFAULT_ITEMS);
  const [draft, setDraft] = useState("");

  const addItem = () => {
    if (!draft.trim()) return;
    setItems((prev) => [...prev, draft.trim()]);
    setDraft("");
  };

  return (
    <ManagerLayout>
      <SiteManagementHeader active="checklist" />

      <div className="flex flex-col items-start pt-8 w-full max-w-[576px]">
        <div className="bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg w-full overflow-hidden">
          {items.map((item, i) => (
            <div
              key={item}
              className="flex gap-3 items-center px-4 py-3 border-b border-[var(--color-border)] last:border-b-0"
            >
              <span className="font-['JetBrains_Mono',monospace] text-[var(--color-accent)] text-[11px] w-5 shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="flex-1 text-[var(--color-text-value)] text-sm">{item}</span>
              <button
                type="button"
                onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
                className="opacity-70 hover:opacity-100 transition text-[var(--color-text-faint)]"
                aria-label="삭제"
              >
                <ChecklistDeleteIcon className="size-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="w-full pt-6">
          <p className="text-[var(--color-text-body)] text-xs">빠른 추가</p>
          <div className="flex gap-2 pt-4">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
              placeholder="직접 입력"
              className="bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded px-3 py-2 flex-1 text-[var(--color-text-heading)] text-sm placeholder:text-[var(--color-text-heading)]/50 outline-none focus:border-[var(--color-accent)] transition"
            />
            <button
              type="button"
              onClick={addItem}
              className="bg-[var(--color-accent)] rounded px-4 py-2 text-white text-sm font-medium hover:brightness-110 transition"
            >
              추가
            </button>
          </div>
        </div>
      </div>
    </ManagerLayout>
  );
}
