import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthCardLayout from "../../components/auth/AuthCardLayout";
import AuthField from "../../components/auth/AuthField";
import AuthSubmitButton from "../../components/auth/AuthSubmitButton";
import { AnimatedLockIcon, MailIcon } from "../../components/auth/AuthIcons";
import { NewPasswordAuthField } from "../../components/auth/NewPasswordField";
import { usePasswordComposition } from "../../components/auth/usePasswordComposition";
import { ApiError, errorMessage, opsAdminApi } from "../../api";
import { getPasswordConfirmationError, getPasswordError } from "../../lib/passwordPolicy";
import { useToast } from "../../shared/ui/toastContext";

/*
 * 운영자 초대 수락 (POST /api/v1/ops/operators/invitations/accept).
 * 초대 메일 링크: {OPS_OPERATOR_INVITATION_URL}?email=...&token=...
 * 서버 설정 OPS_OPERATOR_INVITATION_URL에는 이 화면 주소(https://.../ops/invitation)를 넣는다.
 * 토큰은 24시간·1회용이며 초대받은 이메일에만 쓸 수 있다.
 */
export default function OpsInvitationPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const email = params.get("email")?.trim() ?? "";
  const token = params.get("token")?.trim() ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const composition = usePasswordComposition();
  const validLink = !!email && !!token;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting || composition.isComposing() || !validLink) return;
    const next = { password: getPasswordError(password), confirm: getPasswordConfirmationError(password, confirm) };
    setErrors(next);
    if (next.password || next.confirm) return;
    setSubmitting(true);
    setFormError("");
    try {
      await opsAdminApi.acceptOperatorInvitation({ email, token, password, confirmPassword: confirm });
      showToast("운영자 계정을 만들었어요. 새 비밀번호로 로그인해주세요.", "success");
      navigate("/ops/login", { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.code === "INVALID_INVITATION") {
        setFormError("초대가 만료됐거나 이미 사용됐어요. 최고 관리자에게 다시 초대를 요청해주세요.");
      } else if (err instanceof ApiError && err.code === "EMAIL_ALREADY_EXISTS") {
        setFormError("이미 가입된 이메일이에요. 운영자 로그인 화면에서 로그인해주세요.");
      } else {
        setFormError(errorMessage(err, "초대를 수락하지 못했어요."));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCardLayout
      eyebrow="운영자 콘솔"
      titleLines={["운영자 초대를", "수락합니다"]}
      descriptionLines={["비밀번호를 정하면 운영자 계정이 만들어져요.", "초대 링크는 24시간 동안 한 번만 쓸 수 있어요."]}
      features={[]}
      step={2}
      footerLabel="폭염가드 운영자 콘솔"
      cardTitle="운영자 초대 수락"
      cardSubtitle={validLink ? "로그인에 사용할 비밀번호를 설정해주세요." : "초대 링크를 확인해주세요."}
      hideBackButton
    >
      {!validLink ? (
        <div className="mt-10 flex flex-col gap-4">
          <p role="alert" className="text-sm text-[var(--color-danger-text)]">
            초대 링크가 올바르지 않아요. 메일에 있는 링크 전체를 다시 열거나 최고 관리자에게 새 초대를 요청해주세요.
          </p>
          <Link to="/ops/login" className="text-sm font-bold text-[var(--auth-accent)] hover:underline">운영자 로그인으로 이동</Link>
        </div>
      ) : (
        <form className="mt-10 flex flex-col gap-1" onSubmit={(e) => void submit(e)} noValidate>
          <AuthField label="이메일" type="email" icon={<MailIcon />} value={email} readOnly autoComplete="username" />
          <NewPasswordAuthField
            label="새 비밀번호"
            icon={<AnimatedLockIcon open={!!password} />}
            placeholder="8자 이상 입력하세요"
            revealable
            value={password}
            error={errors.password}
            onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); setFormError(""); }}
            {...composition.inputProps}
          />
          <NewPasswordAuthField
            label="새 비밀번호 확인"
            icon={<AnimatedLockIcon open={!!confirm} />}
            placeholder="비밀번호를 한 번 더 입력하세요"
            revealable
            confirmation
            value={confirm}
            error={errors.confirm}
            onChange={(e) => { setConfirm(e.target.value); setErrors((p) => ({ ...p, confirm: undefined })); setFormError(""); }}
            {...composition.inputProps}
          />
          {formError && <p role="alert" className="mb-2 text-sm text-[var(--color-danger-text)]">{formError}</p>}
          <AuthSubmitButton disabled={submitting}>{submitting ? "계정 만드는 중..." : "초대 수락하고 계정 만들기"}</AuthSubmitButton>
        </form>
      )}
    </AuthCardLayout>
  );
}
