import { 
  Receipt, 
  RefreshCw, 
  ShoppingBag
} from "lucide-react";
import { 
  RecentInvoiceActivity, 
  RecentStockActivity, 
  RecentPurchaseActivity 
} from "@/services/ownerDashboard.service";
import { formatIST } from "@/utils/date";

interface ActivityFeedProps {
  activity: {
    recentInvoices: RecentInvoiceActivity[];
    recentStockUpdates: RecentStockActivity[];
    recentPurchases: RecentPurchaseActivity[];
  };
  isLoading?: boolean;
}

export default function ActivityFeed({ activity, isLoading }: ActivityFeedProps) {
  const formatRelativeTime = (isoString: string) => {
    return formatIST(isoString);
  };

  const unifiedActivities = [
    ...activity.recentInvoices.map(inv => ({
      id: `invoice-${inv.id}`,
      type: "invoice" as const,
      title: `Invoice ${inv.invoice_no}`,
      desc: `Customer: ${inv.customer_name} • ${inv.payment_mode}`,
      amount: `+₹${inv.total_amount.toLocaleString("en-IN")}`,
      amountColor: "text-emerald-600 dark:text-emerald-400",
      icon: Receipt,
      iconColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      created_at: inv.created_at,
    })),
    ...activity.recentStockUpdates.map(log => ({
      id: `stock-${log.id}`,
      type: "stock" as const,
      title: log.product_name,
      desc: `Action: ${log.action_type}`,
      amount: `${log.old_stock} → ${log.new_stock} pcs`,
      amountColor: "text-indigo-600 dark:text-indigo-400",
      icon: RefreshCw,
      iconColor: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
      created_at: log.created_at,
    })),
    ...activity.recentPurchases.map(p => ({
      id: `purchase-${p.id}`,
      type: "purchase" as const,
      title: p.supplier_name,
      desc: `Supplier Purchase Order`,
      amount: `-₹${p.total_amount.toLocaleString("en-IN")}`,
      amountColor: "text-amber-600 dark:text-amber-400",
      icon: ShoppingBag,
      iconColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
      created_at: p.created_at,
    }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
   .slice(0, 8); // Display top 8 activities for compact height

  return (
    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4 h-full">
      {/* Header */}
      <div>
        <h3 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-100">
          Live Business Activity Feed
        </h3>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">
          Real-time transaction & operations log
        </p>
      </div>

      {/* Timeline Stream */}
      <div className="relative pt-2 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
        {isLoading ? (
          <div className="py-16 text-center text-zinc-400 text-xs font-semibold">
            Loading logs feed...
          </div>
        ) : unifiedActivities.length === 0 ? (
          <div className="py-16 text-center text-zinc-400 text-xs font-semibold">
            No recent activity recorded.
          </div>
        ) : (
          <div className="relative pl-1">
            {/* Vertical timeline line */}
            <div className="absolute left-[17px] top-2 bottom-6 w-0.5 bg-zinc-100 dark:bg-zinc-900" />

            <div className="space-y-4">
              {unifiedActivities.map((act) => {
                const Icon = act.icon;
                return (
                  <div key={act.id} className="relative pl-8 flex items-start justify-between text-xs">
                    {/* Timeline Node Badge */}
                    <div className={`absolute left-0 top-0.5 p-1 rounded-lg border ${act.iconColor} shrink-0`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 pr-4">
                      <p className="font-bold text-zinc-850 dark:text-zinc-200 truncate">
                        {act.title}
                      </p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold mt-0.5 truncate">
                        {act.desc}
                      </p>
                      <p className="text-[8px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-black mt-1">
                        {formatRelativeTime(act.created_at)}
                      </p>
                    </div>

                    {/* Amount */}
                    <div className={`text-right shrink-0 font-black text-xs ${act.amountColor}`}>
                      {act.amount}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
