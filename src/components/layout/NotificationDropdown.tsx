"use client";

import React from "react";
import { 
  AlertTriangle, 
  Receipt, 
  RefreshCw, 
  ShoppingBag, 
  Edit3, 
  CheckCircle, 
  XCircle, 
  Sparkles 
} from "lucide-react";

export interface NotificationEvent {
  id: string;
  type: 
    | "low_stock" 
    | "stock_update" 
    | "stock_updated" 
    | "invoice_generated" 
    | "invoice_updated" 
    | "payment_completed" 
    | "purchase_added" 
    | "gst_billing_error" 
    | "invoice_save_failure";
  message: string;
  created_at: string;
}

interface NotificationDropdownProps {
  notifications: NotificationEvent[];
  isLoading: boolean;
  onClose?: () => void;
}

export default function NotificationDropdown({
  notifications,
  isLoading,
  onClose
}: NotificationDropdownProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "low_stock":
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case "stock_update":
      case "stock_updated":
        return <RefreshCw className="w-4 h-4 text-indigo-500" />;
      case "invoice_generated":
        return <Receipt className="w-4 h-4 text-emerald-500" />;
      case "invoice_updated":
        return <Edit3 className="w-4 h-4 text-sky-500" />;
      case "payment_completed":
        return <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case "purchase_added":
        return <ShoppingBag className="w-4 h-4 text-purple-500" />;
      case "gst_billing_error":
        return <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />;
      case "invoice_save_failure":
        return <XCircle className="w-4 h-4 text-red-650 dark:text-red-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-zinc-500" />;
    }
  };

  const getRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) + 
        " • " + date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    } catch (e) {
      return "";
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[400px]">
      <div className="p-4 border-b border-zinc-150 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10 flex items-center justify-between">
        <h3 className="font-extrabold text-xs text-zinc-850 dark:text-zinc-100 uppercase tracking-wider">
          System Alerts & Events
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[10px] font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 uppercase cursor-pointer"
          >
            Close
          </button>
        )}
      </div>

      <div className="overflow-y-auto custom-scrollbar p-3 space-y-2 flex-1 min-h-0">
        {isLoading ? (
          <div className="py-8 text-center text-zinc-450 dark:text-zinc-550 text-xs font-semibold">
            Fetching fresh alerts...
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center text-zinc-450 dark:text-zinc-550 text-xs font-semibold">
            All systems normal. No alerts.
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              className={`p-2.5 rounded-xl border transition-colors flex gap-2.5 text-[11px] font-semibold
                ${item.type === "gst_billing_error" || item.type === "invoice_save_failure"
                  ? "bg-red-50/50 dark:bg-red-950/10 border-red-200/50 dark:border-red-900/40 text-red-700 dark:text-red-400"
                  : item.type === "low_stock"
                  ? "bg-amber-50/50 dark:bg-amber-950/10 border-amber-200/50 dark:border-amber-900/40 text-amber-700 dark:text-amber-400"
                  : "bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-200/40 dark:border-zinc-800/40 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                }`}
            >
              <div className="shrink-0 pt-0.5">{getIcon(item.type)}</div>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="leading-tight break-words">{item.message}</p>
                <p className="text-[8px] text-zinc-400 dark:text-zinc-505 font-bold uppercase tracking-wider">
                  {getRelativeTime(item.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
