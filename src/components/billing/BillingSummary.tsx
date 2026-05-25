"use client";

import React from "react";
import { BillingSummaryResult } from "@/types/billing";

interface BillingSummaryProps {
  summary: BillingSummaryResult;
  paymentMode: "Cash" | "UPI" | "Card";
  onChangePaymentMode: (mode: "Cash" | "UPI" | "Card") => void;
  onCheckout: () => void;
  isLoading: boolean;
  customerSelected: boolean;
}

export default function BillingSummary({
  summary,
  paymentMode,
  onChangePaymentMode,
  onCheckout,
  isLoading,
  customerSelected,
}: BillingSummaryProps) {
  const { subtotal, discountAmount, gstAmount, finalTotal } = summary;

  return (
    <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
      <h3 className="text-xs font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-900 pb-3">
        Payment & Summary
      </h3>

      {/* Payment mode selection */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
          Payment Mode
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(["Cash", "UPI", "Card"] as const).map((mode) => {
            const isSelected = paymentMode === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => onChangePaymentMode(mode)}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10"
                    : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/80"
                }`}
              >
                {mode}
              </button>
            );
          })}
        </div>
      </div>

      {/* Calculations Breakdown */}
      <div className="space-y-3 font-semibold text-xs border-t border-zinc-100 dark:border-zinc-900 pt-4">
        <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
          <span>Subtotal</span>
          <span className="font-mono text-zinc-800 dark:text-zinc-200 font-bold">
            ₹{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        
        {discountAmount > 0 && (
          <div className="flex justify-between text-emerald-600 dark:text-emerald-450">
            <span>Discount (Subtracted)</span>
            <span className="font-mono font-bold">
              - ₹{discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}

        {gstAmount > 0 && (
          <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
            <span>GST Tax (Added)</span>
            <span className="font-mono text-zinc-800 dark:text-zinc-200 font-bold">
              + ₹{gstAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-zinc-200 dark:border-zinc-900 my-2 pt-3 flex justify-between items-end">
          <div>
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
              Grand Total
            </span>
            <p className="text-[9px] text-zinc-400 dark:text-zinc-500 uppercase font-semibold">
              Prices inclusive of config taxes
            </p>
          </div>
          <span className="text-xl font-black font-mono text-zinc-900 dark:text-white leading-none">
            ₹{finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Checkout CTA */}
      <button
        type="button"
        onClick={onCheckout}
        disabled={isLoading || !customerSelected}
        className={`w-full py-3.5 px-4 text-xs font-black rounded-xl text-center shadow-lg transition-all cursor-pointer ${
          !customerSelected
            ? "bg-zinc-200 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-600 cursor-not-allowed border border-transparent shadow-none"
            : "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/10 hover:scale-[1.01] active:scale-[0.99]"
        }`}
      >
        {isLoading
          ? "Processing Checkout..."
          : !customerSelected
          ? "Please Select Customer"
          : "Generate Bill & Complete Sale"}
      </button>
    </div>
  );
}
