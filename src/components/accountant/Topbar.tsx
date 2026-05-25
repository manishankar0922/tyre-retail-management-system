"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { 
  Search, 
  Clock, 
  Calendar,
  Wifi
} from "lucide-react";
import SidebarToggle from "../layout/SidebarToggle";
import NotificationBell from "../layout/NotificationBell";
import { formatDateIST, formatTimeIST } from "@/utils/date";

function LiveClock() {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setTime(formatTimeIST(now));
      setDate(formatDateIST(now));
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-4 bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-200/50 dark:border-zinc-800/40 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
      <div className="flex items-center gap-1">
        <Calendar className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
        <span>{date}</span>
      </div>
      <span className="text-zinc-300 dark:text-zinc-800">|</span>
      <div className="flex items-center gap-1 font-mono">
        <Clock className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
        <span>{time}</span>
      </div>
    </div>
  );
}

export default function Topbar() {
  const pathname = usePathname();

  // Map route path to header title
  const getPageTitle = (path: string) => {
    if (path === "/accountant") return "Dashboard Overview";
    if (path === "/accountant/billing") return "Generate New Invoice";
    if (path === "/accountant/invoices") return "Search & View Invoices";
    if (path === "/accountant/inventory") return "Inventory Directory";
    if (path === "/accountant/customers") return "Customer Directory";
    if (path === "/accountant/reports") return "Financial & Sales Reports";
    if (path === "/accountant/settings") return "System Settings";
    
    // Sub-routes or fallback
    if (path.startsWith("/accountant/billing/")) return "Invoice Search";
    return "Accountant Dashboard";
  };

  return (
    <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md px-4 md:px-6 flex items-center justify-between gap-3 select-none">
      
      {/* Left section with Sidebar toggle and title */}
      <div className="flex items-center gap-3 min-w-0">
        <SidebarToggle mode="mobile" className="lg:hidden shrink-0" />
        
        {/* Dynamic Route Title */}
        <div className="flex flex-col min-w-0">
          <h2 className="text-sm md:text-base font-extrabold text-zinc-800 dark:text-zinc-100 tracking-tight truncate">
            {getPageTitle(pathname)}
          </h2>
          <div className="flex items-center gap-1.5 text-[9px] md:text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold tracking-wider uppercase truncate">
            <span>Accountant Portal</span>
            <span className="hidden sm:inline">&bull;</span>
            <span className="hidden sm:inline text-indigo-500 dark:text-indigo-400">
              {pathname.split("/").filter(Boolean).slice(1).join(" > ") || "Overview"}
            </span>
          </div>
        </div>
      </div>

      {/* Center/Right Section containing live clock & status */}
      <div className="flex items-center gap-6">
        
        {/* Quick Search Widget */}
        <div className="relative hidden md:block w-64">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search shortcut (Ctrl + K)..."
            className="w-full bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 text-xs py-2 pl-9 pr-4 rounded-xl text-zinc-850 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 transition-all outline-none focus:bg-white dark:focus:bg-zinc-900/90"
          />
        </div>

        {/* Date & Time display */}
        <LiveClock />

        {/* Status indicator */}
        <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-950/30">
          <Wifi className="w-3.5 h-3.5 animate-pulse" />
          <span className="text-[10px] uppercase tracking-wider">Live</span>
        </div>

        {/* Notifications Center */}
        <NotificationBell role="accountant" />

      </div>
    </header>
  );
}
