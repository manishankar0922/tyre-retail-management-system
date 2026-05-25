import { 
  TrendingUp, 
  Receipt, 
  IndianRupee, 
  AlertTriangle, 
  Coins
} from "lucide-react";
import { DashboardKPIs } from "@/services/ownerDashboard.service";

interface KpiStripProps {
  stats: DashboardKPIs;
  isLoading?: boolean;
}

export default function KpiStrip({ stats, isLoading }: KpiStripProps) {
  const cards = [
    {
      title: "Today's Gross",
      value: `₹${stats.todayGrossRevenue.toLocaleString("en-IN")}`,
      desc: "Gross sales value",
      icon: IndianRupee,
      color: "text-blue-500 bg-blue-500/10 border-blue-200/50 dark:border-blue-900/30",
    },
    {
      title: "Invoices",
      value: stats.todayInvoiceCount.toString(),
      desc: "Transactions today",
      icon: Receipt,
      color: "text-purple-500 bg-purple-500/10 border-purple-200/50 dark:border-purple-900/30",
    },
    {
      title: "GST Collected",
      value: `₹${stats.todayGstCollected.toLocaleString("en-IN")}`,
      desc: "Tax liability today",
      icon: Coins,
      color: "text-amber-500 bg-amber-500/10 border-amber-200/50 dark:border-amber-900/30",
    },
    {
      title: "Net Revenue",
      value: `₹${stats.todayNetRevenue.toLocaleString("en-IN")}`,
      desc: "Minus discount deductions",
      icon: TrendingUp,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-200/50 dark:border-emerald-900/30",
    },
    {
      title: "Low Stock Alert",
      value: stats.lowStockCount.toString(),
      desc: "Items below min point",
      icon: AlertTriangle,
      color: stats.lowStockCount > 0
        ? "text-rose-500 bg-rose-500/10 border-rose-200/50 dark:border-rose-900/30 animate-pulse font-extrabold"
        : "text-zinc-400 bg-zinc-500/5 border-zinc-200/50 dark:border-zinc-800",
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-900 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-zinc-300 dark:hover:border-zinc-800 transition-colors duration-200 ${
              isLoading ? "animate-pulse" : ""
            } ${idx === 4 ? "col-span-2 sm:col-span-1" : ""}`}
          >
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-505">
                {card.title}
              </span>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                {isLoading ? "..." : card.value}
              </h2>
              <p className="text-[9px] font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-wide">
                {card.desc}
              </p>
            </div>
            <div className={`p-2.5 rounded-lg border ${card.color} shrink-0`}>
              <Icon className="w-4 h-4" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
