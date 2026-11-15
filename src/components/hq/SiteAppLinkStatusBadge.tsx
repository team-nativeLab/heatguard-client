import { useEffect, useState } from "react";
import { hqApi } from "../../api";

/**
 * 현장의 앱 연동 여부만 배지로 보여준다.
 * 초대 링크 발급은 현장관리자 화면에서 하므로 본사에서는 상태만 확인한다.
 */
export default function SiteAppLinkStatusBadge({ siteId }: { siteId: string }) {
  const [state, setState] = useState<"loading" | "linked" | "unlinked" | "error">("loading");

  useEffect(() => {
    let alive = true;
    setState("loading");
    hqApi.getSiteAppLinks(siteId).then((data) => {
      if (!alive) return;
      const linked = data?.status === "LINKED" || (data?.items ?? []).some((item) => item.status === "LINKED");
      setState(linked ? "linked" : "unlinked");
    }).catch(() => {
      if (alive) setState("error");
    });
    return () => { alive = false; };
  }, [siteId]);

  if (state === "loading" || state === "error") return null;

  const linked = state === "linked";
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        linked ? "bg-emerald-100 text-emerald-700" : "bg-[var(--color-bg-tile)] text-[var(--color-text-label)]"
      }`}
    >
      {linked ? "연동됨" : "미연동"}
    </span>
  );
}
