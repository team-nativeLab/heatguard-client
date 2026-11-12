import { configureApiClient } from "../shared/api/client";

// 공통 API 클라이언트(shared) + 이 프로젝트 설정
export * from "../shared/api/client";

configureApiClient({ authPaths: [
    "/api/v1/auth/email-codes",
    "/api/v1/auth/email-codes/verify",
    "/api/v1/auth/site/register-unassigned",
    "/api/v1/auth/team/email-codes",
    "/api/v1/auth/team/email-codes/verify",
    "/api/v1/auth/site/login",
    "/api/v1/auth/site/register",
    "/api/v1/auth/site/sites",
    "/api/v1/auth/site/invitations/accept",
    "/api/v1/auth/site/company-invitations/accept",
    "/api/v1/auth/admin/login",
    "/api/v1/auth/hq/login",
    "/api/v1/auth/hq/register",
  ] });
