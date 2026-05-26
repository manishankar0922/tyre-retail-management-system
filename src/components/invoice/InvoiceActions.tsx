"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Printer, Download, Sparkles, CheckCircle2 } from "lucide-react";
import { invoiceService } from "@/services/invoice.service";
import { getInvoiceFilename } from "@/utils/pdfNaming";
import { createInvoicePdfBlob } from "@/utils/invoicePdf";

interface InvoiceActionsProps {
  invoiceId: number;
  invoiceNo: string;
  onClose?: () => void;
}

export default function InvoiceActions({ invoiceId, invoiceNo, onClose }: InvoiceActionsProps) {
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState(false);

  const handlePrint = () => {
    router.push(`/invoice/print?id=${invoiceId}&action=print`);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const { data, error } = await invoiceService.getInvoiceDetails(invoiceId);
      if (error || !data) {
        throw new Error(error?.message || "Unable to fetch invoice details for PDF generation.");
      }

      const blob = await createInvoicePdfBlob(data);
      const fileName = `${getInvoiceFilename(invoiceNo)}.pdf`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      anchor.style.display = "none";
      document.body.appendChild(anchor);
      anchor.click();
      setTimeout(() => {
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
      }, 150);
    } catch (downloadError) {
      console.error("Invoice PDF download failed:", downloadError);
      window.alert("Unable to download invoice PDF at this time. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadAndPrint = async () => {
    await handleDownload();
    handlePrint();
  };

  return (
    <div className="bg-white dark:bg-zinc-950 border border-indigo-200/60 dark:border-zinc-850 p-6 rounded-2xl shadow-xl space-y-5">
      {/* Action Title Header */}
      <div className="flex items-start gap-3 border-b border-zinc-100 dark:border-zinc-900 pb-4">
        <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-xl">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
            Invoice Generated Successfully!
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Reference No: <span className="font-mono font-bold text-indigo-650 dark:text-indigo-400">{invoiceNo}</span>
          </p>
        </div>
      </div>

      {/* Action Panel Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Print Button */}
        <button
          onClick={handlePrint}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-xl transition-all cursor-pointer shadow-sm hover:scale-[1.01]"
        >
          <Printer className="w-4 h-4 text-zinc-500" />
          <span>Print Invoice</span>
        </button>

        {/* Download PDF Button */}
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 text-xs font-extrabold text-indigo-600 dark:text-indigo-400 border border-indigo-200/30 dark:border-indigo-900/30 rounded-xl transition-all cursor-pointer shadow-sm hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Download className="w-4 h-4" />
          <span>{isDownloading ? "Downloading..." : "Save PDF"}</span>
        </button>

        {/* Download & Print Button */}
        <button
          onClick={handleDownloadAndPrint}
          disabled={isDownloading}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-md hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isDownloading ? "Downloading..." : "Download & Print"}</span>
        </button>
      </div>

      {/* UX Help text for Download */}
      <div className="text-[10px] text-zinc-400 leading-relaxed font-semibold bg-zinc-50 dark:bg-zinc-900/20 p-3 rounded-lg border border-zinc-100 dark:border-zinc-900/50">
        <p className="font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-wider mb-1">
          💡 Pro-Tip for PDF Saving:
        </p>
        In the browser print window that opens, change the **Destination** printer to **"Save as PDF"** or **"Microsoft Print to PDF"** and click Save.
      </div>

      {/* Done / Close button */}
      {onClose && (
        <div className="flex justify-end pt-2 border-t border-zinc-100 dark:border-zinc-900">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all cursor-pointer"
          >
            Clear Screen & Continue
          </button>
        </div>
      )}
    </div>
  );
}
