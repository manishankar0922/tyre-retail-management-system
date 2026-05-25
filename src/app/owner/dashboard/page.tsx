import { Suspense } from "react";
import { ownerDashboardService } from "@/services/ownerDashboard.service";
import { connection } from "next/server";

// Components
import ActivityFeed from "@/components/owner/ActivityFeed";
import InventoryQuantityPanel from "@/components/owner/InventoryQuantityPanel";
import AddPurchaseAction from "./AddPurchaseAction";

export const unstable_instant = {
  prefetch: "static"
};

async function SummaryLoader() {
  await connection();
  const stats = await ownerDashboardService.getTodayKPIs();

  return (
    <div className="grid gap-2 sm:grid-cols-3 text-[12px] text-zinc-600 dark:text-zinc-400">
      <div className="rounded-full bg-zinc-100 dark:bg-zinc-900 px-3 py-2 font-semibold">
        Sales today: ₹{stats.todayGrossRevenue.toLocaleString("en-IN")}
      </div>
      <div className="rounded-full bg-zinc-100 dark:bg-zinc-900 px-3 py-2 font-semibold">
        Invoices: {stats.todayInvoiceCount}
      </div>
      <div className="rounded-full bg-zinc-100 dark:bg-zinc-900 px-3 py-2 font-semibold">
        Low stock: {stats.lowStockCount}
      </div>
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {[...Array(3)].map((_, idx) => (
        <div key={idx} className="h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
      ))}
    </div>
  );
}

async function ActivityLoader() {
  await connection();
  const activity = await ownerDashboardService.getRecentActivity(10);
  return <ActivityFeed activity={activity} />;
}

function FeedSkeleton() {
  return <div className="h-[350px] bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />;
}

async function InventoryLoader() {
  await connection();
  const products = await ownerDashboardService.getAllProductsLightweight();
  return (
    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm p-4 min-h-[300px]">
      <div className="mb-4">
        <h2 className="text-sm font-black text-zinc-900 dark:text-zinc-100">Inventory Alerts</h2>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">Low stock and current quantities.</p>
      </div>
      <InventoryQuantityPanel products={products} />
    </div>
  );
}

async function AddPurchaseLoader() {
  await connection();
  const products = await ownerDashboardService.getAllProductsLightweight();
  return <AddPurchaseAction products={products} />;
}

export default function OwnerDashboardPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-black tracking-tight text-zinc-900 dark:text-white">Owner Dashboard</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Compact operational summary for sales, purchases and stock.</p>
        </div>
        
        {/* Quick Operations Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Suspense fallback={<div className="w-28 h-8 bg-zinc-800 animate-pulse rounded-xl" />}>
            <AddPurchaseLoader />
          </Suspense>
        </div>
      </div>

      <Suspense fallback={<SummarySkeleton />}>
        <SummaryLoader />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Suspense fallback={<FeedSkeleton />}>
          <InventoryLoader />
        </Suspense>

        <Suspense fallback={<FeedSkeleton />}>
          <ActivityLoader />
        </Suspense>
      </div>
    </div>
  );
}