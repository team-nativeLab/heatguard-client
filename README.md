# heatguard-client

## 회원가입 이메일 인증

본사·현장관리자 가입의 비밀번호 설정 화면에서 이메일 인증코드를 발송하고 입력합니다. 공통 `POST /api/v1/auth/email-codes`의 `{ email }` 요청으로 발송하며 응답의 `expiresAt`을 기준으로 남은 시간을 표시합니다. 재발송 간격은 60초입니다.

기존 `/api/v1/auth/hq/register`·`/api/v1/auth/site/register`에 `verificationCode`를 함께 전달합니다. 별도 코드 확인 API는 없고, 가입 성공 응답으로 인증을 확인합니다. 이메일을 바꾸면 입력한 코드와 발송 상태를 초기화합니다.

이 프론트 변경을 사용하려면 서버에 공통 인증코드 API와 관리자 가입의 `verificationCode` 검증이 배포되어 있어야 합니다. 실제 이메일 수신에는 서버 SMTP 설정이 필요합니다. 프론트 검증은 브라우저의 테스트 응답으로 수행하며 실제 발송을 대체하지 않습니다.

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
