"use client";

import React from "react";
import { useSidebar } from "./SidebarContext";

export default function SidebarOverlay() {
  const { isOpen, setIsOpen } = useSidebar();

  if (!isOpen) return null;

  return (
    <div
      onClick={() => setIsOpen(false)}
      className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs transition-opacity duration-300 lg:hidden cursor-pointer"
      aria-hidden="true"
    />
  );
}
