"use client";

import React from "react";
import SidebarToggle from "./SidebarToggle";
import NotificationBell from "./NotificationBell";

interface MobileSidebarProps {
  title: string;
  role: "owner" | "accountant";
}

export default function MobileSidebar({ title, role }: MobileSidebarProps) {
  return (
    <header className="lg:hidden h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md px-4 flex items-center justify-between shrink-0 select-none">
      <div className="flex items-center gap-3">
        <SidebarToggle mode="mobile" />
        <h1 className="font-extrabold text-xs tracking-wider uppercase text-zinc-800 dark:text-zinc-200">
          {title}
        </h1>
      </div>
      <NotificationBell role={role} />
    </header>
  );
}
