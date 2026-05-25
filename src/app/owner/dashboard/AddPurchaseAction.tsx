"use client";

import React, { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { ownerDashboardService } from "@/services/ownerDashboard.service";

interface AddPurchaseActionProps {
  products: { id: number; brand: string; model: string; tyre_size: string; stock_qty: number }[];
}

export default function AddPurchaseAction({ products }: AddPurchaseActionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Modal State
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [isSubmittingPurchase, setIsSubmittingPurchase] = useState(false);
  const [supplierName, setSupplierName] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<number | "">("");
  const [purchaseQty, setPurchaseQty] = useState("");
  const [unitBuyPrice, setUnitBuyPrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");

  const openAddPurchaseModal = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    setSupplierName("");
    setSelectedProductId("");
    setPurchaseQty("");
    setUnitBuyPrice("");
    setPurchaseDate(todayStr);
    setShowPurchaseModal(true);
  };

  const handleAddPurchaseSubmit = async (e: React.FormEvent) => {
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
    const buyPrice = parseFloat(unitBuyPrice);
    if (isNaN(buyPrice) || buyPrice <= 0) {
      toast.error("Please enter a valid positive unit buy price.");
      return;
    }
    if (!purchaseDate) {
      toast.error("Please choose a purchase date.");
      return;
    }

    setIsSubmittingPurchase(true);
    try {
      const success = await ownerDashboardService.recordPurchase(
        supplierName,
        Number(selectedProductId),
        qty,
        buyPrice,
        purchaseDate
      );

      if (success) {
        toast.success("Purchase recorded successfully. Stock updated.");
        setShowPurchaseModal(false);
        
        // Dispatch event for other tabs (Inventory sync)
        if (typeof window !== "undefined") {
          localStorage.setItem("purchase_saved_event", JSON.stringify({
            productId: selectedProductId,
            qty,
            timestamp: Date.now()
          }));
        }

        startTransition(() => {
          router.refresh();
        });
      } else {
        toast.error("Failed to save purchase details.");
      }
    } catch (err) {
      toast.error("A network error occurred.");
    } finally {
      setIsSubmittingPurchase(false);
    }
  };

  return (
    <>
      <button
        onClick={openAddPurchaseModal}
        disabled={isPending}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:scale-[1.02] active:scale-[0.98] transition-all text-white text-xs font-black shadow-lg shadow-indigo-500/20 cursor-pointer disabled:opacity-50"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>{isPending ? "Updating..." : "Add Purchase"}</span>
      </button>

      {/* Supplier Purchase Modal Drawer */}
      {showPurchaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="relative bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-[scaleUp_0.2s_ease-out]">
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
                  Record Supplier Purchase
                </h3>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">
                  Log capital acquisition invoices
                </p>
              </div>
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddPurchaseSubmit} className="p-6 space-y-4">
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

              {/* Product dropdown */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                  Select Product
                </label>
                <select
                  required
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full text-sm py-2 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                >
                  <option value="">-- Choose Tyre Product --</option>
                  {products.map((prod) => (
                    <option key={prod.id} value={prod.id}>
                      {prod.brand} {prod.model} ({prod.tyre_size}) - Stock: {prod.stock_qty}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                    Quantity (pcs)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
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
                    min="0.01"
                    step="0.01"
                    placeholder="Per unit cost"
                    value={unitBuyPrice}
                    onChange={(e) => setUnitBuyPrice(e.target.value)}
                    className="w-full text-sm py-2 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                    Total Amount (₹)
                  </label>
                  <div className="w-full text-sm py-2 px-3 rounded-xl border border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 font-mono font-bold flex items-center">
                    ₹{(Number(purchaseQty || 0) * Number(unitBuyPrice || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                </div>

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
              </div>

              {/* Form Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer border border-transparent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPurchase}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:scale-[1.02] active:scale-[0.98] transition-all text-white text-xs font-extrabold shadow-lg shadow-indigo-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingPurchase ? "Saving..." : "Record Purchase"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
