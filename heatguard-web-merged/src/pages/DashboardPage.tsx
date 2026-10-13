import HomeLayout from "../components/home/HomeLayout";
import HomeDashboard from "../components/home/HomeDashboard";

// 긴급 호출 감시·팝업은 HomeLayout(EmergencyWatcher)이 모든 관리자 화면에서 처리한다.
export default function DashboardPage() {
  return (
    <HomeLayout>
      <HomeDashboard />
    </HomeLayout>
  );
}
