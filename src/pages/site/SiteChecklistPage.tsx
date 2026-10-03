import { useEffect, useState } from "react";
import HomeLayout from "../../components/home/HomeLayout";
import SiteManagementHeader from "../../components/manager/SiteManagementHeader";
import ConfirmDialog from "../../shared/ui/ConfirmDialog";
import { ChecklistDeleteIcon } from "../../components/icons/Icons";
import { useToast } from "../../shared/ui/Toast";
import { LoadError, SkeletonList } from "../../shared/ui/Skeleton";
import { checklistsApi, isDemoFallback, errorMessage, type ChecklistItem, type ChecklistQuickAddKey } from "../../api";

const QUICK_ADD: { key: ChecklistQuickAddKey; text: string }[] = [
  { key: "식수", text: "식수(음용수) 비치 확인" },
  { key: "그늘막", text: "그늘막·휴게시설 설치 확인" },
  { key: "건강상태", text: "근로자 건강상태(온열질환 증상) 확인" },
  { key: "옥외작업자제", text: "무더위 시간대(14~17시) 옥외작업 자제" },
  { key: "2시간휴식", text: "2시간마다 20분 이상 휴식 실시" },
];

const FALLBACK_ITEMS: ChecklistItem[] = [...QUICK_ADD.map((q) => q.text), "응급처치 키트 위치 확인"].map((text, i) => ({
  id: `fallback-${i}`,
  text,
  sortOrder: i,
  active: true,
}));

const MAX_TEXT = 60;

const iconBtn =
  "flex items-center justify-center size-7 rounded-md text-[var(--color-text-faint)] hover:text-[var(--color-text-label)] hover:bg-[var(--color-bg-tile)] transition disabled:opacity-30 disabled:pointer-events-none";

export default function SiteChecklistPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "failed">("loading");
  const [attempt, setAttempt] = useState(0);
  const [draft, setDraft] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [pendingDelete, setPendingDelete] = useState<ChecklistItem | null>(null);

  useEffect(() => {
    let alive = true;
    setLoadState("loading");
    checklistsApi
      .listChecklistItems()
      .then((res) => {
        if (!alive) return;
        setItems(res.items.filter((i) => i.active).sort((a, b) => a.sortOrder - b.sortOrder));
        setLoadState("ready");
      })
      .catch((err) => {
        if (!alive) return;
        if (isDemoFallback(err)) {
          setItems(FALLBACK_ITEMS);
          setLoadState("ready");
        } else {
          setLoadState("failed");
        }
      });
    return () => {
      alive = false;
    };
  }, [attempt]);

  const hasText = (text: string, exceptId?: string) =>
    items.some((i) => i.id !== exceptId && i.text.replace(/\s/g, "") === text.replace(/\s/g, ""));

  const addItem = async (payload: { text?: string; quickAddKey?: ChecklistQuickAddKey }) => {
    const text = payload.text ?? QUICK_ADD.find((q) => q.key === payload.quickAddKey)?.text ?? "";
    if (busyKey) return;
    if (!text.trim()) return showToast("추가할 항목을 입력해주세요.", "error");
    if (text.length > MAX_TEXT) return showToast(`항목은 ${MAX_TEXT}자 이내로 입력해주세요.`, "error");
    if (hasText(text)) return showToast("이미 있는 항목이에요.", "error");

    setBusyKey(payload.quickAddKey ?? "draft");
    try {
      const created = await checklistsApi.createChecklistItem(payload);
      setItems((prev) => [...prev, created]);
      if (payload.text) setDraft("");
      showToast("항목을 추가했어요.", "success");
    } catch (err) {
      if (isDemoFallback(err)) {
        setItems((prev) => [...prev, { id: `local-${Date.now()}`, text, sortOrder: prev.length, active: true }]);
        if (payload.text) setDraft("");
        showToast("항목을 추가했어요. (데모)", "success");
        return;
      }
      showToast(errorMessage(err, "항목 추가에 실패했어요."), "error");
    } finally {
      setBusyKey(null);
    }
  };

  const startEdit = (item: ChecklistItem) => {
    setEditingId(item.id);
    setEditText(item.text);
  };

  const saveEdit = async (item: ChecklistItem) => {
    const text = editText.trim();
    if (!text) return showToast("항목 내용을 입력해주세요.", "error");
    if (text.length > MAX_TEXT) return showToast(`항목은 ${MAX_TEXT}자 이내로 입력해주세요.`, "error");
    if (text === item.text) return setEditingId(null);
    if (hasText(text, item.id)) return showToast("이미 있는 항목이에요.", "error");

    const prevItems = items;
    setItems((cur) => cur.map((i) => (i.id === item.id ? { ...i, text } : i)));
    setEditingId(null);
    try {
      await checklistsApi.updateChecklistItem(item.id, { text });
      showToast("항목을 수정했어요.", "success");
    } catch (err) {
      if (isDemoFallback(err)) return showToast("항목을 수정했어요. (데모)", "success");
      setItems(prevItems);
      showToast(errorMessage(err, "수정에 실패했어요."), "error");
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const prevItems = items;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    const reordered = next.map((item, i) => ({ ...item, sortOrder: i }));
    setItems(reordered);
    try {
      await Promise.all([
        checklistsApi.updateChecklistItem(reordered[index].id, { sortOrder: index }),
        checklistsApi.updateChecklistItem(reordered[target].id, { sortOrder: target }),
      ]);
    } catch (err) {
      if (isDemoFallback(err)) return;
      setItems(prevItems);
      showToast(errorMessage(err, "순서 변경에 실패했어요."), "error");
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const item = pendingDelete;
    setPendingDelete(null);
    const prevItems = items;
    setItems((current) => current.filter((i) => i.id !== item.id));
    try {
      await checklistsApi.deleteChecklistItem(item.id);
      showToast("항목을 삭제했어요.");
    } catch (err) {
      if (isDemoFallback(err)) return showToast("항목을 삭제했어요. (데모)");
      setItems(prevItems);
      showToast(errorMessage(err, "삭제에 실패했어요."), "error");
    }
  };

  return (
    <HomeLayout>
      <SiteManagementHeader active="checklist" />

      <div className="flex flex-col items-start pt-8 w-full max-w-[640px] self-start">
        <p className="text-[var(--color-text-body)] text-xs pb-3">
          팀원이 매일 확인하는 온열질환 예방 체크리스트예요. 항목을 누르면 수정할 수 있어요.
        </p>
        {loadState === "loading" && <SkeletonList count={6} itemClassName="h-[44px]" />}
        {loadState === "failed" && <LoadError message="체크리스트를 불러오지 못했어요." onRetry={() => setAttempt((n) => n + 1)} />}
        {loadState === "ready" && (
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg w-full overflow-hidden">
          {items.map((item, i) => (
            <div
              key={item.id}
              className="group flex gap-3 items-center pl-4 pr-2 py-2 min-h-[48px] border-b border-[var(--color-border)] last:border-b-0"
            >
              <span className="font-['JetBrains_Mono',monospace] text-[var(--color-accent)] text-[11px] w-5 shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              {editingId === item.id ? (
                <input
                  autoFocus
                  value={editText}
                  maxLength={MAX_TEXT}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit(item);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  onBlur={() => saveEdit(item)}
                  className="flex-1 bg-[var(--color-bg-input)] border border-[var(--color-accent)] rounded-md h-8 px-2 text-sm text-[var(--color-text-heading)] outline-none"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => startEdit(item)}
                  className="flex-1 text-left text-[var(--color-text-value)] text-sm hover:text-[var(--color-accent)] transition-colors"
                  title="눌러서 수정"
                >
                  {item.text}
                </button>
              )}
              <div className="flex items-center opacity-60 group-hover:opacity-100 transition-opacity">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="위로" className={iconBtn}>
                  <svg viewBox="0 0 16 16" className="size-3.5" fill="none"><path d="M4 10l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="아래로" className={iconBtn}>
                  <svg viewBox="0 0 16 16" className="size-3.5" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <button type="button" onClick={() => setPendingDelete(item)} aria-label="삭제" className={`${iconBtn} hover:!text-[var(--color-danger-text)]`}>
                  <ChecklistDeleteIcon className="size-4" />
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-[var(--color-text-faint)] text-sm px-4 py-6">등록된 항목이 없어요. 아래에서 추가해주세요.</p>
          )}
        </div>
        )}

        <div className="w-full pt-6">
          <p className="text-[var(--color-text-body)] text-xs">빠른 추가</p>
          <div className="flex gap-1.5 pt-2 flex-wrap">
            {QUICK_ADD.map(({ key, text }) => {
              const added = hasText(text);
              return (
                <button
                  key={key}
                  type="button"
                  disabled={added || busyKey === key}
                  title={added ? "이미 추가된 항목이에요" : text}
                  onClick={() => addItem({ quickAddKey: key })}
                  className="border border-[var(--color-border)] text-[var(--color-text-label)] text-xs px-3 py-1.5 rounded-full hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition disabled:opacity-40 disabled:pointer-events-none"
                >
                  {added ? "✓" : "+"} {key}
                </button>
              );
            })}
          </div>
          <form
            className="flex gap-2 pt-4"
            onSubmit={(e) => {
              e.preventDefault();
              addItem({ text: draft.trim() });
            }}
          >
            <input
              value={draft}
              maxLength={MAX_TEXT}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="직접 입력"
              className="bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg h-[38px] px-3 flex-1 text-[var(--color-text-heading)] text-sm placeholder:text-[var(--color-text-faint)] outline-none focus:border-[var(--color-accent)] transition"
            />
            <button
              type="submit"
              disabled={busyKey === "draft"}
              className="bg-[var(--color-accent)] rounded-lg h-[38px] px-4 text-white text-sm font-medium hover:brightness-110 transition disabled:opacity-60"
            >
              추가
            </button>
          </form>
        </div>
      </div>

      {pendingDelete && (
        <ConfirmDialog
          title="이 항목을 삭제할까요?"
          description={pendingDelete.text}
          confirmLabel="삭제"
          destructive
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </HomeLayout>
  );
}
