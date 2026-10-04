# heatguard-client

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
