import type { ReactNode } from "react";
import HomeSidebar from "./HomeSidebar";

export default function HomeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-[var(--home-main-bg)] flex h-screen w-full overflow-hidden">
      <HomeSidebar />
      <div className="flex-1 h-full overflow-y-auto">
        <div className="max-w-[1600px] w-full mx-auto p-8 flex flex-col items-center">{children}</div>
      </div>
    </div>
  );
}
