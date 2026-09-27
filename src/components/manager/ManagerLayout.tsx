import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import ThemeToggleButton from "../ui/ThemeToggleButton";

export default function ManagerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-[var(--color-bg-app)] flex h-screen w-full overflow-hidden relative">
      <Sidebar />
      <div className="flex-1 h-full overflow-y-auto">
        <div className="max-w-[1024px] w-full mx-auto p-8 flex flex-col items-center">
          {children}
        </div>
      </div>
      <ThemeToggleButton className="absolute right-4 top-4 z-40" />
    </div>
  );
}
