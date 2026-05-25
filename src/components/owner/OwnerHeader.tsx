"use client";

import { usePathname } from "next/navigation";
import MobileSidebar from "@/components/layout/MobileSidebar";
import NotificationBell from "@/components/layout/NotificationBell";

export default function OwnerHeader() {
  const pathname = usePathname();

  const getPageTitle = (path: string) => {
    if (path === "/owner" || path === "/owner/dashboard") return "Dashboard Overview";
    if (path === "/owner/inventory") return "Inventory Directory";
    if (path === "/owner/reports") return "Daily Operations Report";
    if (path === "/owner/purchases") return "Purchase Management";
    if (path === "/owner/analytics") return "Executive Analytics";
    if (path === "/owner/settings") return "Owner Settings";
    return "Owner Portal";
  };

  const title = getPageTitle(pathname);

  return (
    <>
      {/* Mobile Topbar */}
      <MobileSidebar title={title} role="owner" />

      {/* Desktop/Header Topbar - Hidden on mobile, visible on lg+ */}
      <header className="hidden lg:flex h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md px-6 items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex flex-col min-w-0">
            <h2 className="text-sm font-extrabold text-zinc-800 dark:text-zinc-100 tracking-tight truncate">
              {title}
            </h2>
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-450 dark:text-zinc-500 font-semibold tracking-wider uppercase truncate">
              <span>Owner Portal</span>
              <span>&bull;</span>
              <span className="text-indigo-500 dark:text-indigo-400">
                {pathname.split("/").filter(Boolean).slice(1).join(" > ") || "Overview"}
              </span>
            </div>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-4 shrink-0">
          <NotificationBell role="owner" />
        </div>
      </header>
    </>
  );
}
