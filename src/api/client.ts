import { configureApiClient } from "../shared/api/client";

// 공통 API 클라이언트(shared) + 이 프로젝트 설정
export * from "../shared/api/client";

configureApiClient({ authPaths: ["/api/v1/auth/site/login", "/api/v1/auth/site/register"] });
