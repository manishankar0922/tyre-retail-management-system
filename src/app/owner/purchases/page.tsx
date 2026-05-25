"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  ShoppingBag, 
  Plus, 
  Search, 
  RotateCcw,
  Calendar,
  X
} from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { ownerDashboardService } from "@/services/ownerDashboard.service";
import { productService } from "@/services/product.service";
import { Product } from "@/types/product";
import { formatDateIST, formatTimeIST } from "@/utils/date";

interface PurchaseItem {
  id: number;
  total_amount: number;
  purchase_date: string;
  created_at: string;
  suppliers?: any;
}

export default function OwnerPurchasesPage() {
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Modal form states
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [supplierName, setSupplierName] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  
  // Product details states
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | "">("");
  const [purchaseQty, setPurchaseQty] = useState("");
  const [unitBuyPrice, setUnitBuyPrice] = useState("");

  const loadPurchases = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("purchases")
        .select("id, total_amount, purchase_date, created_at, suppliers(name)")
        .order("purchase_date", { ascending: false });

      if (error) throw error;
      setPurchases(data || []);
    } catch (e) {
      toast.error("Failed to load purchases.");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      const { data, error } = await productService.getProducts();
      if (!error && data) {
        setAvailableProducts(data as Product[]);
      }
    } catch (err) {
      console.error("Failed to load products:", err);
    }
  }, []);

  useEffect(() => {
    loadPurchases();
    loadProducts();
  }, [loadPurchases, loadProducts]);

  const getSupplierName = (item: PurchaseItem) => {
    if (!item.suppliers) return "Direct Supplier";
    if (Array.isArray(item.suppliers)) return item.suppliers[0]?.name || "Direct Supplier";
    return item.suppliers.name || "Direct Supplier";
  };

  const { filteredPurchases, totalSpent, topSupplier } = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filtered = purchases.filter((p) => {
      const sName = getSupplierName(p).toLowerCase();
      return sName.includes(q) || p.purchase_date.includes(q);
    });

    const total = filtered.reduce((acc, p) => acc + Number(p.total_amount || 0), 0);
    const supplierTotals = filtered.reduce<Record<string, number>>((acc, p) => {
      const name = getSupplierName(p);
      acc[name] = (acc[name] || 0) + Number(p.total_amount || 0);
      return acc;
    }, {});

    const orderedSuppliers = Object.entries(supplierTotals).sort((a, b) => b[1] - a[1]);
    const top = orderedSuppliers[0]?.[0] || "—";

    return { filteredPurchases: filtered, totalSpent: total, topSupplier: top };
  }, [purchases, searchQuery]);

  const openModal = () => {
    setSupplierName("");
    setSelectedProductId("");
    setPurchaseQty("");
    setUnitBuyPrice("");
    setPurchaseDate(new Date().toISOString().split("T")[0]);
    setShowModal(true);
  };

  const handleAddPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      toast.error("Please enter a supplier name.");
      return;
    }
    if (!selectedProductId) {
      toast.error("Please select a product.");
      return;
    }
    const qty = parseInt(purchaseQty);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Please enter a valid positive quantity.");
      return;
    }
    const price = parseFloat(unitBuyPrice);
    if (isNaN(price) || price <= 0) {
      toast.error("Please enter a valid positive unit buy price.");
      return;
    }
    if (!purchaseDate) {
      toast.error("Please select a purchase date.");
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await ownerDashboardService.recordPurchase(
        supplierName,
        Number(selectedProductId),
        qty,
        price,
        purchaseDate
      );

      if (success) {
        toast.success("Purchase recorded and stock updated successfully.");
        setShowModal(false);
        loadPurchases();
        loadProducts(); // refresh products to update the stock displayed in the dropdown
      } else {
        toast.error("Failed to save purchase details.");
      }
    } catch (err) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-3 space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-black text-zinc-900 dark:text-white">Purchase Management</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Operational purchase register with fast search.</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:max-w-lg">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-zinc-400" />
            </span>
            <input
              type="text"
              placeholder="Search supplier or date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-10 pr-3 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-semibold"
            />
          </div>
          <button
            onClick={openModal}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Record Purchase
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-600 dark:text-zinc-400">
        <span className="rounded-full bg-zinc-100 dark:bg-zinc-900 px-3 py-1 font-semibold">Purchases {filteredPurchases.length}</span>
        <span className="rounded-full bg-zinc-100 dark:bg-zinc-900 px-3 py-1 font-semibold">Total Spend ₹{totalSpent.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        <span className="rounded-full bg-zinc-100 dark:bg-zinc-900 px-3 py-1 font-semibold truncate max-w-[220px]">Top Supplier {topSupplier}</span>
      </div>

      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-500 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Supplier</th>
                <th className="py-3 px-3">Purchase Date</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Logged</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900 text-zinc-700 dark:text-zinc-300">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wide">
                    Querying purchases registry...
                  </td>
                </tr>
              ) : filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wide">
                    No matching purchases found.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[200px]">
                      {getSupplierName(p)}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-500 dark:text-zinc-400">
                      {formatDateIST(p.purchase_date)}
                    </td>
                    <td className="py-2.5 px-3 font-black text-zinc-900 dark:text-zinc-100">
                      ₹{Number(p.total_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-zinc-400 dark:text-zinc-500">
                      {formatTimeIST(p.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-150 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                <th className="py-3 px-4">Supplier Name</th>
                <th className="py-3 px-4">Purchase Date</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Log Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider animate-pulse">
                    Querying purchases registry...
                  </td>
                </tr>
              ) : filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
                    No matching purchases found.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-900/25 transition-colors">
                    <td className="py-3 px-4 font-bold text-zinc-900 dark:text-zinc-100">
                      {p.suppliers ? (Array.isArray(p.suppliers) ? p.suppliers[0]?.name : p.suppliers.name) : "Direct Supplier"}
                    </td>
                    <td className="py-3 px-4">
                      {formatDateIST(p.purchase_date)}
                    </td>
                    <td className="py-3 px-4 font-black text-zinc-900 dark:text-zinc-100">
                      ₹{Number(p.total_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-zinc-400 dark:text-zinc-500 text-[10px]">
                      {formatTimeIST(p.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Purchase Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="relative bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-[scaleUp_0.2s_ease-out]">
            <div className="p-5 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
                  Record Supplier Purchase
                </h3>
                <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">
                  Log capital acquisition invoices
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPurchase} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                  Supplier Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter supplier name"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full text-sm py-2 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                  Select Tyre Product
                </label>
                <select
                  required
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full text-sm py-2 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                >
                  <option value="">-- Choose Product --</option>
                  {availableProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.brand} {p.model} ({p.tyre_size}) - Stock: {p.stock_qty}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                    Quantity Purchased
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    placeholder="Qty"
                    value={purchaseQty}
                    onChange={(e) => setPurchaseQty(e.target.value)}
                    className="w-full text-sm py-2 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                    Unit Buy Price (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    placeholder="Cost per tyre"
                    value={unitBuyPrice}
                    onChange={(e) => setUnitBuyPrice(e.target.value)}
                    className="w-full text-sm py-2 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    required
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full text-sm py-2 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                </div>

                <div className="space-y-1 flex flex-col justify-end pb-1.5">
                  <span className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                    Calculated Total
                  </span>
                  <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                    ₹{(Number(purchaseQty) * Number(unitBuyPrice) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer border border-transparent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:scale-[1.02] active:scale-[0.98] transition-all text-white text-xs font-extrabold shadow-lg shadow-indigo-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Saving..." : "Record Purchase"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
