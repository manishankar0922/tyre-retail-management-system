"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import QuickNotes from "@/components/dashboard/QuickNotes";
import { 
  LayoutDashboard, 
  Settings as SettingsIcon, 
  LogOut,
  Disc,
  ArrowLeftRight,
  Package,
  BarChart3,
  ShoppingBag,
  TrendingUp
} from "lucide-react";
import Sidebar from "../layout/Sidebar";
import { useSidebar } from "../layout/SidebarContext";
import { supabase } from "@/lib/supabase";

interface UserProfile {
  name: string;
  initials: string;
  role: string;
}

export default function OwnerSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { setIsOpen, isCollapsed } = useSidebar();

  const [profile, setProfile] = useState<UserProfile>({
    name: "Owner",
    initials: "O",
    role: "Owner"
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("currentUser");
      if (stored) {
        try {
          const user = JSON.parse(stored);
          const name = user.name || "Owner";
          const initials = name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || "O";

          setProfile({
            name,
            initials,
            role: user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Owner"
          });
        } catch (e) {
          // ignore
        }
      }
    }
  }, []);

  const handleLogout = async () => {
    if (typeof window !== "undefined") {
      // Clear session synchronously for instant client responsiveness
      localStorage.removeItem("currentUser");
      document.cookie = "currentUser=; path=/; max-age=0; SameSite=Lax";
      document.cookie = "sb-access-token=; path=/; max-age=0; SameSite=Lax";
      // Trigger API call in background
      supabase.auth.signOut().catch((err) => console.warn("Supabase signOut error:", err));
    }
    router.push("/");
  };

  const navItems = [
    {
      label: "Dashboard",
      href: "/owner/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Inventory",
      href: "/owner/inventory",
      icon: Package,
    },
    {
      label: "Reports",
      href: "/owner/reports",
      icon: BarChart3,
    },
    {
      label: "Purchases",
      href: "/owner/purchases",
      icon: ShoppingBag,
    },

    {
      label: "Settings",
      href: "/owner/settings",
      icon: SettingsIcon,
    },
  ];

  return (
    <Sidebar>
      {/* Brand Header */}
      <div className="p-5 border-b border-zinc-900 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/20 group cursor-pointer shrink-0">
            <Disc className="w-6 h-6 text-white animate-[spin_12s_linear_infinite] group-hover:animate-[spin_3s_linear_infinite] transition-all duration-300" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 animate-[fadeIn_0.2s_ease-out]">
              <h1 className="font-extrabold text-sm tracking-wider uppercase bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent truncate">
                Sri Swathi
              </h1>
              <p className="text-[10px] text-zinc-500 font-semibold tracking-widest uppercase truncate">
                Console Admin
              </p>
            </div>
          )}
        </div>
      </div>



      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href === "/owner/dashboard" && pathname === "/owner");

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3.5 py-3 px-4 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 group relative
                ${isActive 
                  ? "bg-zinc-800 text-white shadow-inner border-l-4 border-indigo-500 pl-[12px]" 
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
                } ${isCollapsed ? "justify-center" : ""}`}
            >
              <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 shrink-0
                ${isActive ? "text-indigo-400" : "text-zinc-400 group-hover:text-zinc-300"}`} 
              />
              {!isCollapsed && <span className="animate-[fadeIn_0.2s_ease-out] truncate">{item.label}</span>}
              
              {isActive && !isCollapsed && (
                <span className="absolute right-4 w-1.5 h-1.5 rounded-full bg-indigo-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Quick Notes Sidebar Widget - hidden when collapsed to save space */}
      {!isCollapsed && <QuickNotes variant="sidebar" />}

      {/* User profile footer */}
      <div className="p-4 border-t border-zinc-900 bg-zinc-950/50">
        <div className={`flex items-center gap-3 p-2 rounded-xl bg-zinc-900/50 border border-zinc-900 mb-2 ${isCollapsed ? "justify-center" : ""}`}>
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-950 border border-indigo-900 text-indigo-400 font-bold text-sm select-none shrink-0">
            {profile.initials}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1 animate-[fadeIn_0.2s_ease-out]">
              <p className="text-xs font-bold text-zinc-100 truncate">
                {profile.name}
              </p>
              <p className="text-[10px] font-semibold text-zinc-500 truncate uppercase tracking-wider">
                {profile.role}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          title={isCollapsed ? "Log Out" : undefined}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-950/30 border border-transparent hover:border-red-900/40 transition-all duration-200 cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span className="animate-[fadeIn_0.2s_ease-out]">Log Out</span>}
        </button>
      </div>
    </Sidebar>
  );
}
