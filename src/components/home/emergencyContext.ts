import { createContext, useContext } from "react";

export interface EmergencyContextValue {
  /** 실제 호출 없이 긴급 호출 팝업을 띄워 본다. */
  openTest: () => void;
}

export const EmergencyContext = createContext<EmergencyContextValue>({ openTest: () => {} });

export function useEmergency() {
  return useContext(EmergencyContext);
}
