"use client";

import React from "react";
import { Percent, Coins } from "lucide-react";
import { DiscountConfig, DiscountType } from "@/types/billing";

interface DiscountSectionProps {
  discount: DiscountConfig;
  onChange: (config: DiscountConfig) => void;
}

export default function DiscountSection({ discount, onChange }: DiscountSectionProps) {
  const handleTypeChange = (type: DiscountType) => {
    // Reset value on type change to prevent out-of-bounds inputs (e.g. 500% discount)
    onChange({ type, value: 0 });
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const value = parseFloat(rawVal) || 0;
    
    // Validate value bounds
    let cleanValue = Math.max(0, value);
    if (discount.type === "percentage") {
      cleanValue = Math.min(100, cleanValue);
    }
    
    onChange({ ...discount, value: cleanValue });
  };

  return (
    <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-none space-y-4 h-full">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider">
          Discount Settings
        </h4>
        <div className="flex bg-zinc-200 dark:bg-zinc-950 p-0.5 rounded-lg border border-zinc-300 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => handleTypeChange("percentage")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
              discount.type === "percentage"
                ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
            }`}
          >
            <Percent className="w-3 h-3" />
            <span>Percentage</span>
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange("fixed")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
              discount.type === "fixed"
                ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
            }`}
          >
            <Coins className="w-3 h-3" />
            <span>Fixed Amt</span>
          </button>
        </div>
      </div>

      <div className="relative">
        <span className="absolute inset-y-0 left-3.5 flex items-center text-zinc-400 dark:text-zinc-500 font-extrabold text-xs pointer-events-none">
          {discount.type === "percentage" ? "%" : "₹"}
        </span>
        <input
          type="number"
          min="0"
          max={discount.type === "percentage" ? "100" : undefined}
          step="any"
          placeholder={discount.type === "percentage" ? "Enter percentage (e.g. 10)" : "Enter amount (e.g. 500)"}
          value={discount.value || ""}
          onChange={handleValueChange}
          className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs py-2.5 pl-8 pr-4 rounded-lg text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition-all font-mono font-bold"
        />
      </div>
    </div>
  );
}
