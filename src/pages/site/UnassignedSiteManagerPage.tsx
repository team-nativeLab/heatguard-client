import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import AuthCardLayout from "../../components/auth/AuthCardLayout";
import AuthField from "../../components/auth/AuthField";
import AuthSubmitButton from "../../components/auth/AuthSubmitButton";
import { MapPinIcon, PhoneIcon } from "../../components/auth/AuthIcons";
import { authApi, errorMessage } from "../../api";
import { useToast } from "../../shared/ui/Toast";
import { clearSiteMeCache } from "../../hooks/useSiteMe";
import { setSelectedSiteId } from "../../lib/siteSelection";

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export default function UnassignedSiteManagerPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [siteName, setSiteName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    authApi.me()
      .then((me) => {
        if (!active) return;
        if (me.membershipStatus !== "UNASSIGNED") {
          navigate("/manager", { replace: true });
          return;
        }
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(errorMessage(err, "계정 정보를 불러오지 못했어요."));
        setLoading(false);
      });
    return () => { active = false; };
  }, [navigate]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    const normalizedPhone = phone.replace(/\D/g, "");
    if (!siteName.trim()) {
      setError("현장 이름을 입력해주세요.");
      return;
    }
    if (!/^01[016789]\d{7,8}$/.test(normalizedPhone)) {
      setError("휴대전화 번호를 확인해주세요.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const result = await authApi.createManagedSite({
        siteName: siteName.trim(),
        managerPhone: phone,
      });
      const siteId = result.selectedSiteId || result.site?.siteId;
      if (!siteId) throw new Error("현장 생성 응답에서 현장 정보를 확인하지 못했어요.");
      setSelectedSiteId(siteId);
      authApi.clearManagedSitesCache();
      clearSiteMeCache();
      showToast("현장과 기본팀을 만들었어요.", "success");
      navigate("/manager", { replace: true });
    } catch (err) {
      setError(errorMessage(err, "현장을 만들지 못했어요. 입력 내용을 확인하고 다시 시도해주세요."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCardLayout
      side="signup"
      eyebrow="현장 관리자"
      titleLines={["현장을 만들고", "바로 시작하세요"]}
      descriptionLines={["본사 연결 전에도 현장과 기본팀을 만들 수 있어요.", "본사 초대는 전달받은 링크에서 연결할 수 있습니다."]}
      features={[{ icon: <MapPinIcon size={24} />, tone: "orange", title: "현장 생성", description: "현장을 만든 뒤 작업자를 초대하세요" }]}
      step={1}
      footerLabel="폭염가드 관리자 포털"
      cardTitle="현장 만들기"
      cardSubtitle="현장 이름과 관리자 연락처를 입력해주세요."
      hideBackButton
    >
      {loading ? (
        <div role="status" className="mt-8 text-sm text-[var(--auth-text-muted)]">계정 정보를 확인하는 중...</div>
      ) : (
        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <AuthField
            label="현장 이름"
            icon={<MapPinIcon size={18} />}
            placeholder="예: 서울 1공사 현장"
            autoComplete="organization"
            value={siteName}
            onChange={(event) => { setSiteName(event.target.value); setError(""); }}
          />
          <AuthField
            label="관리자 전화번호"
            type="tel"
            icon={<PhoneIcon size={18} />}
            placeholder="010-1234-5678"
            autoComplete="tel"
            inputMode="numeric"
            value={phone}
            onChange={(event) => { setPhone(formatPhone(event.target.value)); setError(""); }}
          />
          {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
          <AuthSubmitButton disabled={submitting}>
            {submitting ? "현장 만드는 중..." : "현장 만들기"}
          </AuthSubmitButton>
        </form>
      )}
    </AuthCardLayout>
  );
}
