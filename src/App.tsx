import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import SiteTodayPage from "./pages/site/SiteTodayPage";
import SiteTeamsPage from "./pages/site/SiteTeamsPage";
import SiteChecklistPage from "./pages/site/SiteChecklistPage";
import SiteSettingsPage from "./pages/site/SiteSettingsPage";
import SiteWithdrawnPage from "./pages/site/SiteWithdrawnPage";
import AccountPage from "./pages/AccountPage";
import ContactPage from "./pages/ContactPage";
import PrintSummaryPage from "./pages/PrintSummaryPage";
import RoleSelectPage from "./pages/RoleSelectPage";
import ScreenHQLogin from "./pages/hq/ScreenHQLogin";
import ScreenHQSignup from "./pages/hq/ScreenHQSignup";
import ScreenHQDashboard from "./pages/hq/ScreenHQDashboard";
import ScreenHQSites from "./pages/hq/ScreenHQSites";
import ScreenHQSiteDetail from "./pages/hq/ScreenHQSiteDetail";
import ScreenHQRecords from "./pages/hq/ScreenHQRecords";
import ScreenHQAccount from "./pages/hq/ScreenHQAccount";
import ScreenHQContact from "./pages/hq/ScreenHQContact";
import SessionGuard from "./components/auth/SessionGuard";
import SiteScopeGuard from "./components/auth/SiteScopeGuard";
import SiteSelectionPage from "./pages/site/SiteSelectionPage";
import SiteInvitationPage from "./pages/site/SiteInvitationPage";
import RequireAuth from "./shared/auth/RequireAuth";
import { authApi, hqApi } from "./api";
import type { ReactNode } from "react";

// 로그인해야 볼 수 있는 화면
function Protected({ children, siteSelection = false }: { children: ReactNode; siteSelection?: boolean }) {
  return (
    <RequireAuth check={authApi.me} loginPath="/auth/login">
      {siteSelection ? children : <SiteScopeGuard>{children}</SiteScopeGuard>}
    </RequireAuth>
  );
}

// 본사 관리자 전용 화면 (현장 세션과 별도로 확인한다)
function ProtectedHq({ children }: { children: ReactNode }) {
  return (
    <RequireAuth check={hqApi.me} loginPath="/hq/login" scope="hq">
      {children}
    </RequireAuth>
  );
}

export default function App() {
  return (
    <>
      <SessionGuard />
      <Routes>
        {/* 첫 화면: 스플래시 → 소속 선택. 이후 각 로그인/회원가입은 스플래시 없이 이동 */}
        <Route path="/" element={<Navigate to="/auth/login" replace />} />
        <Route path="/auth/select" element={<Navigate to="/auth/login" replace />} />
        <Route path="/auth/select/signup" element={<RoleSelectPage mode="signup" />} />

        {/* 현장 관리자 */}
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/signup" element={<Navigate to="/site-invitation" replace />} />
        <Route path="/site-invitation" element={<SiteInvitationPage />} />
        <Route path="/auth/site/invitation" element={<SiteInvitationPage />} />
        <Route path="/manager" element={<Protected><DashboardPage /></Protected>} />
        <Route path="/manager/select-site" element={<Protected siteSelection><SiteSelectionPage /></Protected>} />
        <Route path="/manager/sites" element={<Protected><SiteTodayPage /></Protected>} />
        <Route path="/manager/sites/team" element={<Protected><SiteTeamsPage /></Protected>} />
        <Route path="/manager/sites/checklist" element={<Protected><SiteChecklistPage /></Protected>} />
        <Route path="/manager/sites/schedule" element={<Protected><SiteSettingsPage /></Protected>} />
        <Route path="/manager/sites/withdrawn" element={<Protected><SiteWithdrawnPage /></Protected>} />
        <Route path="/manager/account" element={<Protected><AccountPage /></Protected>} />
        <Route path="/manager/contact" element={<Protected><ContactPage /></Protected>} />
        <Route path="/manager/print" element={<Protected><PrintSummaryPage /></Protected>} />

        {/* 본사 관리자 */}
        <Route path="/hq/login" element={<ScreenHQLogin />} />
        <Route path="/hq/signup" element={<ScreenHQSignup />} />
        <Route path="/hq/signup/validation" element={<ScreenHQSignup validation />} />
        <Route path="/hq/dashboard" element={<ProtectedHq><ScreenHQDashboard /></ProtectedHq>} />
        <Route path="/hq/sites" element={<ProtectedHq><ScreenHQSites /></ProtectedHq>} />
        <Route path="/hq/sites/:siteId" element={<ProtectedHq><ScreenHQSiteDetail /></ProtectedHq>} />
        <Route path="/hq/records" element={<ProtectedHq><ScreenHQRecords /></ProtectedHq>} />
        <Route path="/hq/account" element={<ProtectedHq><ScreenHQAccount /></ProtectedHq>} />
        <Route path="/hq/contact" element={<ProtectedHq><ScreenHQContact /></ProtectedHq>} />

        <Route path="*" element={<Navigate to="/auth/login" replace />} />
      </Routes>
    </>
  );
}

