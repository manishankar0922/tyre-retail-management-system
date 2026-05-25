"use client";

import React from "react";
import { Percent } from "lucide-react";
import { GstConfig } from "@/types/billing";

interface GstSectionProps {
  gst: GstConfig;
  onChange: (config: GstConfig) => void;
}

const COMMON_GST_RATES = [5, 12, 18];

export default function GstSection({ gst, onChange }: GstSectionProps) {
  const handleToggle = () => {
    onChange({ ...gst, enabled: !gst.enabled });
  };

  const handleRateChange = (rate: number) => {
    onChange({ ...gst, rate });
  };

  return (
    <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-none space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider">
            GST Settings
          </h4>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">
            Add standard taxation
          </p>
        </div>
        
        {/* Toggle Switch */}
        <button
          type="button"
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            gst.enabled ? "bg-indigo-600" : "bg-zinc-200 dark:bg-zinc-800"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              gst.enabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {gst.enabled && (
        <div className="space-y-3 pt-1 flex-1 flex flex-col justify-end">
          <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
            Select GST Rate (%)
          </label>
          <div className="flex gap-2">
            {COMMON_GST_RATES.map((rate) => {
              const isSelected = gst.rate === rate;
              return (
                <button
                  key={rate}
                  type="button"
                  onClick={() => handleRateChange(rate)}
                  className={`flex-1 flex items-center justify-center gap-1 py-2 px-3 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-white border-indigo-300 text-indigo-600 dark:bg-zinc-800 dark:border-indigo-900 dark:text-indigo-400"
                      : "bg-zinc-200/50 border-zinc-200 text-zinc-500 hover:text-zinc-800 hover:bg-white dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
                  }`}
                >
                  <span>{rate}</span>
                  <Percent className="w-3 h-3 opacity-60" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
