"use client";

import React from "react";
import { useSidebar } from "./SidebarContext";
import SidebarToggle from "./SidebarToggle";

interface SidebarProps {
  children: React.ReactNode;
}

export default function Sidebar({ children }: SidebarProps) {
  const { isOpen, isCollapsed } = useSidebar();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 lg:relative lg:translate-x-0
        flex flex-col h-screen bg-zinc-950 text-zinc-200 border-r border-zinc-900 shadow-2xl select-none
        transition-all duration-300 ease-in-out shrink-0
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        ${isCollapsed ? "lg:w-20" : "lg:w-68 w-68"}`}
    >
      {/* Floating collapse toggle for desktop */}
      <div className="hidden lg:block absolute top-7 -right-3 z-50 animate-[fadeIn_0.2s_ease-out]">
        <SidebarToggle mode="desktop" />
      </div>
      
      {children}
    </aside>
  );
}
