"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { settingsService, PrintTemplateType } from "@/services/settings.service";
import A4Invoice from "./A4Invoice";
import ThermalInvoice from "./ThermalInvoice";
import PrintActionButton from "./PrintActionButton";

interface PrintPageClientProps {
  invoice: any;
  shouldAutoPrint: boolean;
}

import { getInvoiceFilename } from "@/utils/pdfNaming";

export default function PrintPageClient({ invoice, shouldAutoPrint }: PrintPageClientProps) {
  const [template, setTemplate] = useState<PrintTemplateType | null>(null);

  useEffect(() => {
    // Read the template selection from local settings
    const activeTemplate = settingsService.getPrintTemplate();
    setTemplate(activeTemplate);

    // Auto trigger print check
    const isAutoPrintPrefEnabled = settingsService.getAutoPrint();
    if (shouldAutoPrint && isAutoPrintPrefEnabled) {
      const timer = setTimeout(() => {
        const originalTitle = document.title;
        if (invoice?.invoice_no) {
          document.title = getInvoiceFilename(invoice.invoice_no);
        }
        window.print();
        setTimeout(() => {
          document.title = originalTitle;
        }, 100);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [shouldAutoPrint, invoice]);

  if (template === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 text-xs font-bold text-zinc-450">
        Loading printable template layout...
      </div>
    );
  }

  // Adjust container styles
  const isThermal = template === "thermal";
  const containerClass = isThermal
    ? "min-h-screen print:min-h-fit print:h-auto bg-zinc-50 dark:bg-zinc-900 py-6 print:py-0 print:bg-white flex flex-col items-center"
    : "min-h-screen print:min-h-fit print:h-auto bg-zinc-50 dark:bg-zinc-900 py-6 print:py-0 print:bg-white";

  const widthClass = isThermal ? "max-w-[340px] w-full" : "max-w-[800px] w-full";
  
  const sheetClass = isThermal
    ? "bg-white print:bg-white border border-zinc-200 print:border-0 rounded-2xl print:rounded-none overflow-hidden print:w-full print:max-w-none"
    : "bg-white print:bg-white shadow-md print:shadow-none rounded-2xl print:rounded-none max-w-[850px] mx-auto overflow-hidden";

  return (
    <div className={containerClass}>
      {/* Top action bar: Hidden during printing */}
      <div className={`mx-auto mb-6 px-4 print:hidden no-print ${widthClass}`}>
        <div className="flex items-center justify-between bg-white dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-850 shadow-sm gap-4">
          <Link
            href="/accountant/invoices"
            className="flex items-center gap-1 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Invoices</span>
          </Link>
          
          <PrintActionButton invoiceNo={invoice?.invoice_no} />
        </div>
      </div>

      {/* Main Invoice Card Sheet */}
      <div className={sheetClass}>
        {isThermal ? (
          <ThermalInvoice invoice={invoice} />
        ) : (
          <A4Invoice invoice={invoice} />
        )}
      </div>
    </div>
  );
}
