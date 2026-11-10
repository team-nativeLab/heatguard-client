import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthCardLayout from "../../components/auth/AuthCardLayout";
import AuthField from "../../components/auth/AuthField";
import AuthSubmitButton from "../../components/auth/AuthSubmitButton";
import { AnimatedLockIcon, MapPinIcon } from "../../components/auth/AuthIcons";
import { ApiError, authApi, errorMessage } from "../../api";
import { clearSiteMeCache } from "../../hooks/useSiteMe";
import { setSelectedSiteId } from "../../lib/siteSelection";

export default function SiteCompanyInvitationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [invitationId, setInvitationId] = useState(searchParams.get("invitationId")?.trim() ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    if (!invitationId.trim()) {
      setError("본사에서 받은 초대 ID를 입력해주세요.");
      return;
    }
    if (!currentPassword) {
      setError("현재 비밀번호를 입력해주세요.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const accepted = await authApi.acceptCompanyInvitation({
        invitationId: invitationId.trim(),
        currentPassword,
      });

      // The server keeps the existing session; refresh identity and site scope before navigating.
      clearSiteMeCache();
      authApi.clearManagedSitesCache();
      const [me, sites] = await Promise.all([
        authApi.me(),
        authApi.listManagedSites({ refresh: true }),
      ]);
      const selectedSiteId =
        accepted.selectedSiteId ||
        me.selectedSiteId ||
        sites[0]?.siteId ||
        accepted.sites?.[0]?.siteId;
      if (!selectedSiteId) {
        throw new Error("연결은 완료됐지만 현장 목록을 확인하지 못했어요. 새로고침 후 다시 확인해주세요.");
      }
      setSelectedSiteId(selectedSiteId);
      navigate("/manager", { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError("초대가 만료되었거나 이미 사용됐어요. 본사 관리자에게 새 초대를 요청해주세요.");
      } else if (err instanceof ApiError && err.status === 403) {
        setError("현재 로그인한 계정으로 받은 초대가 아니에요. 초대 이메일과 계정을 확인해주세요.");
      } else if (err instanceof ApiError && err.status === 401) {
        setError("현재 비밀번호가 맞지 않아요.");
      } else if (err instanceof ApiError && err.status === 409) {
        setError("이미 다른 본사에 연결됐거나 소속 상태를 변경할 수 없어요. 본사 관리자에게 문의해주세요.");
      } else {
        setError(errorMessage(err, "본사 초대를 수락하지 못했어요."));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCardLayout
      side="signup"
      eyebrow="현장 관리자 연결"
      titleLines={["본사 초대를 수락하고", "기존 현장을 연결하세요"]}
      descriptionLines={["계정과 현장·팀·기록은 유지됩니다.", "연결 후 본사 소속 현장으로 사용할 수 있어요."]}
      features={[{ icon: <MapPinIcon size={24} />, tone: "orange", title: "기존 현장 유지", description: "새 계정이나 현장을 만들지 않습니다" }]}
      step={2}
      footerLabel="폭염가드 관리자 포털"
      cardTitle="본사 초대 수락"
      cardSubtitle="본사에서 받은 초대 ID와 현재 비밀번호를 입력해주세요."
      hideBackButton
    >
      <form className="mt-6 flex flex-col gap-4" onSubmit={submit} noValidate>
        <AuthField
          label="초대 ID"
          icon={<MapPinIcon size={18} />}
          placeholder="본사에서 받은 초대 ID"
          autoComplete="off"
          value={invitationId}
          onChange={(event) => { setInvitationId(event.target.value); setError(""); }}
        />
        <AuthField
          label="현재 비밀번호"
          type="password"
          icon={<AnimatedLockIcon open={!!currentPassword} />}
          placeholder="현장 관리자 계정 비밀번호"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => { setCurrentPassword(event.target.value); setError(""); }}
        />
        {error && <p role="alert" className="text-sm text-[var(--color-danger-text)]">{error}</p>}
        <AuthSubmitButton disabled={submitting}>
          {submitting ? "현장을 연결하는 중..." : "초대 수락하고 현장 연결"}
        </AuthSubmitButton>
      </form>
    </AuthCardLayout>
  );
}
