import { HEAT_LABEL, HEAT_TONE, type HqSite } from "../api/hq";

export const tempText = (n: number | null | undefined) => (n == null ? "" : `${n.toFixed(1)}°C`);

export const doneText = (done: number | null, total: number | null) =>
  done == null || total == null ? "-" : `${done}/${total} 완료`;

export const heatLabel = (site: Pick<HqSite, "heatLevel">) => HEAT_LABEL[site.heatLevel];
export const heatTone = (site: Pick<HqSite, "heatLevel">) => HEAT_TONE[site.heatLevel];

/** 위험도 높은 순 → 온도 높은 순 */
export function sortByRisk(sites: HqSite[]) {
  return [...sites].sort((a, b) => b.heatLevel - a.heatLevel || (b.temperature ?? -1) - (a.temperature ?? -1));
}
