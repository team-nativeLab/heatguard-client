import { useState } from "react";
import ManagerLayout from "../../components/manager/ManagerLayout";
import DashboardOverview from "../../components/manager/DashboardOverview";
import EmergencyModal, { type EmergencyStatus } from "../../components/manager/EmergencyModal";
import { useToast } from "../../components/ui/Toast";

export default function Screen02_대시보드_확인모달() {
  const { showToast } = useToast();
  const [modalStatus, setModalStatus] = useState<EmergencyStatus | null>(null);

  return (
    <div className="relative w-full h-full">
      <ManagerLayout>
        <DashboardOverview onEmergencyTest={() => setModalStatus("dispatching")} />
      </ManagerLayout>
      {modalStatus && (
        <EmergencyModal
          status={modalStatus}
          onConfirm={() => setModalStatus("confirmed")}
          onLocate={() => showToast("현장 위치 지도를 엽니다.")}
          onDispatch={() => showToast("긴급 출동 요청을 접수했어요.", "success")}
          onClose={() => setModalStatus(null)}
        />
      )}
    </div>
  );
}
