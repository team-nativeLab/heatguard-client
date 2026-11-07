import { HEAT_LABEL, HEAT_TONE, type HqSite } from "../api/hq";

export const tempText = (n: number | null | undefined) => (n == null ? "" : `${n.toFixed(1)}°C`);

export const doneText = (done: number | null, total: number | null) =>
  done == null || total == null ? "-" : `${done}/${total} 완료`;

export const heatLabel = (site: Pick<HqSite, "heatLevel">) => site.heatLevel == null ? "미측정" : HEAT_LABEL[site.heatLevel];
export const heatTone = (site: Pick<HqSite, "heatLevel">) => site.heatLevel == null ? "none" : HEAT_TONE[site.heatLevel];

/** 위험도 3→2→1→0→미측정 순. 같은 위험도에서는 긴급 호출 현장 우선. */
export function sortByRisk(sites: HqSite[]) {
  return [...sites].sort((a, b) => {
    const risk = (b.heatLevel ?? -1) - (a.heatLevel ?? -1);
    if (risk !== 0) return risk;
    const emergency = Number(b.emergency) - Number(a.emergency);
    if (emergency !== 0) return emergency;
    return (b.temperature ?? -1) - (a.temperature ?? -1);
  });
}
