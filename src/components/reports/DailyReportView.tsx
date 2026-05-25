"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import RecentInvoicesPanel from "@/components/dashboard/RecentInvoicesPanel";
import { 
  ArrowLeft, 
  TrendingUp, 
  DollarSign, 
  Package, 
  AlertTriangle, 
  Activity, 
  Clock, 
  RefreshCw
} from "lucide-react";
import { DailyReportData } from "@/services/report.service";
import { formatDateIST, formatTimeIST } from "@/utils/date";

interface DailyReportViewProps {
  data: DailyReportData;
  role: "owner" | "accountant";
}

export default function DailyReportView({ data, role }: DailyReportViewProps) {
  const formatTime = (isoString: string) => formatTimeIST(isoString);
  const formatDate = (isoString: string) => formatDateIST(isoString);

  const backHref = role === "owner" ? "/owner/dashboard" : "/accountant";
  const reloadHref = role === "owner" ? "/owner/reports" : "/accountant/reports";

  // Memoize invoices shape mapping
  const mappedInvoices = useMemo(() => {
    return data.recentInvoices.map(inv => ({
      ...inv,
      id: String(inv.id),
    }));
  }, [data.recentInvoices]);

  // Performance Optimization & UI Polish: Calculate payment breakdown percentages for visual metrics
  const totalPayments = data.paymentBreakdown.upi + data.paymentBreakdown.card + data.paymentBreakdown.cash;
  const upiPercent = totalPayments > 0 ? (data.paymentBreakdown.upi / totalPayments) * 100 : 0;
  const cardPercent = totalPayments > 0 ? (data.paymentBreakdown.card / totalPayments) * 100 : 0;
  const cashPercent = totalPayments > 0 ? (data.paymentBreakdown.cash / totalPayments) * 100 : 0;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-850 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href={backHref}
            className="p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-extrabold text-zinc-900 dark:text-white">
              Daily Operations Report
            </h1>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-505 font-semibold uppercase tracking-wider">
              Real-time daily sales, inventory levels, and transaction logs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link 
            href={reloadHref}
            className="flex items-center gap-1.5 px-4 py-2 bg-zinc-105 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-250 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-xl transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload Report</span>
          </Link>
        </div>
      </div>

      {/* Stats Summary Grid (Today Sales & Payments) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Card 1: Today Sales Stats */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 p-5 rounded-xl shadow-sm flex flex-col justify-between h-full min-h-[175px]">
          <div className="flex items-start justify-between">
            <p className="text-[10px] text-zinc-400 dark:text-zinc-505 font-extrabold uppercase tracking-wider">Net Sales Revenue</p>
            <span className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          
          <div className="mt-2.5">
            <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              ₹{data.stats.netRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            
            {/* Horizontal subgrid to reduce vertical stretching */}
            <div className="mt-3.5 grid grid-cols-3 gap-2 pt-2.5 border-t border-zinc-100 dark:border-zinc-900 text-[10px] font-semibold text-zinc-650 dark:text-zinc-450">
              <div>
                <span className="text-zinc-400 block text-[9px] uppercase tracking-wide">Gross Sales</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">₹{data.stats.grossRevenue.toLocaleString("en-IN")}</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[9px] uppercase tracking-wide">Discounts</span>
                <span className="font-bold text-emerald-605 dark:text-emerald-400">-₹{data.stats.discountTotals.toLocaleString("en-IN")}</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[9px] uppercase tracking-wide">GST Tax</span>
                <span className="font-bold text-indigo-650 dark:text-indigo-400">₹{data.stats.gstCollected.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[9px] text-zinc-400 mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-900 font-bold uppercase tracking-wider">
            <span>{data.stats.invoiceCount} Invoices</span>
            <span>{data.stats.tyresSold} Tyres Sold</span>
          </div>
        </div>

        {/* Card 2: Today Payment Breakdown */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 p-5 rounded-xl shadow-sm flex flex-col justify-between h-full min-h-[175px]">
          <div className="flex items-start justify-between">
            <p className="text-[10px] text-zinc-400 dark:text-zinc-505 font-extrabold uppercase tracking-wider">Payment Breakdown</p>
            <span className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>

          {/* Segmented visual progress bar to represent data density */}
          <div className="mt-2.5">
            <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden flex shadow-inner">
              {totalPayments > 0 ? (
                <>
                  <div style={{ width: `${upiPercent}%` }} className="h-full bg-purple-500 transition-all duration-300" title={`UPI: ${upiPercent.toFixed(0)}%`} />
                  <div style={{ width: `${cardPercent}%` }} className="h-full bg-cyan-500 transition-all duration-300" title={`Card: ${cardPercent.toFixed(0)}%`} />
                  <div style={{ width: `${cashPercent}%` }} className="h-full bg-emerald-500 transition-all duration-300" title={`Cash: ${cashPercent.toFixed(0)}%`} />
                </>
              ) : (
                <div className="w-full h-full bg-zinc-200 dark:bg-zinc-800" />
              )}
            </div>

            {/* Horizontal Subgrid matching Revenue layout with matching color-coded bullets */}
            <div className="mt-4 grid grid-cols-3 gap-2 pt-2.5 border-t border-zinc-100 dark:border-zinc-900 text-[10px] font-semibold text-zinc-650 dark:text-zinc-450">
              <div>
                <span className="text-zinc-400 block text-[9px] uppercase tracking-wide flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  UPI ({upiPercent.toFixed(0)}%)
                </span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">₹{data.paymentBreakdown.upi.toLocaleString("en-IN")}</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[9px] uppercase tracking-wide flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                  Card ({cardPercent.toFixed(0)}%)
                </span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">₹{data.paymentBreakdown.card.toLocaleString("en-IN")}</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[9px] uppercase tracking-wide flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Cash ({cashPercent.toFixed(0)}%)
                </span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">₹{data.paymentBreakdown.cash.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[9px] text-zinc-400 mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-900 font-bold uppercase tracking-wider">
            <span>Capital Flow Modes</span>
            <span className="text-zinc-500 dark:text-zinc-400">Total: ₹{totalPayments.toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* Card 3: Stock Alert Summary */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 p-5 rounded-xl shadow-sm flex flex-col justify-between h-full min-h-[175px]">
          <div className="flex items-start justify-between">
            <p className="text-[10px] text-zinc-400 dark:text-zinc-505 font-extrabold uppercase tracking-wider">Low Stock Inventory</p>
            <span className={`p-1 rounded-lg ${data.lowStockProducts.length > 0 ? "bg-amber-50 dark:bg-amber-950/20 text-amber-500" : "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500"}`}>
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          
          <div className="mt-2.5 flex-1 flex flex-col justify-center">
            <h3 className={`text-2xl font-black tracking-tight ${data.lowStockProducts.length > 0 ? "text-amber-500 animate-pulse" : "text-emerald-505"}`}>
              {data.lowStockProducts.length} {data.lowStockProducts.length === 1 ? "Alert" : "Alerts"}
            </h3>
            <p className="text-[10px] text-zinc-400 mt-1 font-semibold uppercase tracking-wider">
              {data.lowStockProducts.length > 0 ? "Requires restock replenishment" : "All stock levels healthy"}
            </p>
          </div>

          <div className="flex items-center justify-between text-[9px] text-zinc-400 mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-900 font-bold uppercase tracking-wider">
            <span>Healthy Inventory Status</span>
            <span className={data.lowStockProducts.length > 0 ? "text-amber-500" : "text-emerald-505"}>
              {data.lowStockProducts.length > 0 ? "Restock Needed" : "100% OK"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Data details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Side: Low Stock & Recent Invoices */}
        <div className="space-y-6">
          
          {/* Low Stock Table */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-100 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-amber-500" />
                  <span>Low Stock Warning Log</span>
                </h3>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-505 font-semibold uppercase tracking-wider mt-0.5">
                  Tyres currently at or below minimum threshold
                </p>
              </div>
              <span className="text-[10px] font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-200/20 px-2 py-0.5 rounded-md">
                Alerts
              </span>
            </div>

            <div className="overflow-x-auto">
              {data.lowStockProducts.length === 0 ? (
                <div className="py-6 text-center text-zinc-400 dark:text-zinc-505 text-xs font-semibold border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                  No low stock alerts today.
                </div>
              ) : (
                <table className="w-full min-w-[450px] text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50/50 dark:bg-zinc-900/30 text-[9px] text-zinc-400 dark:text-zinc-500 font-extrabold uppercase tracking-widest border-b border-zinc-200 dark:border-zinc-800">
                      <th className="py-2 px-3">Product Description</th>
                      <th className="py-2 px-3 text-center">Current</th>
                      <th className="py-2 px-3 text-center">Min Limit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                    {data.lowStockProducts.map((p, idx) => (
                      <tr key={idx} className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        <td className="py-1.5 px-3">
                          <div className="font-bold text-zinc-800 dark:text-zinc-100">{p.brand.toUpperCase()} {p.model}</div>
                          <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{p.tyre_size}</div>
                        </td>
                        <td className="py-1.5 px-3 text-center text-amber-500 font-extrabold">
                          {p.stock_qty}
                        </td>
                        <td className="py-1.5 px-3 text-center text-zinc-400 dark:text-zinc-505">
                          {p.min_stock}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Recent Invoices — scrollable panel */}
          <RecentInvoicesPanel
            invoices={mappedInvoices}
            listHeight="h-[360px]"
            viewAllHref={role === "owner" ? "/owner/dashboard" : "/accountant/invoices"}
          />
        </div>

        {/* Right Side: Recent Activity Logs (Scrollable feed to prevent page stretching) */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between shrink-0">
            <div>
              <h3 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-100 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-500" />
                <span>Inventory Activity Log</span>
              </h3>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-505 font-semibold uppercase tracking-wider mt-0.5">
                Live audit trail of tyre stock adjustments
              </p>
            </div>
            <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/20 px-2 py-0.5 rounded-md">
              Audit Logs
            </span>
          </div>

          <div className="h-[480px] overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent pr-1">
            {data.activityLogs.length === 0 ? (
              <div className="py-12 text-center text-zinc-400 dark:text-zinc-505 text-xs font-semibold border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                No activity logged yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left border-collapse relative">
                  <thead>
                    <tr className="sticky top-0 bg-white dark:bg-zinc-950 z-10 shadow-[0_1px_0_0_rgba(228,228,231,0.6)] dark:shadow-[0_1px_0_0_rgba(39,39,42,0.6)] text-[9px] text-zinc-400 dark:text-zinc-550 font-extrabold uppercase tracking-widest border-b border-zinc-200 dark:border-zinc-800">
                      <th className="py-2.5 px-3 bg-white dark:bg-zinc-950">Product / Specification</th>
                      <th className="py-2.5 px-3 bg-white dark:bg-zinc-950">Action</th>
                      <th className="py-2.5 px-3 bg-white dark:bg-zinc-950 text-center">Adjustment</th>
                      <th className="py-2.5 px-3 bg-white dark:bg-zinc-950 text-right">Time</th>
                    </tr>
                  </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                  {data.activityLogs.map((log) => {
                    const diff = log.new_stock - log.old_stock;
                    const isPositive = diff > 0;
                    return (
                      <tr key={log.id} className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50/10 dark:hover:bg-zinc-900/10 transition-colors">
                        <td className="py-1.5 px-3">
                          {log.product ? (
                            <>
                              <div className="font-bold text-zinc-800 dark:text-zinc-100">
                                {log.product.brand.toUpperCase()} {log.product.model}
                              </div>
                              <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{log.product.tyre_size}</div>
                            </>
                          ) : (
                            <span className="text-zinc-400 dark:text-zinc-505 italic">Deleted Product</span>
                          )}
                        </td>
                        <td className="py-1.5 px-3">
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border uppercase ${
                            log.action_type === "SALE" 
                              ? "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 border-indigo-200/20"
                              : "bg-teal-50 dark:bg-teal-950/20 text-teal-650 border-teal-200/20"
                          }`}>
                            {log.action_type}
                          </span>
                        </td>
                        <td className="py-1.5 px-3 text-center">
                          <div className={`font-extrabold font-mono text-[11px] ${isPositive ? "text-emerald-500" : "text-rose-500"}`}>
                            {isPositive ? "+" : ""}{diff}
                          </div>
                          <div className="text-[9px] text-zinc-400 dark:text-zinc-505 font-mono">
                            {log.old_stock} → {log.new_stock}
                          </div>
                        </td>
                        <td className="py-1.5 px-3 text-right text-[10px] text-zinc-400 dark:text-zinc-505 font-mono">
                          <div className="flex items-center justify-end gap-1 text-zinc-500 dark:text-zinc-400">
                            <Clock className="w-3 h-3 text-zinc-400" />
                            <span>{formatTime(log.created_at)}</span>
                          </div>
                          <div className="text-[9px] text-zinc-505 mr-4">{formatDate(log.created_at)}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Sync Footer Note */}
      <div className="text-[10px] text-zinc-400 text-center font-bold uppercase tracking-wider">
        Financial report compilation is synchronized with active Supabase transactions.
      </div>

    </div>
  );
}
