import React from "react";
import OwnerSidebar from "@/components/owner/OwnerSidebar";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import SidebarOverlay from "@/components/layout/SidebarOverlay";
import OwnerHeader from "@/components/owner/OwnerHeader";

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
        {/* Left Owner Sidebar */}
        <OwnerSidebar />
        
        {/* Mobile Backdrop Overlay */}
        <SidebarOverlay />

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <OwnerHeader />

          {/* Dynamic Route Content */}
          <main className="flex-1 overflow-y-auto bg-zinc-50/50 dark:bg-zinc-900/50 p-3 sm:p-5 md:p-6 lg:p-8 custom-scrollbar">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
