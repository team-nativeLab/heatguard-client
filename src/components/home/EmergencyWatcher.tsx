import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import EmergencyModal, { type EmergencyStatus } from "../manager/EmergencyModal";
import { useToast } from "../../shared/ui/Toast";
import { usePolling } from "../../shared/hooks/usePolling";
import { notifyEmergency, primeEmergencyAlerts } from "../../shared/hooks/emergencyAlert";
import { useSiteMe } from "../../hooks/useSiteMe";
import { alertsApi, isNetworkError, errorMessage, type EmergencyCall } from "../../api";

const ALERT_POLL_INTERVAL_MS = 5000;
const ALERT_HIDDEN_POLL_INTERVAL_MS = 15000;

interface EmergencyContextValue {
  /** 실제 호출 없이 긴급 호출 팝업을 띄워 본다. */
  openTest: () => void;
}

const EmergencyContext = createContext<EmergencyContextValue>({ openTest: () => {} });

export function useEmergency() {
  return useContext(EmergencyContext);
}

/** 관리자 화면 어디에 있든 활성 긴급 호출을 감시하고 팝업을 띄운다. */
export function EmergencyWatcher({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  const me = useSiteMe();
  const [status, setStatus] = useState<EmergencyStatus | null>(null);
  const [call, setCall] = useState<EmergencyCall | undefined>(undefined);
  const [confirming, setConfirming] = useState(false);
  // 이번 세션에서 이미 닫은 호출은 다시 띄우지 않는다.
  const dismissedRef = useRef(new Set<string>());
  // 알림·경고음은 호출당 한 번만
  const notifiedRef = useRef(new Set<string>());
  const openRef = useRef(false);
  useEffect(() => {
    openRef.current = status !== null;
  }, [status]);

  // 첫 클릭 때 알림 권한을 묻고 경고음을 준비한다.
  useEffect(() => primeEmergencyAlerts(), []);

  // 긴급호출은 탭이 가려져 있어도 알림을 보내야 하므로 느린 주기로 계속 확인한다.
  usePolling(
    async () => {
      try {
        const res = await alertsApi.getActiveEmergencyCalls();
        const active = res.items.filter((c) => c.status === "ACTIVE");
        for (const c of active) {
          if (notifiedRef.current.has(c.callId)) continue;
          notifiedRef.current.add(c.callId);
          notifyEmergency({
            title: "긴급 호출이 발생했습니다",
            body: `${c.teamName} · 즉시 현장을 확인해주세요.`,
            tag: `emergency-${c.callId}`,
          });
        }
        if (openRef.current) return;
        const next = active.find((c) => !dismissedRef.current.has(c.callId));
        if (next) {
          setCall(next);
          setStatus("dispatching");
        }
      } catch {
        // 서버 미연결 시에는 조용히 다음 주기에 다시 시도한다.
      }
    },
    ALERT_POLL_INTERVAL_MS,
    ALERT_HIDDEN_POLL_INTERVAL_MS,
  );

  const openTest = useCallback(() => {
    setCall(undefined);
    setStatus("test");
  }, []);

  const close = () => {
    if (call) dismissedRef.current.add(call.callId);
    setStatus(null);
    setCall(undefined);
  };

  const confirm = async () => {
    if (!call) {
      setStatus("confirmed");
      return;
    }
    setConfirming(true);
    try {
      await alertsApi.acknowledgeEmergencyCall(call.callId);
      setStatus("confirmed");
      showToast(`${call.teamName}에 확인 알림을 보냈어요.`, "success");
    } catch (err) {
      if (isNetworkError(err)) {
        showToast("서버에 연결할 수 없어 확인 처리를 하지 못했어요.", "error");
      } else {
        showToast(errorMessage(err, "확인 처리에 실패했어요."), "error");
      }
    } finally {
      setConfirming(false);
    }
  };

  const locate = () => {
    const query = encodeURIComponent(me.site.name);
    window.open(`https://map.kakao.com/?q=${query}`, "_blank", "noopener,noreferrer");
  };

  return (
    <EmergencyContext.Provider value={{ openTest }}>
      {children}
      {status && (
        <EmergencyModal
          status={status}
          info={call}
          confirming={confirming}
          onConfirm={confirm}
          onLocate={locate}
          onDispatch={() => showToast("테스트 모드라 실제 출동 요청은 보내지 않았어요.")}
          onClose={close}
        />
      )}
    </EmergencyContext.Provider>
  );
}
