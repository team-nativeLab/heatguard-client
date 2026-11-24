import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import OpsLayout, { OpsPageHeader } from "../../components/ops/OpsLayout";
import OpsIcon, { type OpsIconName } from "../../components/ops/OpsIcon";
import { CARD } from "../../components/ops/opsStyles";
import { BTN_PRIMARY, BTN_SECONDARY, OpsModal, OpsSelect } from "../../components/ops/OpsUi";
import { NewPasswordInput } from "../../components/auth/NewPasswordField";
import { usePasswordComposition } from "../../components/auth/usePasswordComposition";
import { API_BASE_URL } from "../../shared/api/client";
import { ApiError, errorMessage, opsAdminApi, opsApi, type OpsUser } from "../../api";
import {
  AUTO_REJECT_OPTIONS, CHANNEL_LABEL, DEPOSIT_DUE_OPTIONS, NOTIFICATION_KEYS, NOTIFICATION_LABEL,
  type NotificationKey, type OpsOperator, type OpsSettings,
} from "../../lib/opsAdmin";
import { relativeTime } from "../../lib/opsInquiry";
import { getPasswordConfirmationError, getPasswordError } from "../../lib/passwordPolicy";
import { useToast } from "../../shared/ui/toastContext";

/*
 * 시스템 설정 (Figma 07_시스템 설정, node 2958:1965).
 * - 관리자 계정(내 계정)·비밀번호 변경: 서버 API 있음 (/ops/auth/me, /ops/auth/password)
 * - 가입 승인 정책·알림: GET/PUT /api/v1/ops/settings (서버 준비 중)
 * - 다른 관리자 목록·초대: /api/v1/ops/operators (서버 준비 중)
 */

type SectionKey = "policy" | "notifications" | "account" | "security" | "service";

const SECTIONS: { key: SectionKey; label: string; icon: OpsIconName }[] = [
  { key: "policy", label: "가입 승인 정책", icon: "userCheck" },
  { key: "notifications", label: "알림", icon: "bell" },
  { key: "account", label: "관리자 계정", icon: "users" },
  { key: "security", label: "보안", icon: "shield" },
  { key: "service", label: "서비스 정보", icon: "building" },
];

const INPUT =
  "h-10 w-full rounded-lg border border-[var(--ops-border)] bg-[var(--ops-surface)] px-3 text-sm text-[var(--ops-heading)] outline-none placeholder:text-[var(--ops-faint)] focus:border-[var(--ops-accent)]";

function SectionCard({ id, title, action, children }: { id: string; title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} aria-label={title} className={`${CARD} scroll-mt-4`}>
      <div className="flex items-center justify-between gap-3 border-b border-[var(--ops-divider)] px-[19px] py-3">
        <h2 className="py-1 text-[15px] font-bold text-[var(--ops-heading)]">{title}</h2>
        {action}
      </div>
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

function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-10 shrink-0 rounded-full transition-colors disabled:opacity-50 ${checked ? "bg-[var(--ops-accent)]" : "bg-[var(--ops-border)]"}`}
    >
      <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${checked ? "left-[18px]" : "left-0.5"}`} />
    </button>
  );
}

function SettingRow({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--ops-divider)] py-3 first:pt-0 last:border-b-0 last:pb-0">
      <div className="flex min-w-0 flex-col">
        <span className="text-[13px] font-bold text-[var(--ops-heading)]">{title}</span>
        {sub && <span className="text-xs text-[var(--ops-faint)]">{sub}</span>}
      </div>
      {children}
    </div>
  );
}

const SERVER_PENDING = <p className="py-2 text-[13px] text-[var(--ops-faint)]">서버 준비 중이에요. API가 배포되면 여기서 바로 설정할 수 있어요.</p>;

function InviteModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const valid = name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const submit = async () => {
    if (!valid || busy) return;
    setBusy(true);
    try {
      await opsAdminApi.inviteOperator({ name: name.trim(), email: email.trim() });
      showToast(`${email.trim()}로 초대 메일을 보냈어요.`, "success");
      onDone();
    } catch (err) {
      const code = err instanceof ApiError ? err.code : undefined;
      showToast(
        code === "INVITATION_PENDING"
          ? "이 이메일로 보낸 초대가 아직 유효해요. 24시간이 지나면 다시 보낼 수 있어요."
          : code === "EMAIL_ALREADY_EXISTS"
            ? "이미 가입된 이메일이에요."
            : err instanceof ApiError && err.status === 403
              ? "최고 관리자만 다른 관리자를 초대할 수 있어요."
              : err instanceof ApiError && err.status === 503
                ? "초대 메일을 보낼 수 없어요. 서버의 메일·초대 화면 설정을 확인해주세요."
                : errorMessage(err, "초대하지 못했어요."),
        "error",
      );
      setBusy(false);
    }
  };
  return (
    <OpsModal
      title="관리자 초대"
      description="초대 메일의 링크로 비밀번호를 정하면 운영자 계정이 만들어져요."
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={BTN_SECONDARY}>취소</button>
          <button type="button" onClick={() => void submit()} disabled={!valid || busy} className={BTN_PRIMARY}>{busy ? "보내는 중..." : "초대 보내기"}</button>
        </>
      }
    >
      <label className="flex flex-col gap-1.5 text-[13px] font-medium text-[var(--ops-heading)]">
        이름
        <input value={name} onChange={(e) => setName(e.target.value)} className={INPUT} autoComplete="off" />
      </label>
      <label className="flex flex-col gap-1.5 text-[13px] font-medium text-[var(--ops-heading)]">
        이메일
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={INPUT} autoComplete="off" />
      </label>
    </OpsModal>
  );
}

export default function OpsSettingsPage() {
  const { showToast } = useToast();
  const [me, setMe] = useState<OpsUser | null>(null);
  const [meError, setMeError] = useState("");
  const [active, setActive] = useState<SectionKey>("policy");
  // undefined: 불러오는 중, null: 서버에 기능 없음
  const [saved, setSaved] = useState<OpsSettings | null | undefined>(undefined);
  const [draft, setDraft] = useState<OpsSettings | null>(null);
  const [operators, setOperators] = useState<OpsOperator[] | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [inviting, setInviting] = useState(false);

  const loadOperators = useCallback(() => {
    // 목록을 못 불러온 경우는 "서버 준비 중"과 구분해 내 계정만 보여준다.
    opsAdminApi.listOperators().then(setOperators).catch(() => setOperators([]));
  }, []);

  useEffect(() => {
    let alive = true;
    opsApi.me()
      .then((user) => alive && setMe(user))
      .catch((err) => alive && setMeError(errorMessage(err, "계정 정보를 불러오지 못했어요.")));
    opsAdminApi.getSettings()
      .then((s) => { if (alive) { setSaved(s); setDraft(s); } })
      .catch((err) => alive && setSettingsError(errorMessage(err, "설정을 불러오지 못했어요. 새로고침해 주세요.")));
    loadOperators();
    if (window.location.hash === "#policy") document.getElementById("ops-settings-policy")?.scrollIntoView({ block: "start" });
    return () => { alive = false; };
  }, [loadOperators]);

  const dirty = !!saved && !!draft && JSON.stringify(saved) !== JSON.stringify(draft);

  const save = async () => {
    if (!draft || !dirty || saving) return;
    setSaving(true);
    try {
      const next = await opsAdminApi.updateSettings(draft);
      setSaved(next);
      setDraft(next);
      showToast("설정을 저장했어요.", "success");
    } catch (err) {
      showToast(
        err instanceof ApiError && err.status === 409 ? "다른 운영자가 먼저 설정을 바꿨어요. 새로고침 후 다시 저장해 주세요." : errorMessage(err, "설정을 저장하지 못했어요."),
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const setPolicy = (patch: Partial<OpsSettings["signupPolicy"]>) =>
    setDraft((d) => (d ? { ...d, signupPolicy: { ...d.signupPolicy, ...patch } } : d));
  const setNotify = (key: NotificationKey, enabled: boolean) =>
    setDraft((d) => (d ? { ...d, notifications: { ...d.notifications, [key]: { ...d.notifications[key], enabled } } } : d));

  const go = (key: SectionKey) => {
    setActive(key);
    document.getElementById(`ops-settings-${key}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const others = operators?.filter((o) => !o.isMe && o.userId !== me?.userId) ?? [];
  // 초대는 최고 관리자만 할 수 있다 (서버도 403으로 막는다).
  const canInvite = !!operators?.some((o) => o.isMe && o.role === "OWNER");

  return (
    <OpsLayout>
      <div className="flex w-full flex-col gap-4 px-4 pb-8 md:px-8">
        <div className="mb-2">
          <OpsPageHeader
            crumb="운영 › 시스템 설정"
            title="시스템 설정"
            description="서비스 운영 정책과 관리자 계정을 관리해요."
            actions={saved && (
              <button type="button" onClick={() => void save()} disabled={!dirty || saving} className={BTN_PRIMARY}>
                {saving ? "저장하는 중..." : "변경 사항 저장"}
              </button>
            )}
          />
        </div>

        <div className="grid items-start gap-4 lg:grid-cols-[232px_minmax(0,1fr)]">
          <nav aria-label="설정 항목" className={`${CARD} flex flex-col gap-1 p-2 lg:sticky lg:top-0`}>
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                type="button"
                aria-current={s.key === active ? "true" : undefined}
                onClick={() => go(s.key)}
                className={`flex h-10 items-center gap-2.5 rounded-[10px] px-3 text-left text-sm transition-colors ${
                  s.key === active ? "bg-[var(--ops-accent-soft)] font-bold text-[var(--ops-accent)]" : "font-medium text-[var(--ops-body)] hover:bg-[var(--ops-chip-bg)]"
                }`}
              >
                <OpsIcon name={s.icon} />
                {s.label}
              </button>
            ))}
          </nav>

          <div className="flex min-w-0 flex-col gap-4">
            <SectionCard id="ops-settings-policy" title="가입 승인 정책">
              {saved === null ? SERVER_PENDING : settingsError ? (
                <p role="alert" className="py-2 text-[13px] text-[var(--color-danger-text)]">{settingsError}</p>
              ) : !draft ? (
                <p role="status" className="py-4 text-center text-sm text-[var(--ops-faint)]">불러오는 중...</p>
              ) : (
                <>
                  <SettingRow title="자동 승인" sub="사업자 진위 확인이 끝나면 운영자 확인 없이 바로 승인해요.">
                    <Toggle label="자동 승인" checked={draft.signupPolicy.autoApprove} onChange={(v) => setPolicy({ autoApprove: v })} />
                  </SettingRow>
                  <SettingRow title="입금 기한" sub="승인 후 이 기간 안에 이용료가 입금돼야 해요.">
                    <OpsSelect label="입금 기한" value={String(draft.signupPolicy.depositDueDays)} onChange={(v) => setPolicy({ depositDueDays: Number(v) })}
                      options={DEPOSIT_DUE_OPTIONS.map((d) => ({ value: String(d), label: `${d}일` }))} />
                  </SettingRow>
                  <SettingRow title="기한이 지나면" sub="안내 메일을 한 번 더 보내고 아래 기간 뒤 자동 반려해요.">
                    <OpsSelect label="자동 반려" value={String(draft.signupPolicy.autoRejectAfterDays)} onChange={(v) => setPolicy({ autoRejectAfterDays: Number(v) })}
                      options={AUTO_REJECT_OPTIONS.map((d) => ({ value: String(d), label: `${d}일 후 자동 반려` }))} />
                  </SettingRow>
                </>
              )}
            </SectionCard>

            <SectionCard id="ops-settings-notifications" title="운영자 알림">
              {saved === null ? SERVER_PENDING : settingsError ? (
                <p role="alert" className="py-2 text-[13px] text-[var(--color-danger-text)]">{settingsError}</p>
              ) : !draft ? (
                <p role="status" className="py-4 text-center text-sm text-[var(--ops-faint)]">불러오는 중...</p>
              ) : (
                NOTIFICATION_KEYS.map((key) => (
                  <SettingRow key={key} title={NOTIFICATION_LABEL[key]}>
                    <span className="flex items-center gap-6">
                      <span className="text-xs text-[var(--ops-faint)]">{draft.notifications[key].channels.map((c) => CHANNEL_LABEL[c] ?? c).join(" · ") || "이메일"}</span>
                      <Toggle label={NOTIFICATION_LABEL[key]} checked={draft.notifications[key].enabled} onChange={(v) => setNotify(key, v)} />
                    </span>
                  </SettingRow>
                ))
              )}
            </SectionCard>

            <SectionCard
              id="ops-settings-account"
              title="관리자 계정"
              action={canInvite && (
                <button type="button" onClick={() => setInviting(true)} className={`${BTN_SECONDARY} h-8 border-transparent bg-[var(--ops-accent-soft)] text-[var(--ops-accent)]`}>
                  + 관리자 초대
                </button>
              )}
            >
              {meError ? (
                <p role="alert" className="text-sm text-[var(--color-danger-text)]">{meError}</p>
              ) : !me ? (
                <p role="status" className="py-4 text-center text-sm text-[var(--ops-faint)]">불러오는 중...</p>
              ) : (
                <ul className="flex flex-col divide-y divide-[var(--ops-divider)]">
                  {[{ userId: me.userId, name: me.name, email: me.email, role: "OPERATOR" as const, lastLoginAt: undefined, isMe: true }, ...others].map((o) => {
                    const fromList = operators?.find((x) => x.userId === o.userId || (o.isMe && x.isMe));
                    const role = fromList?.role ?? o.role;
                    return (
                      <li key={o.userId} className="flex flex-wrap items-center gap-x-6 gap-y-1 py-2.5 first:pt-0 last:pb-0">
                        <span className="flex min-w-[140px] items-center gap-2.5">
                          <span className="flex size-8 items-center justify-center rounded-full bg-[var(--ops-chip-bg)] text-[var(--ops-body)]"><OpsIcon name="user" /></span>
                          <span className="text-sm font-bold text-[var(--ops-heading)]">{o.name}</span>
                        </span>
                        <span className="min-w-[180px] text-sm text-[var(--ops-body)]">{o.email}</span>
                        <span className="rounded-full bg-[var(--ops-chip-bg)] px-2.5 py-0.5 text-xs font-medium text-[var(--ops-body)]">{role === "OWNER" ? "최고 관리자" : "운영자"}</span>
                        <span className="ml-auto text-xs text-[var(--ops-faint)]">{o.isMe ? "나 · 현재 로그인" : fromList?.lastLoginAt ? `최근 접속 ${relativeTime(fromList.lastLoginAt)}` : "접속 기록 없음"}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
              {operators === null && <p className="mt-4 text-xs text-[var(--ops-faint)]">다른 관리자 목록·초대는 서버 준비 중이에요.</p>}
            </SectionCard>

            <SectionCard id="ops-settings-security" title="보안 · 비밀번호 변경">
              <PasswordForm />
            </SectionCard>

            <SectionCard id="ops-settings-service" title="서비스 정보">
              <dl className="grid gap-x-6 gap-y-2 text-[13px] sm:grid-cols-[120px_minmax(0,1fr)]">
                <dt className="text-[var(--ops-faint)]">서비스</dt>
                <dd className="font-medium text-[var(--ops-heading)]">폭염가드 운영자 콘솔</dd>
                <dt className="text-[var(--ops-faint)]">접속 주소</dt>
                <dd className="font-medium text-[var(--ops-heading)]">{window.location.origin}</dd>
                <dt className="text-[var(--ops-faint)]">API 서버</dt>
                <dd className="font-medium text-[var(--ops-heading)]">{API_BASE_URL || `${window.location.origin} (같은 주소의 /api)`}</dd>
                <dt className="text-[var(--ops-faint)]">빌드</dt>
                <dd className="font-medium text-[var(--ops-heading)]">{import.meta.env.MODE}</dd>
              </dl>
            </SectionCard>
          </div>
        </div>
      </div>
      {inviting && <InviteModal onClose={() => setInviting(false)} onDone={() => { setInviting(false); loadOperators(); }} />}
    </OpsLayout>
  );
}
