"use client";

import React from "react";
import { Menu, ChevronLeft, ChevronRight } from "lucide-react";
import { useSidebar } from "./SidebarContext";

interface SidebarToggleProps {
  mode: "mobile" | "desktop";
  className?: string;
}

export default function SidebarToggle({ mode, className = "" }: SidebarToggleProps) {
  const { isOpen, setIsOpen, isCollapsed, toggleCollapse, toggleOpen } = useSidebar();

  if (mode === "mobile") {
    return (
      <button
        onClick={toggleOpen}
        className={`p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all ${className}`}
        aria-label="Toggle navigation menu"
      >
        <Menu className="w-5 h-5" />
      </button>
    );
  }

  // Desktop collapse toggle button
  return (
    <button
      onClick={toggleCollapse}
      className={`w-6 h-6 rounded-full border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 cursor-pointer shadow-md flex items-center justify-center transition-all ${className}`}
      aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      {isCollapsed ? (
        <ChevronRight className="w-3.5 h-3.5" />
      ) : (
        <ChevronLeft className="w-3.5 h-3.5" />
      )}
    </button>
  );
}
