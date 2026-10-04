import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import SiteTodayPage from "./pages/site/SiteTodayPage";
import SiteTeamsPage from "./pages/site/SiteTeamsPage";
import SiteChecklistPage from "./pages/site/SiteChecklistPage";
import SiteSettingsPage from "./pages/site/SiteSettingsPage";
import SiteWithdrawnPage from "./pages/site/SiteWithdrawnPage";
import AccountPage from "./pages/AccountPage";
import ContactPage from "./pages/ContactPage";
import PrintSummaryPage from "./pages/PrintSummaryPage";
import SessionGuard from "./components/auth/SessionGuard";
import RequireAuth from "./shared/auth/RequireAuth";
import { authApi } from "./api";
import type { ReactNode } from "react";

// 로그인해야 볼 수 있는 화면
function Protected({ children }: { children: ReactNode }) {
  return (
    <RequireAuth check={authApi.me} loginPath="/auth/login">
      {children}
    </RequireAuth>
  );
}

export default function App() {
  return (
    <>
      <SessionGuard />
      <Routes>
        <Route path="/" element={<Navigate to="/auth/login" replace />} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/signup" element={<SignupPage />} />
        <Route path="/manager" element={<Protected><DashboardPage /></Protected>} />
        <Route path="/manager/sites" element={<Protected><SiteTodayPage /></Protected>} />
        <Route path="/manager/sites/team" element={<Protected><SiteTeamsPage /></Protected>} />
        <Route path="/manager/sites/checklist" element={<Protected><SiteChecklistPage /></Protected>} />
        <Route path="/manager/sites/schedule" element={<Protected><SiteSettingsPage /></Protected>} />
        <Route path="/manager/sites/withdrawn" element={<Protected><SiteWithdrawnPage /></Protected>} />
        <Route path="/manager/account" element={<Protected><AccountPage /></Protected>} />
        <Route path="/manager/contact" element={<Protected><ContactPage /></Protected>} />
        <Route path="/manager/print" element={<Protected><PrintSummaryPage /></Protected>} />
        <Route path="*" element={<Navigate to="/auth/login" replace />} />
      </Routes>
    </>
  );
}
