import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthCardLayout from "../../components/auth/AuthCardLayout";
import AuthField from "../../components/auth/AuthField";
import AuthSubmitButton from "../../components/auth/AuthSubmitButton";
import { AnimatedLockIcon, MailIcon, MapPinIcon, PhoneIcon } from "../../components/auth/AuthIcons";
import { authApi, ApiError, errorMessage } from "../../api";
import type { SiteUser } from "../../api/types";
import { useToast } from "../../shared/ui/Toast";
import { clearSiteMeCache } from "../../hooks/useSiteMe";

export default function UnassignedSiteManagerPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const [user, setUser] = useState<SiteUser | null>(null);
  const [invitationId, setInvitationId] = useState(() => searchParams.get("invitationId") ?? "");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    authApi.me().then((me) => {
      if (!active) return;
      if (me.membershipStatus !== "UNASSIGNED") {
        navigate("/manager", { replace: true });
        return;
      }
      setUser(me);
      setLoading(false);
    }).catch((err: unknown) => {
      if (!active) return;
      setError(errorMessage(err, "계정 정보를 불러오지 못했어요."));
      setLoading(false);
    });
    return () => { active = false; };
  }, [navigate]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    if (!invitationId.trim()) { setError("본사에서 받은 초대 ID를 입력해주세요."); return; }
    const managerPhone = phone.replace(/\D/g, "");
    if (!/^01[016789]\d{7,8}$/.test(managerPhone)) { setError("휴대전화 번호를 확인해주세요."); return; }
    if (!password) { setError("현재 계정 비밀번호를 입력해주세요."); return; }
    if (password !== confirmPassword) { setError("비밀번호가 일치하지 않아요."); return; }
    if (!user?.email) { setError("계정 이메일을 확인하지 못했어요. 다시 로그인해주세요."); return; }

    setSubmitting(true);
    setError("");
    try {
      await authApi.acceptSiteInvitation({
        invitationId: invitationId.trim(),
        email: user.email,
        managerPhone,
        password,
        confirmPassword,
      });
      clearSiteMeCache();
      showToast("현장 연결이 완료됐어요.", "success");
      navigate("/manager", { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.code === "INVALID_SITE_MANAGER_INVITATION") {
        setError("초대 ID가 만료됐거나 이미 사용됐어요. 본사에 새 초대를 요청해주세요.");
      } else if (err instanceof ApiError && err.code === "INVALID_CREDENTIALS") {
        setError("현재 계정 비밀번호를 확인해주세요.");
      } else if (err instanceof ApiError && err.code === "EMAIL_ALREADY_EXISTS") {
        setError("초대에 등록된 이메일과 로그인 계정이 달라요.");
      } else {
        setError(errorMessage(err, "현장 연결에 실패했어요."));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCardLayout
      side="signup"
      eyebrow="현장 관리자"
      titleLines={["본사 초대를 받아", "현장에 연결하세요"]}
      descriptionLines={["연결 전에는 현장 업무를 사용할 수 없어요.", "초대 ID는 본사 관리자에게 요청해주세요."]}
      features={[{ icon: <MapPinIcon size={24} />, tone: "orange", title: "현장 연결", description: "초대를 수락하면 기존 계정에 연결돼요" }]}
      step={1}
      footerLabel="폭염가드 관리자 포털"
      cardTitle="현장 연결"
      cardSubtitle="본사에서 받은 초대 ID를 입력해주세요."
      hideBackButton
    >
      {loading ? (
        <div role="status" className="mt-8 text-sm text-[var(--auth-text-muted)]">계정 정보를 불러오는 중...</div>
      ) : (
        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <AuthField label="계정 이메일" type="email" icon={<MailIcon size={18} />} value={user?.email ?? ""} disabled autoComplete="username" />
          <AuthField label="전화번호" type="tel" icon={<PhoneIcon size={18} />} placeholder="010-1234-5678" autoComplete="tel" inputMode="numeric" value={phone} onChange={(event) => { const digits = event.target.value.replace(/\D/g, "").slice(0, 11); const formatted = digits.length <= 3 ? digits : digits.length <= 7 ? `${digits.slice(0, 3)}-${digits.slice(3)}` : `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`; setPhone(formatted); setError(""); }} />
          <AuthField label="초대 ID" icon={<MapPinIcon size={18} />} placeholder="본사에서 받은 초대 ID" value={invitationId} onChange={(event) => { setInvitationId(event.target.value); setError(""); }} />
          <AuthField label="현재 비밀번호" type="password" icon={<AnimatedLockIcon open={false} />} placeholder="계정 비밀번호" autoComplete="current-password" value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} revealable />
          <AuthField label="비밀번호 확인" type="password" icon={<AnimatedLockIcon open={false} />} placeholder="비밀번호를 한 번 더 입력하세요" autoComplete="current-password" value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); setError(""); }} revealable />
          {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
          <AuthSubmitButton disabled={submitting}>{submitting ? "연결 중..." : "초대 수락하고 현장 연결"}</AuthSubmitButton>
        </form>
      )}
    </AuthCardLayout>
  );
}
