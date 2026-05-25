"use client";

import React from "react";
import { Printer } from "lucide-react";
import { getInvoiceFilename } from "@/utils/pdfNaming";

export default function PrintActionButton({ invoiceNo }: { invoiceNo?: string }) {
  const handlePrint = () => {
    try {
      const originalTitle = document.title;
      if (invoiceNo) {
        document.title = getInvoiceFilename(invoiceNo);
      }
      window.print();
      // Small timeout to allow the browser print dialog to pick up the title
      setTimeout(() => {
        document.title = originalTitle;
      }, 100);
    } catch (err) {
      console.error("Print dialog failed:", err);
    }
  };

  return (
    <button
      onClick={handlePrint}
      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold rounded-lg shadow-sm transition-all cursor-pointer"
    >
      <Printer className="w-3.5 h-3.5" />
      <span>Trigger Print Dialog</span>
    </button>
  );
}
