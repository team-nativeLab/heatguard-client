# heatguard-client

## 회원가입 이메일 인증

본사·현장관리자 가입은 이메일 인증을 먼저 완료한 뒤 비밀번호를 설정합니다. 발송 요청은 `POST https://d2f845gr2v9cs2.cloudfront.net/api/v1/auth/team/email-codes`에 `{ "email": "user@example.com" }`을 보냅니다. `202`는 발송 접수만 뜻하며, 응답 본문이나 발송 성공만으로 인증 완료 처리하지 않습니다.

사용자가 입력한 코드는 같은 CloudFront origin의 `POST /api/v1/auth/team/email-codes/verify`에 `{ "email": "user@example.com", "verificationCode": "123456" }`으로 확인합니다. 로그인 토큰은 필요하지 않습니다. `200` 응답의 `data.verified`가 `true`이고, `verificationToken`이 있으며 `expiresAt`이 미래인 경우에만 비밀번호 단계로 이동합니다. 프론트는 코드 제한시간 10분과 재발송 간격 60초를 표시합니다. 이메일 또는 코드가 바뀌거나 다시 발송하면 이전 인증 결과가 무효화됩니다.

가입 완료 시 기존 역할별 경로를 사용합니다. 본사는 `POST /api/v1/auth/hq/register`, 현장관리자는 `POST /api/v1/auth/site/register`에 기존 회사·담당자·현장 정보를 포함해 `email`, `password`, `confirmPassword`, `verificationToken`을 보냅니다. 인증 토큰은 브라우저 메모리에만 보관됩니다.

새 비밀번호는 프론트에서 **8자 이상**만 검사합니다. 문자 종류 제한(한글·공백·이모지 차단), 반복 문자열, 연속 문자, 흔한 비밀번호 검사는 적용하지 않습니다. 정책 코드는 `src/lib/passwordPolicy.ts`이고 회귀 테스트는 `npm test`로 실행합니다. 프론트 안내·검증만으로 서버 정책 적용 여부를 뜻하지 않습니다. 비밀번호 입력에는 기존 자물쇠 애니메이션을 사용합니다. 실제 CloudFront CORS 및 운영 API 동작은 이 저장소의 모의 브라우저 검증만으로 확인되지 않았습니다.

## 앱 팀 초대 및 연동 상태

현장관리자는 **현장 관리 → 팀 관리 → 앱 초대**에서 팀별 초대 링크를 발급합니다. 웹은 현장관리자 세션으로 `POST /api/v1/site/teams/{teamId}/invitations`를 본문 없이 요청하고, 응답의 `inviteUrl`을 표시·복사하거나 공유합니다. 팀원이 앱에서 초대를 수락하면 참여가 완료됩니다.

본사 관리자는 현장 상세의 **앱 연동 상태**에서 연결된 계정과 연결 여부를 조회합니다. 이때 본사 세션으로 `GET /api/v1/hq/sites/{siteId}/app-links`를 사용하며, 본사 화면에서는 초대 링크를 발급하지 않습니다.

## 로컬 백엔드 연동

개발 서버의 `/api` 요청은 `http://127.0.0.1:8000`으로 프록시됩니다. 로컬 백엔드와 프론트엔드를 각각 실행하세요.

### 백엔드

`heatguard-server` 저장소에서 PowerShell로 실행합니다.

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
$env:DB_PATH = "$PWD\data\heatguard.db"
$env:SILO_COMPANY_NAME = "HeatGuard local test"
.\.venv\Scripts\python.exe local_server.py
```

백엔드 저장소의 안내에 따라 본사 계정을 먼저 등록한 후 현장 계정을 생성하세요. 새 로컬 SQLite DB에는 기존 서비스의 현장 ID나 계정이 자동으로 복사되지 않습니다.

### 프론트엔드

이 저장소에서 별도 PowerShell 창으로 실행합니다.

```powershell
$env:VITE_DEMO_MODE = "false"
npm run dev -- --host 127.0.0.1
```

브라우저에서 `http://localhost:5173`으로 접속하고, 로그인한 다음 **현장 관리 → 시간 설정 → 기상청 수동 입력**에서 온도와 습도를 저장해 확인할 수 있습니다. 로컬 백엔드 응답을 데모 데이터로 대체하지 않도록 `VITE_DEMO_MODE=false`를 사용합니다.
