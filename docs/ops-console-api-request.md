# 운영자 콘솔 서버 API 요청서

웹(heatguard-client)에는 Figma `운영자 콘솔 (11/13)`의 화면이 모두 구현돼 있습니다.
아래 API는 아직 서버에 없어서, 지금은 해당 화면이 **"서버 준비 중"** 으로 보입니다. API가 배포되면 웹 수정 없이 바로 표시됩니다.

- 인증: `SUPPORT_OPERATOR` (기존 운영자 API와 동일, 세션 쿠키 또는 Bearer)
- 응답: 기존 `success / data / error / meta` 래퍼
- 목록: `limit` + `cursor`, 응답 `page.nextCursor` (기존 문의 목록과 동일)
- 시각: ISO 8601. 날짜 경계는 KST
- 개인정보: 담당자 이름·전화·IP는 **서버에서 마스킹**해서 주세요 (`김**`, `010-****-5678`, `211.36.*.*`)
- 웹이 "기능 없음"으로 판단하는 기준: **목록 API가 404/405** 일 때. 상세·변경 API의 404는 일반 오류로 표시합니다.

웹 코드 위치: `src/api/opsAdmin.ts`(호출), `src/lib/opsAdmin.ts`(응답 해석).

## 우선순위

| 순위 | 기능 | 화면 | API 수 | 비고 |
| --- | --- | --- | --- | --- |
| 1 | 회원 관리 | 03, 03-1 | 4 | 기존 company·site·record 데이터로 가능 |
| 2 | 활동 로그 | 05 | 1 | `login_event`(#76) 확장 + 기록 업로드·설정 변경·승인 이벤트 기록 필요 |
| 3 | 집계 일별 추이 | 02 | 1 | `login_event`로 가능 |
| 4 | 운영자 계정·설정 | 07 | 4 | 정책 저장소 신규 |
| 5 | 알림 | 상단 벨 | 2 | 알림 저장소 신규 |
| 6 | 가입 승인 | 01, 04 ~ 04-3 | 7 | **기획 결정 먼저** (아래 참고) |

---

## 1. 회원 관리 (Figma 03, 03-1)

### GET /api/v1/ops/companies

쿼리: `status`(ACTIVE·SUSPENDED·WITHDRAWN, 생략 시 전체), `q`(회사명·담당자·이메일·사업자번호), `joined`(7·30·90, 최근 N일 가입), `sort`(recentActivity·joinedAt·recordCount), `limit`, `cursor`

```json
{
  "items": [
    {
      "companyId": "cmp_1",
      "name": "한빛종합건설",
      "businessNumber": "567-89-01234",
      "managerName": "정**",
      "email": "hanbit@example.com",
      "joinedAt": "2026-07-25T09:12:00+09:00",
      "siteCount": 6,
      "recordCount": 1284,
      "lastActivityAt": "2026-11-24T08:50:00+09:00",
      "status": "ACTIVE"
    }
  ],
  "counts": { "all": 24, "active": 21, "suspended": 2, "withdrawn": 1 },
  "page": { "nextCursor": "..." }
}
```

- `counts`는 검색·필터와 무관한 전체 상태별 수 (탭 숫자)
- 독립 현장(`INDEPENDENT_SITE_MANAGER`) 포함 여부는 대시보드 요약과 같게 맞춰 주세요

### GET /api/v1/ops/companies/{companyId}

위 항목 + 아래 필드

```json
{
  "planName": "기본 요금제",
  "managerPhone": "010-****-1234",
  "managerTeam": "안전관리팀",
  "monthlyLogins": 312,
  "sites": [{ "siteId": "site_1", "name": "울산 석유화학 플랜트 증설", "recordCount": 1120, "health": "CAUTION" }],
  "recentActivities": [{ "message": "현장 기록 12건 업로드", "at": "2026-11-24T08:18:00+09:00" }]
}
```

- `health`: `NORMAL`(정상) · `CAUTION`(주의, 예: 위험 기록 있음) · `NO_INPUT`(미입력, 예: 오늘 기록 없음) — 기준은 서버에서 정해 주세요
- `monthlyLogins`: 이번 달 그 회사 관리자 성공 로그인 수

### POST /api/v1/ops/companies/{companyId}/suspend · /resume

- suspend 요청 `{ "reason": "이용료 미납" }` (필수, 300자)
- 정지 시 그 회사 관리자·작업자 로그인 차단, 기존 세션 만료. 기록은 보존
- 탈퇴(WITHDRAWN) 회사는 409

---

## 2. 활동 로그 (Figma 05)

### GET /api/v1/ops/activity-logs

쿼리: `type`(LOGIN·RECORD_UPLOAD·SETTINGS_CHANGE·APPROVAL, 생략 시 전체), `days`(1·7·30·90), `companyId`(선택), `limit`(기본 50), `cursor`

```json
{
  "items": [
    {
      "logId": "log_1",
      "type": "LOGIN",
      "result": "FAILURE",
      "action": null,
      "companyId": "cmp_2",
      "companyName": "경기토건",
      "actorName": "서**",
      "message": "비밀번호 5회 오류 · 계정 잠금",
      "ip": "121.134.*.*",
      "at": "2026-11-24T09:41:00+09:00"
    }
  ],
  "page": { "nextCursor": "..." }
}
```

- 최신순. `result`: SUCCESS·FAILURE (LOGIN에서 실패 표시), `action`: APPROVE·REJECT (APPROVAL에서 반려 표시)
- #76의 `login_event`는 성공 로그인만 저장합니다. **실패 로그인·기록 업로드·설정 변경·승인/반려도 기록**해야 이 화면이 채워집니다
- 운영자 행동(승인·반려·정지)은 `actorName`에 운영자 이름

---

## 3. 집계 일별 추이 (Figma 02)

### GET /api/v1/ops/dashboard/access/daily?days=7

```json
{
  "uniqueVisitors": 41,
  "items": [{ "date": "2026-11-24", "hq": 4, "site": 6, "visitors": 10 }]
}
```

- `days`: 7·30·90. 기간의 **모든 날짜**를 0 포함해서 주세요 (KST 날짜, `YYYY-MM-DD`)
- `visitors`: 그날 성공 로그인한 서로 다른 관리자 수, `uniqueVisitors`: 기간 전체의 서로 다른 관리자 수
- `hq`·`site`: 그날 성공 로그인 횟수

---

## 4. 시스템 설정 (Figma 07)

### GET · PUT /api/v1/ops/settings

```json
{
  "version": 3,
  "signupPolicy": { "autoApprove": false, "depositDueDays": 7, "autoRejectAfterDays": 14 },
  "notifications": {
    "newSignup": { "enabled": true, "channels": ["EMAIL", "APP"] },
    "newInquiry": { "enabled": true, "channels": ["EMAIL"] },
    "depositDueSoon": { "enabled": true, "channels": ["EMAIL"] },
    "accountLocked": { "enabled": false, "channels": ["EMAIL"] }
  }
}
```

- PUT은 같은 모양을 보내고 저장된 값을 돌려줍니다. `version`이 다르면 **409** (다른 운영자가 먼저 저장)
- 선택지: `depositDueDays` 3·7·14, `autoRejectAfterDays` 7·14·30
- `signupPolicy`는 6번 가입 승인 기능이 생겨야 실제로 동작합니다

### GET /api/v1/ops/operators

```json
{ "items": [{ "userId": "usr_ops_1", "name": "김운영", "email": "ops@example.com", "role": "OWNER", "lastLoginAt": "...", "isMe": true }] }
```

- `role`: OWNER(최고 관리자) · OPERATOR(운영자)

### POST /api/v1/ops/operators/invitations

- 요청 `{ "name": "이지원", "email": "support@example.com" }` → 초대 메일 발송, 링크에서 비밀번호 설정 후 운영자 계정 생성
- 이미 있는 이메일 409, OWNER만 초대 가능하면 403

---

## 5. 알림 (상단 벨)

### GET /api/v1/ops/notifications?limit=20

```json
{
  "items": [{ "notificationId": "ntf_1", "message": "새 가입 신청 · 대한건설", "at": "...", "link": "/ops/signups", "read": false }],
  "unreadCount": 1
}
```

- `link`는 콘솔 안 경로(`/ops/...`)만. 웹은 다른 주소는 무시합니다
- 알림 종류는 4번 `notifications` 설정을 따름

### POST /api/v1/ops/notifications/read

- 벨을 열면 호출 → 현재 운영자의 알림 모두 읽음 처리

---

## 6. 가입 승인 (Figma 01 최근 가입 신청, 04, 04-1, 04-2, 04-3)

> **먼저 정해야 할 것** — 지금은 이메일 인증 후 바로 가입되는 구조라 승인 절차가 없습니다.
> 1) 승인 전 계정의 로그인을 막을지 2) 입금(요금) 단계를 실제로 운영할지·요금제와 금액 3) 반려 후 재신청 허용 여부 4) 사업자 진위 확인(국세청 API) 연동 여부

상태: `PENDING_APPROVAL`(승인 대기) → `PENDING_DEPOSIT`(입금 대기) → `ACTIVE`(이용 중), 또는 `REJECTED`(반려)

### GET /api/v1/ops/signup-requests

쿼리: `status`(생략 시 전체·최신순 — 대시보드용), `q`, `requested`(7·30), `document`(submitted·missing), `sort`(oldest·newest·depositDue·approvedAt), `limit`, `cursor`

```json
{
  "items": [
    {
      "requestId": "sreq_1",
      "companyName": "대한건설",
      "businessNumber": "123-45-67890",
      "managerName": "김**",
      "managerPhone": "010-****-5678",
      "email": "dh@example.com",
      "requestedAt": "2026-11-24T14:32:00+09:00",
      "approvedAt": null,
      "siteCount": 17,
      "status": "PENDING_APPROVAL",
      "documents": [{ "documentId": "doc_1", "name": "사업자등록증_대한건설.pdf", "contentType": "application/pdf", "size": 1258291, "url": "https://..." }],
      "plan": { "name": "기본", "monthlyFee": 99000 },
      "depositDueAt": null,
      "depositStatus": "PENDING"
    }
  ],
  "counts": { "pendingApproval": 3, "pendingDeposit": 2, "active": 12, "rejected": 2, "newToday": 3 },
  "page": { "nextCursor": "..." }
}
```

- `documents[].url`: 짧은 만료 시간의 서명 URL (미리보기용)
- `depositStatus`: PENDING · OVERDUE (기한 지남)
- `counts`는 사이드바 "가입 승인" 배지와 대시보드 처리 필요 배너에도 씁니다

### GET /api/v1/ops/signup-requests/{requestId}

목록 항목 + `representative`(대표자), `industry`(업종), `address`, `managerTeam`, `businessVerified`(국세청 확인 여부), `emailVerified`, `memo`(내부 메모)

### 처리

| 요청 | 본문 | 결과 |
| --- | --- | --- |
| `POST /{id}/approve` | `{ "memo"?: "..." }` | PENDING_APPROVAL → PENDING_DEPOSIT, 입금 안내 메일 발송 |
| `POST /{id}/reject` | `{ "reasonCode": "BUSINESS_MISMATCH", "reason": "...", "allowReapply": true }` | → REJECTED, 반려 사유 메일 (재신청 링크 선택) |
| `POST /{id}/confirm-deposit` | - | PENDING_DEPOSIT → ACTIVE, 계정 활성화·안내 메일 |
| `DELETE /{id}/confirm-deposit` | - | 입금 확인 되돌리기 (웹은 확인 후 10초 동안 버튼 표시) |
| `POST /{id}/deposit-reminder` | - | 입금 안내 재발송 |
| `PUT /{id}/memo` | `{ "memo": "..." }` | 내부 메모 저장 (1000자) |

- `reasonCode`: BUSINESS_MISMATCH(사업자 정보 불일치) · DOCUMENT_MISSING(서류 누락·식별 불가) · DUPLICATE(중복 신청) · OTHER, `reason` 300자
- 상태가 맞지 않으면 409 (예: 이미 승인된 신청을 다시 승인)
- 여러 건 선택 승인·반려는 웹이 건별로 호출합니다 (일괄 API 불필요)

---

## 기존 API 보완

- **대시보드 요약** `GET /ops/dashboard/summary`: 가입 승인이 생기면 처리 필요 배너는 위 `signup-requests` 의 `counts`를 씁니다. 요약 API는 그대로 두셔도 됩니다
- **배포**: `terraform-cd`가 11월 11일부터 AWS 로그인(OIDC) 실패로 계속 실패 중입니다. #76 대시보드 API도 운영 서버에 아직 없습니다 (404)
