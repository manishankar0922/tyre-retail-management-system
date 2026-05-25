"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

interface SidebarContextType {
  isOpen: boolean;
  isCollapsed: boolean;
  setIsOpen: (open: boolean) => void;
  setIsCollapsed: (collapsed: boolean) => void;
  toggleOpen: () => void;
  toggleCollapse: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  // Load from localStorage on client-side mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("sidebarCollapsed");
      if (stored === "true") {
        setIsCollapsed(true);
      }
    }
  }, []);

  // Close mobile sidebar drawer on navigation change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const toggleOpen = () => setIsOpen((prev) => !prev);
  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("sidebarCollapsed", String(next));
      }
      return next;
    });
  };

  const handleSetIsCollapsed = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebarCollapsed", String(collapsed));
    }
  };

  return (
    <SidebarContext.Provider
      value={{
        isOpen,
        isCollapsed,
        setIsOpen,
        setIsCollapsed: handleSetIsCollapsed,
        toggleOpen,
        toggleCollapse,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
