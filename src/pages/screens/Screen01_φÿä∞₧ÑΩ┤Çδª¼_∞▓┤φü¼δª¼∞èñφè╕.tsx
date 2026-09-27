import { useEffect, useRef, useState } from "react";
import HomeLayout from "../../components/home/HomeLayout";
import HomeDashboard from "../../components/home/HomeDashboard";
import EmergencyModal, { type EmergencyStatus } from "../../components/manager/EmergencyModal";
import { useToast } from "../../components/ui/Toast";
import { alertsApi, type EmergencyCall } from "../../api";

const ALERT_POLL_INTERVAL_MS = 5000;

export default function Screen01_현장관리_체크리스트() {
  const { showToast } = useToast();
  const [modalStatus, setModalStatus] = useState<EmergencyStatus | null>(null);
  const [activeAlert, setActiveAlert] = useState<EmergencyCall | undefined>(undefined);
  const modalOpenRef = useRef(false);
  modalOpenRef.current = modalStatus !== null;

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const res = await alertsApi.getActiveEmergencyCalls();
        if (!alive) return;
        const call = res.items[0];
        if (call && call.status === "ACTIVE" && !modalOpenRef.current) {
          setActiveAlert(call);
          setModalStatus("dispatching");
        }
      } catch {

      }
    };
    const id = window.setInterval(poll, ALERT_POLL_INTERVAL_MS);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  const handleConfirm = async () => {
    setModalStatus("confirmed");
    if (activeAlert) {
      try {
        await alertsApi.acknowledgeEmergencyCall(activeAlert.callId);
      } catch (err) {
        console.warn("긴급호출 확인 처리 실패", err);
      }
    }
  };

  const handleClose = () => {
    setModalStatus(null);
    setActiveAlert(undefined);
  };

  return (
    <div className="relative w-full h-full">
      <HomeLayout>
        <HomeDashboard
          onEmergencyTest={() => {
            setActiveAlert(undefined);
            setModalStatus("test");
          }}
        />
      </HomeLayout>
      {modalStatus && (
        <EmergencyModal
          status={modalStatus}
          info={activeAlert}
          onConfirm={handleConfirm}
          onLocate={() => showToast("현장 위치 지도를 엽니다.")}
          onDispatch={() => showToast("긴급 출동 요청을 접수했어요.", "success")}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
