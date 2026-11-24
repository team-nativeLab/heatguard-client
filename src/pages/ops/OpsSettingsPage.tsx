import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import OpsLayout, { OpsPageHeader } from "../../components/ops/OpsLayout";
import OpsIcon, { type OpsIconName } from "../../components/ops/OpsIcon";
import { CARD } from "../../components/ops/opsStyles";
import { NewPasswordInput } from "../../components/auth/NewPasswordField";
import { usePasswordComposition } from "../../components/auth/usePasswordComposition";
import { ApiError, errorMessage, opsApi, type OpsUser } from "../../api";
import { getPasswordConfirmationError, getPasswordError } from "../../lib/passwordPolicy";
import { useToast } from "../../shared/ui/toastContext";

/*
 * 시스템 설정 (Figma 07_시스템 설정, node 2958:1965).
 * 서버 API가 있는 "관리자 계정(내 계정)"과 "보안(비밀번호 변경)"만 동작한다.
 * 가입 승인 정책·알림·서비스 정보는 서버 기능이 없어 비활성으로 둔다.
 */

type SectionKey = "account" | "security";

const SECTIONS: { key: SectionKey | null; label: string; icon: OpsIconName }[] = [
  { key: null, label: "가입 승인 정책", icon: "userCheck" },
  { key: null, label: "알림", icon: "alert" },
  { key: "account", label: "관리자 계정", icon: "users" },
  { key: "security", label: "보안", icon: "settings" },
  { key: null, label: "서비스 정보", icon: "building" },
];

const INPUT =
  "h-10 w-full rounded-lg border border-[var(--ops-border)] bg-[var(--ops-surface)] px-3 text-sm text-[var(--ops-heading)] outline-none placeholder:text-[var(--ops-faint)] focus:border-[var(--ops-accent)]";

function SectionCard({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-label={title} className={`${CARD} scroll-mt-4`}>
      <h2 className="border-b border-[var(--ops-divider)] px-[19px] py-4 text-[15px] font-bold text-[var(--ops-heading)]">{title}</h2>
      <div className="p-[19px]">{children}</div>
    </section>
  );
}

function PasswordForm() {
  const { showToast } = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ current?: string; next?: string; confirm?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const composition = usePasswordComposition();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting || composition.isComposing()) return;
    const found: typeof errors = {};
    if (!current) found.current = "현재 비밀번호를 입력해 주세요.";
    const nextError = getPasswordError(next);
    const confirmError = getPasswordConfirmationError(next, confirm);
    if (nextError) found.next = nextError;
    if (confirmError) found.confirm = confirmError;
    if (!found.next && current && next === current) found.next = "현재 비밀번호와 다른 비밀번호를 입력해 주세요.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await opsApi.changePassword({ currentPassword: current, newPassword: next });
      showToast("비밀번호를 변경했어요.", "success");
      setCurrent("");
      setNext("");
      setConfirm("");
      setErrors({});
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) setErrors({ current: "현재 비밀번호가 올바르지 않아요." });
      else showToast(errorMessage(err, "비밀번호를 변경하지 못했어요."), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const label = "text-[13px] font-medium text-[var(--ops-heading)]";
  const errCls = "text-xs text-[var(--color-danger-text)]";

  return (
    <form onSubmit={(e) => void submit(e)} className="flex max-w-[420px] flex-col gap-4" noValidate>
      <label className="flex flex-col gap-1.5">
        <span className={label}>현재 비밀번호</span>
        <input
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => {
            setCurrent(e.target.value);
            setErrors((p) => ({ ...p, current: undefined }));
          }}
          className={INPUT}
        />
        {errors.current && <span role="alert" className={errCls}>{errors.current}</span>}
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={label}>새 비밀번호</span>
        <NewPasswordInput
          aria-label="새 비밀번호"
          value={next}
          onChange={(e) => {
            setNext(e.target.value);
            setErrors((p) => ({ ...p, next: undefined }));
          }}
          className={INPUT}
          error={errors.next}
          {...composition.inputProps}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={label}>새 비밀번호 확인</span>
        <NewPasswordInput
          aria-label="새 비밀번호 확인"
          confirmation
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            setErrors((p) => ({ ...p, confirm: undefined }));
          }}
          className={INPUT}
          error={errors.confirm}
          {...composition.inputProps}
        />
      </label>
      <div>
        <button
          type="submit"
          disabled={submitting}
          className="h-9 rounded-lg bg-[var(--ops-accent)] px-4 text-[13px] font-medium text-white transition hover:brightness-110 disabled:opacity-60"
        >
          {submitting ? "변경 중..." : "비밀번호 변경"}
        </button>
      </div>
    </form>
  );
}

export default function OpsSettingsPage() {
  const { showToast } = useToast();
  const [me, setMe] = useState<OpsUser | null>(null);
  const [meError, setMeError] = useState("");
  const [active, setActive] = useState<SectionKey>("account");

  useEffect(() => {
    let alive = true;
    opsApi.me()
      .then((user) => alive && setMe(user))
      .catch((err) => alive && setMeError(errorMessage(err, "계정 정보를 불러오지 못했어요.")));
    return () => { alive = false; };
  }, []);

  const go = (key: SectionKey) => {
    setActive(key);
    document.getElementById(`ops-settings-${key}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <OpsLayout>
      <div className="flex w-full flex-col gap-4 px-4 pb-8 md:px-8">
        <div className="mb-2">
          <OpsPageHeader crumb="운영 › 시스템 설정" title="시스템 설정" description="관리자 계정과 보안 설정을 관리해요." />
        </div>

        <div className="grid items-start gap-4 lg:grid-cols-[232px_minmax(0,1fr)]">
          <nav aria-label="설정 항목" className={`${CARD} flex flex-col gap-1 p-2`}>
            {SECTIONS.map((s) => {
              const enabled = s.key !== null;
              const selected = enabled && s.key === active;
              return (
                <button
                  key={s.label}
                  type="button"
                  aria-disabled={!enabled || undefined}
                  aria-current={selected ? "true" : undefined}
                  title={enabled ? undefined : "준비 중인 기능이에요"}
                  onClick={() => (s.key ? go(s.key) : showToast(`${s.label} · 준비 중인 기능이에요.`))}
                  className={`flex h-10 items-center gap-2.5 rounded-[10px] px-3 text-left text-sm transition-colors ${
                    selected
                      ? "bg-[var(--ops-accent-soft)] font-bold text-[var(--ops-accent)]"
                      : enabled
                        ? "font-medium text-[var(--ops-body)] hover:bg-[var(--ops-chip-bg)]"
                        : "cursor-not-allowed font-medium text-[var(--ops-body)] opacity-45"
                  }`}
                >
                  <OpsIcon name={s.icon} />
                  {s.label}
                </button>
              );
            })}
          </nav>

          <div className="flex min-w-0 flex-col gap-4">
            <SectionCard id="ops-settings-account" title="관리자 계정">
              {meError ? (
                <p role="alert" className="text-sm text-[var(--color-danger-text)]">{meError}</p>
              ) : !me ? (
                <p role="status" className="py-4 text-center text-sm text-[var(--ops-faint)]">불러오는 중...</p>
              ) : (
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <span className="flex items-center gap-2.5">
                    <span className="flex size-8 items-center justify-center rounded-full bg-[var(--ops-chip-bg)] text-[var(--ops-body)]">
                      <OpsIcon name="user" />
                    </span>
                    <span className="text-sm font-bold text-[var(--ops-heading)]">{me.name}</span>
                  </span>
                  <span className="text-sm text-[var(--ops-body)]">{me.email}</span>
                  <span className="rounded-full bg-[var(--ops-chip-bg)] px-2.5 py-0.5 text-xs font-medium text-[var(--ops-body)]">운영자</span>
                  <span className="ml-auto text-xs text-[var(--ops-faint)]">나 · 현재 로그인</span>
                </div>
              )}
              <p className="mt-4 text-xs text-[var(--ops-faint)]">다른 관리자 초대·목록은 서버 기능이 생기면 추가돼요.</p>
            </SectionCard>

            <SectionCard id="ops-settings-security" title="보안 · 비밀번호 변경">
              <PasswordForm />
            </SectionCard>
          </div>
        </div>
      </div>
    </OpsLayout>
  );
}
