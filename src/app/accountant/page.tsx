"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Receipt, 
  Search, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  PlusCircle, 
  ChevronRight,
  TrendingDown,
  ArrowUpRight,
  BarChart3
} from "lucide-react";
import RecentInvoicesPanel, { RecentInvoiceRow } from "@/components/dashboard/RecentInvoicesPanel";
import { supabase } from "@/lib/supabase";

interface StatsData {
  invoicesToday: number;
  billingToday: number;
  newCustomersToday: number;
  lowStockCount: number;
}

export default function AccountantDashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoiceRow[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setIsLoading(true);
        
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const startOfTodayISO = startOfToday.toISOString();

        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);
        const endOfTodayISO = endOfToday.toISOString();

        // Fetch KPIs
        const [
          todayInvoicesRes,
          todayCustomersRes,
          lowStockRes,
          recentInvoicesRes
        ] = await Promise.all([
          supabase
            .from("invoices")
            .select("total_amount")
            .neq("is_deleted", true)
            .gte("created_at", startOfTodayISO)
            .lte("created_at", endOfTodayISO),
          supabase
            .from("customers")
            .select("id", { count: "exact", head: true })
            .gte("created_at", startOfTodayISO)
            .lte("created_at", endOfTodayISO),
          supabase
            .from("products")
            .select("id", { count: "exact", head: true })
            .eq("is_active", true)
            .lte("stock_qty", 5),
          supabase
            .from("invoices")
            .select(`
              id,
              invoice_no,
              total_amount,
              payment_mode,
              created_at,
              customers (
                name
              )
            `)
            .neq("is_deleted", true)
            .order("id", { ascending: false })
            .limit(10)
        ]);

        const todayInvoices = todayInvoicesRes.data || [];
        const billingTodayVal = todayInvoices.reduce((sum: number, inv: any) => sum + Number(inv.total_amount || 0), 0);

        setStats({
          invoicesToday: todayInvoices.length,
          billingToday: billingTodayVal,
          newCustomersToday: todayCustomersRes.count || 0,
          lowStockCount: lowStockRes.count || 0
        });

        const raw = recentInvoicesRes.data || [];
        const mappedInvoices: RecentInvoiceRow[] = raw.map((inv: any) => ({
          id: String(inv.id),
          invoice_no: inv.invoice_no || `INV-${inv.id}`,
          customer_name: inv.customers ? (Array.isArray(inv.customers) ? inv.customers[0]?.name : inv.customers.name) || "Walk-in Customer" : "Walk-in Customer",
          total_amount: Number(inv.total_amount || 0),
          payment_mode: inv.payment_mode || "Cash",
          created_at: inv.created_at || new Date().toISOString(),
        }));

        setRecentInvoices(mappedInvoices);
      } catch (err) {
        console.error("Error loading accountant dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const quickActions = [
    {
      title: "Quick Billing",
      desc: "Fast checkout & invoice creation",
      href: "/accountant/billing",
      icon: PlusCircle,
      highlight: true,
      color: "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white",
    },
    {
      title: "Search Invoice",
      desc: "Retrieve, reprint or void bills",
      href: "/accountant/invoices",
      icon: Search,
      highlight: false,
      color: "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-850",
    },
    {
      title: "Daily Reports",
      desc: "Monitor sales & metrics",
      href: "/accountant/reports",
      icon: BarChart3,
      highlight: false,
      color: "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-850",
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-zinc-900 to-zinc-950 dark:from-zinc-900/90 dark:to-zinc-950/90 p-6 md:p-8 rounded-2xl border border-zinc-800/80 shadow-lg text-white">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight">
            TyreRetail Pro ERP Accountant Console
          </h1>
          <p className="text-xs md:text-sm text-zinc-400 mt-1 font-medium">
            Real-time dashboard connected directly to the database schema.
          </p>
        </div>
        
        {/* Dominant Quick Bill Trigger */}
        <Link
          href="/accountant/billing"
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-sm font-extrabold shadow-lg shadow-indigo-500/20 hover:scale-[1.03] active:scale-[0.98] transition-all shrink-0 cursor-pointer self-start md:self-auto"
        >
          <Receipt className="w-4 h-4" />
          <span>New Bill</span>
        </Link>
      </div>

      {/* Grid: Stat Cards */}
      {isLoading || !stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-zinc-200 dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {[
            {
              title: "Invoices Today",
              value: stats.invoicesToday.toString(),
              change: "Live count",
              isPositive: true,
              icon: Receipt,
              color: "from-blue-500/10 to-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-900/50",
            },
            {
              title: "Total Billing Value Today",
              value: `₹${stats.billingToday.toLocaleString("en-IN")}`,
              change: "Net revenue",
              isPositive: true,
              icon: TrendingUp,
              color: "from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/50",
            },
            {
              title: "New Customers Today",
              value: stats.newCustomersToday.toString(),
              change: "Registered profiles",
              isPositive: true,
              icon: Users,
              color: "from-purple-500/10 to-pink-500/10 text-purple-600 dark:text-purple-400 border-purple-200/50 dark:border-purple-900/50",
            },
            {
              title: "Low Stock Items",
              value: stats.lowStockCount.toString(),
              change: "Requires re-order",
              isPositive: stats.lowStockCount === 0,
              icon: AlertTriangle,
              color: stats.lowStockCount > 0 
                ? "from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-550 border-amber-200/50 dark:border-amber-900/50"
                : "from-zinc-500/10 to-zinc-500/10 text-zinc-500 border-zinc-200",
            },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="flex items-start justify-between">
                  <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 tracking-wide uppercase">
                    {stat.title}
                  </p>
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.color} border border-transparent`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-3xl font-black text-zinc-900 dark:text-zinc-550 tracking-tight">
                    {stat.value}
                  </h3>
                  <div className="flex items-center gap-1 mt-1.5">
                    {stat.isPositive ? (
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-amber-500" />
                    )}
                    <span className={`text-[11px] font-bold ${stat.isPositive ? "text-emerald-500" : "text-amber-500"}`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Grid: Columns for List & Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column: Recent Invoices */}
        <div className="xl:col-span-2">
          {isLoading || !recentInvoices ? (
            <div className="h-[470px] bg-zinc-200 dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-800 animate-pulse" />
          ) : (
            <RecentInvoicesPanel
              invoices={recentInvoices}
              isLoading={false}
              listHeight="h-[400px]"
              viewAllHref="/accountant/invoices"
            />
          )}
        </div>

        {/* Right Column: Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-850 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="font-extrabold text-sm text-zinc-850 dark:text-zinc-100">
                Primary Actions
              </h3>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-505 font-semibold uppercase tracking-wider mt-0.5">
                Fast lane Operations
              </p>
            </div>

            <div className="space-y-3">
              {quickActions.map((action, idx) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={idx}
                    href={action.href}
                    className={`flex items-start gap-4 p-4 rounded-xl transition-all duration-200 group cursor-pointer
                      ${action.highlight 
                        ? `${action.color} hover:scale-[1.02] hover:shadow-md hover:shadow-indigo-500/10` 
                        : `${action.color} hover:border-zinc-300 dark:hover:border-zinc-700`
                      }`}
                  >
                    <div className={`p-2 rounded-lg ${action.highlight ? "bg-white/20" : "bg-zinc-100 dark:bg-zinc-900 group-hover:bg-zinc-200/60 dark:group-hover:bg-zinc-800"}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold flex items-center gap-1">
                        <span>{action.title}</span>
                        <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </h4>
                      <p className={`text-[10px] mt-0.5 ${action.highlight ? "text-zinc-100" : "text-zinc-400 dark:text-zinc-505"}`}>
                        {action.desc}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}