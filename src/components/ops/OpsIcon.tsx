import bell from "../../assets/ops/bell.svg";
import ban from "../../assets/ops/ban.svg";
import card from "../../assets/ops/card.svg";
import check from "../../assets/ops/check.svg";
import chevLeft from "../../assets/ops/chev-left.svg";
import clock from "../../assets/ops/clock.svg";
import close from "../../assets/ops/close.svg";
import download from "../../assets/ops/download.svg";
import eye from "../../assets/ops/eye.svg";
import info from "../../assets/ops/info.svg";
import mail from "../../assets/ops/mail.svg";
import more from "../../assets/ops/more.svg";
import search from "../../assets/ops/search.svg";
import send from "../../assets/ops/send.svg";
import shield from "../../assets/ops/shield.svg";
import sort from "../../assets/ops/sort.svg";
import activity from "../../assets/ops/activity.svg";
import alert from "../../assets/ops/alert.svg";
import building from "../../assets/ops/building.svg";
import calendar from "../../assets/ops/calendar.svg";
import chart from "../../assets/ops/chart.svg";
import chevDown from "../../assets/ops/chev-down.svg";
import chevRight from "../../assets/ops/chev-right.svg";
import file from "../../assets/ops/file.svg";
import home from "../../assets/ops/home.svg";
import logout from "../../assets/ops/logout.svg";
import mapPin from "../../assets/ops/map-pin.svg";
import message from "../../assets/ops/message.svg";
import pie from "../../assets/ops/pie.svg";
import settings from "../../assets/ops/settings.svg";
import upload from "../../assets/ops/upload.svg";
import user from "../../assets/ops/user.svg";
import userCheck from "../../assets/ops/user-check.svg";
import users from "../../assets/ops/users.svg";

/*
 * Figma 운영자 콘솔 아이콘 (src/assets/ops, Figma에서 받은 원본 그대로).
 * 원본은 색이 고정돼 있어, 모양만 마스크로 쓰고 색은 글자색(currentColor)을 따른다.
 * 활성 메뉴·다크 모드에서도 같은 파일을 쓰기 위해서다.
 */
const ICONS = {
  activity, alert, building, calendar, chart, chevDown, chevRight, file, home, logout,
  mapPin, message, pie, settings, upload, user, userCheck, users,
  bell, ban, card, check, chevLeft, clock, close, download, eye, info, mail, more, search, send, shield, sort,
} as const;

export type OpsIconName = keyof typeof ICONS;

export default function OpsIcon({ name, size = 16, className = "" }: { name: OpsIconName; size?: number; className?: string }) {
  const url = `url("${ICONS[name]}")`;
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 bg-current ${className}`}
      style={{
        width: size,
        height: size,
        maskImage: url,
        WebkitMaskImage: url,
        maskSize: "100% 100%",
        WebkitMaskSize: "100% 100%",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
      }}
    />
  );
}
