"use client";

import React from "react";
import { Receipt, FileText, CheckCircle2 } from "lucide-react";
import { PrintTemplateType } from "@/services/settings.service";

interface PrintTemplateSelectorProps {
  value: PrintTemplateType;
  onChange: (value: PrintTemplateType) => void;
}

export default function PrintTemplateSelector({ value, onChange }: PrintTemplateSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
        Selected Print Template
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Thermal Receipt Card */}
        <button
          type="button"
          onClick={() => onChange("thermal")}
          className={`flex items-start gap-4 p-4 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden group
            ${
              value === "thermal"
                ? "bg-indigo-50/40 dark:bg-indigo-950/10 border-indigo-500 text-zinc-800 dark:text-zinc-100 shadow-sm"
                : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-850 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700"
            }`}
        >
          <div
            className={`p-2.5 rounded-lg border transition-all ${
              value === "thermal"
                ? "bg-indigo-550 border-indigo-500 text-white shadow-sm"
                : "bg-zinc-50 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 text-zinc-400 group-hover:text-zinc-650"
            }`}
          >
            <Receipt className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 pr-4">
            <h4 className="text-xs font-bold text-zinc-850 dark:text-zinc-200">
              Thermal Receipt (3 Inch)
            </h4>
            <p className="text-[10px] text-zinc-450 dark:text-zinc-500 mt-1 font-medium leading-relaxed">
              Ultra-compact, narrow width (80mm), optimized for fast ticket sales and thermal printers.
            </p>
          </div>
          {value === "thermal" && (
            <CheckCircle2 className="w-4.5 h-4.5 text-indigo-500 absolute top-4 right-4" />
          )}
        </button>

        {/* A4 Professional Card */}
        <button
          type="button"
          onClick={() => onChange("a4")}
          className={`flex items-start gap-4 p-4 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden group
            ${
              value === "a4"
                ? "bg-indigo-50/40 dark:bg-indigo-950/10 border-indigo-500 text-zinc-800 dark:text-zinc-100 shadow-sm"
                : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-850 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700"
            }`}
        >
          <div
            className={`p-2.5 rounded-lg border transition-all ${
              value === "a4"
                ? "bg-indigo-550 border-indigo-500 text-white shadow-sm"
                : "bg-zinc-50 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 text-zinc-400 group-hover:text-zinc-650"
            }`}
          >
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 pr-4">
            <h4 className="text-xs font-bold text-zinc-850 dark:text-zinc-200">
              A4 Professional Invoice
            </h4>
            <p className="text-[10px] text-zinc-450 dark:text-zinc-500 mt-1 font-medium leading-relaxed">
              Standard full-width business invoice. Compliant layout with item tables and detailed tax splits.
            </p>
          </div>
          {value === "a4" && (
            <CheckCircle2 className="w-4.5 h-4.5 text-indigo-500 absolute top-4 right-4" />
          )}
        </button>
      </div>
    </div>
  );
}
