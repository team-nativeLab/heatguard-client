import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "../../shared/ui/Toast";
import { clearSiteMeCache } from "../../hooks/useSiteMe";
import { markSignedOut } from "../../shared/auth/RequireAuth";
import { UNAUTHORIZED_EVENT } from "../../api";

/** API가 401을 돌려주면 로그인 화면으로 보낸다. */
export default function SessionGuard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const pathRef = useRef(location.pathname);
  pathRef.current = location.pathname;

  useEffect(() => {
    const handler = () => {
      if (pathRef.current.startsWith("/auth") || pathRef.current === "/") return;
      clearSiteMeCache();
      markSignedOut();
      showToast("로그인이 만료됐어요. 다시 로그인해주세요.", "error");
      navigate("/auth/login", { replace: true });
    };
    window.addEventListener(UNAUTHORIZED_EVENT, handler);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handler);
  }, [navigate, showToast]);

  return null;
}
