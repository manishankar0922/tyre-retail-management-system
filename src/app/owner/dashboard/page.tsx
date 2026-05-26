"use client";

import { useEffect, useState } from "react";
import { ownerDashboardService } from "@/services/ownerDashboard.service";

// Components
import ActivityFeed from "@/components/owner/ActivityFeed";
import InventoryQuantityPanel from "@/components/owner/InventoryQuantityPanel";
import AddPurchaseAction from "./AddPurchaseAction";

export default function OwnerDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [activity, setActivity] = useState<any | null>(null);
  const [products, setProducts] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setIsLoading(true);
        const [statsData, activityData, productsData] = await Promise.all([
          ownerDashboardService.getTodayKPIs(),
          ownerDashboardService.getRecentActivity(10),
          ownerDashboardService.getAllProductsLightweight()
        ]);
        setStats(statsData);
        setActivity(activityData);
        setProducts(productsData);
      } catch (err) {
        console.error("Error loading owner dashboard:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboard();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-black tracking-tight text-zinc-900 dark:text-white">Owner Dashboard</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Compact operational summary for sales, purchases and stock.</p>
        </div>
        
        {/* Quick Operations Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {isLoading || !products ? (
            <div className="w-28 h-8 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-xl" />
          ) : (
            <AddPurchaseAction products={products} />
          )}
        </div>
      </div>

      {/* KPI Stats Panel */}
      {isLoading || !stats ? (
        <div className="grid gap-2 sm:grid-cols-3">
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className="h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-3 text-[12px] text-zinc-650 dark:text-zinc-400">
          <div className="rounded-full bg-zinc-105 dark:bg-zinc-900 px-3 py-2 font-semibold">
            Sales today: ₹{stats.todayGrossRevenue.toLocaleString("en-IN")}
          </div>
          <div className="rounded-full bg-zinc-105 dark:bg-zinc-900 px-3 py-2 font-semibold">
            Invoices: {stats.todayInvoiceCount}
          </div>
          <div className="rounded-full bg-zinc-105 dark:bg-zinc-900 px-3 py-2 font-semibold">
            Low stock: {stats.lowStockCount}
          </div>
        </div>
      )}

      {/* Columns for Alert & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: Inventory Alerts */}
        {isLoading || !products ? (
          <div className="h-[350px] bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />
        ) : (
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm p-4 min-h-[300px]">
            <div className="mb-4">
              <h2 className="text-sm font-black text-zinc-900 dark:text-zinc-100">Inventory Alerts</h2>
              <p className="text-[11px] text-zinc-505 dark:text-zinc-400 mt-1">Low stock and current quantities.</p>
            </div>
            <InventoryQuantityPanel products={products} />
          </div>
        )}

        {/* Right Column: Activity Feed */}
        {isLoading || !activity ? (
          <div className="h-[350px] bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />
        ) : (
          <ActivityFeed activity={activity} />
        )}
      </div>
    </div>
  );
}