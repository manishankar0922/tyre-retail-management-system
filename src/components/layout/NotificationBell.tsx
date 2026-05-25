"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRenderTrace } from "@/hooks/useRenderTrace";
import { Bell } from "lucide-react";
import { ownerDashboardService } from "@/services/ownerDashboard.service";
import NotificationDropdown, { NotificationEvent } from "./NotificationDropdown";

interface NotificationBellProps {
  role: "owner" | "accountant";
}

export default function NotificationBell({ role }: NotificationBellProps) {
  useRenderTrace("NotificationBell");

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const bellRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      let feed: NotificationEvent[] = [];
      if (role === "owner") {
        feed = await ownerDashboardService.getNotificationFeed() as any;
      } else {
        feed = await ownerDashboardService.getAccountantNotificationFeed() as any;
      }
      setNotifications(feed);
      
      // Unread count is defined as low stock warning count or error alert count
      const criticalCount = feed.filter(
        f => f.type === "low_stock" || f.type === "gst_billing_error" || f.type === "invoice_save_failure"
      ).length;
      setUnreadCount(criticalCount);
    } catch (e) {
      console.error("Failed to load notifications:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    let interval: NodeJS.Timeout;
    
    const startPolling = () => {
      interval = setInterval(fetchNotifications, 300000); // 5 minutes auto-refresh
    };
    
    const stopPolling = () => {
      if (interval) clearInterval(interval);
    };
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        fetchNotifications();
        startPolling();
      }
    };
    
    startPolling();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [role]);

  // Client-side listener for Invoice Save Failures (Accountant portal)
  useEffect(() => {
    if (role !== "accountant") return;

    const handleSaveFailure = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { customer, error } = customEvent.detail || {};
      const newFailEvent: NotificationEvent = {
        id: `fail-${Date.now()}`,
        type: "invoice_save_failure",
        message: `Invoice Save Failure Alert: Failed to save invoice for ${customer || "Walk-in"} - ${error || "Database error"}`,
        created_at: new Date().toISOString()
      };
      setNotifications(prev => [newFailEvent, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    window.addEventListener("invoice_save_failure", handleSaveFailure);
    return () => window.removeEventListener("invoice_save_failure", handleSaveFailure);
  }, [role]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div ref={bellRef} className="relative">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            fetchNotifications(); // Refresh on open
          }
        }}
        className="relative p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-250/65 dark:hover:bg-zinc-800 rounded-xl transition-all border border-zinc-200/50 dark:border-zinc-800/40 cursor-pointer"
        aria-label="Operational Notifications"
      >
        <Bell className="w-4.5 h-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-black text-white border-2 border-white dark:border-zinc-950">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationDropdown
          notifications={notifications}
          isLoading={isLoading}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
