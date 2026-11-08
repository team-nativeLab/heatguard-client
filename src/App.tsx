import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState, type ReactNode } from "react";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import RoleSelectPage from "./pages/RoleSelectPage";
import DashboardPage from "./pages/DashboardPage";
import SiteTodayPage from "./pages/site/SiteTodayPage";
import SiteTeamsPage from "./pages/site/SiteTeamsPage";
import SiteChecklistPage from "./pages/site/SiteChecklistPage";
import SiteSettingsPage from "./pages/site/SiteSettingsPage";
import SiteWithdrawnPage from "./pages/site/SiteWithdrawnPage";
import AccountPage from "./pages/AccountPage";
import ContactPage from "./pages/ContactPage";
import PrintSummaryPage from "./pages/PrintSummaryPage";
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
import UnassignedSiteManagerPage from "./pages/site/UnassignedSiteManagerPage";
import RequireAuth from "./shared/auth/RequireAuth";
import { authApi, hqApi } from "./api";

// 로그인해야 볼 수 있는 화면
function SiteMembershipGate({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [membership, setMembership] = useState<"loading" | "joined" | "unassigned" | "error">("loading");

  useEffect(() => {
    let active = true;
    authApi.me().then((user) => {
      if (active) setMembership(user.membershipStatus === "UNASSIGNED" ? "unassigned" : "joined");
    }).catch(() => {
      if (active) setMembership("error");
    });
    return () => { active = false; };
  }, [location.pathname]);

  if (membership === "loading") {
    return <div role="status" aria-label="현장 연결 상태 확인 중" className="flex min-h-screen items-center justify-center"><span className="size-6 animate-spin rounded-full border-2 border-gray-200 border-t-blue-500" /></div>;
  }
  if (membership === "error") {
    return <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center"><p className="text-base font-semibold">현장 연결 상태를 확인할 수 없어요</p><button type="button" onClick={() => window.location.reload()} className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white">다시 시도</button></div>;
  }

  const onUnassignedPage = location.pathname === "/manager/unassigned";
  if (membership === "unassigned" && !onUnassignedPage) return <Navigate to={`/manager/unassigned${location.search}`} replace />;
  if (membership === "joined" && onUnassignedPage) return <Navigate to="/manager" replace />;
  return <>{children}</>;
}

// 로그인해야 볼 수 있는 화면
function Protected({ children, siteSelection = false }: { children: ReactNode; siteSelection?: boolean }) {
  return (
    <RequireAuth check={authApi.me} loginPath="/auth/login">
      <SiteMembershipGate>
        {siteSelection ? children : <SiteScopeGuard>{children}</SiteScopeGuard>}
      </SiteMembershipGate>
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
        {/* 회원가입 유형을 선택하고 본사 또는 현장 관리자 가입으로 이동한다. */}
        <Route path="/" element={<Navigate to="/auth/login" replace />} />
        <Route path="/auth/select" element={<Navigate to="/auth/login" replace />} />
        <Route path="/auth/select/signup" element={<RoleSelectPage mode="signup" />} />

        {/* 현장 관리자 */}
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/signup" element={<SignupPage />} />
        <Route path="/site-invitation" element={<SiteInvitationPage />} />
        <Route path="/auth/site/invitation" element={<SiteInvitationPage />} />
        <Route path="/manager" element={<Protected><DashboardPage /></Protected>} />
        <Route path="/manager/select-site" element={<Protected siteSelection><SiteSelectionPage /></Protected>} />
        <Route path="/manager/sites" element={<Protected><SiteTodayPage /></Protected>} />
        <Route path="/manager/sites/team" element={<Protected><SiteTeamsPage /></Protected>} />
        <Route path="/manager/sites/checklist" element={<Protected><SiteChecklistPage /></Protected>} />
        <Route path="/manager/sites/schedule" element={<Protected><SiteSettingsPage /></Protected>} />
        <Route path="/manager/sites/withdrawn" element={<Protected><SiteWithdrawnPage /></Protected>} />
        <Route path="/manager/unassigned" element={<Protected siteSelection><UnassignedSiteManagerPage /></Protected>} />
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
