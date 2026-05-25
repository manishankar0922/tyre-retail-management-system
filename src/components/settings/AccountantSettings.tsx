"use client";

import React, { useEffect, useState } from "react";
import { Printer, Sliders, Sun, Moon, Laptop, CheckCircle2 } from "lucide-react";
import { settingsService, PrintTemplateType } from "@/services/settings.service";
import PrintTemplateSelector from "./PrintTemplateSelector";

export default function AccountantSettings() {
  const [template, setTemplate] = useState<PrintTemplateType>("a4");
  const [autoPrint, setAutoPrint] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setTemplate(settingsService.getPrintTemplate());
    setAutoPrint(settingsService.getAutoPrint());
  }, []);

  const handleSave = () => {
    settingsService.setPrintTemplate(template);
    settingsService.setAutoPrint(autoPrint);
    
    setSuccessMsg("Accountant settings updated successfully.");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-450 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Settings Card */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-850 p-6 rounded-2xl shadow-sm space-y-6">
        <h3 className="font-extrabold text-sm text-zinc-850 dark:text-zinc-100 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-900 pb-3 uppercase tracking-wider text-xs">
          <Printer className="w-4 h-4 text-zinc-400" />
          <span>Invoice Printing Setup</span>
        </h3>

        {/* 1. Print Template */}
        <PrintTemplateSelector value={template} onChange={setTemplate} />

        {/* 2. Auto-Print Checkbox */}
        <div className="pt-2">
          <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-505 block mb-2">
            Automated Workflows
          </label>
          <div className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800 rounded-xl">
            <input
              type="checkbox"
              id="auto-print"
              checked={autoPrint}
              onChange={(e) => setAutoPrint(e.target.checked)}
              className="w-4 h-4 text-indigo-600 bg-zinc-100 dark:bg-zinc-900 border-zinc-350 dark:border-zinc-800 rounded focus:ring-indigo-500 mt-0.5 cursor-pointer"
            />
            <div className="text-xs">
              <label htmlFor="auto-print" className="font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer select-none">
                Auto-Trigger Print Dialog
              </label>
              <p className="text-[10px] text-zinc-450 dark:text-zinc-500 mt-0.5">
                Automatically opens browser printer dialogue upon invoice generation success.
              </p>
            </div>
          </div>
        </div>
      </div>



      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-lg hover:scale-[1.01]"
        >
          Save Configuration
        </button>
      </div>
    </div>
  );
}
