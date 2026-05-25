import React from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { InventoryInsightItem } from "@/services/ownerDashboard.service";

interface InventoryQuantityPanelProps {
  products: InventoryInsightItem[];
  isLoading?: boolean;
}

export default function InventoryQuantityPanel({ products, isLoading }: InventoryQuantityPanelProps) {
  return (
    <div className="space-y-3">
      {isLoading ? (
        <div className="py-12 text-center text-zinc-400 text-xs font-semibold">
          Loading inventory status...
        </div>
      ) : products.length === 0 ? (
        <div className="py-12 text-center text-zinc-400 text-xs font-semibold">
          No inventory products found.
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((item) => {
            const isLowStock = item.stock_qty <= item.min_stock;
            return (
              <div
                key={item.id}
                className={`p-2.5 rounded-xl border flex items-center justify-between transition-all text-xs font-semibold ${
                  isLowStock
                    ? "bg-rose-50/40 dark:bg-rose-950/10 border-rose-200/50 dark:border-rose-900/30 text-rose-900 dark:text-rose-300"
                    : "bg-zinc-50/50 dark:bg-zinc-900/40 border-zinc-200/50 dark:border-zinc-800/40 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-1.5 font-bold text-zinc-900 dark:text-zinc-100 uppercase truncate">
                    <span>{item.brand} {item.model}</span>
                  </div>
                  <div className="text-[9px] text-zinc-400 dark:text-zinc-505 font-bold uppercase mt-0.5 tracking-wider">
                    {item.tyre_size}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono font-black text-xs text-zinc-900 dark:text-zinc-100">
                    {item.stock_qty} pcs
                  </span>
                  
                  {isLowStock ? (
                    <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-md border border-rose-200/20">
                      <AlertTriangle className="w-3 h-3 text-rose-500" />
                      <span>Low Stock</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-200/20">
                      <CheckCircle className="w-3 h-3 text-emerald-500" />
                      <span>In Stock</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {products.length > 15 && (
            <div className="text-center pt-2 pb-1">
              <Link 
                href="/owner/inventory" 
                className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline transition-all"
              >
                View all {products.length} products in Inventory &rarr;
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
