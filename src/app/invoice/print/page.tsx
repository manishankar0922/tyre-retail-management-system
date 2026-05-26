"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { invoiceService } from "@/services/invoice.service";
import PrintPageClient from "@/components/invoice/PrintPageClient";

function PrintPageInner() {
  const searchParams = useSearchParams();
  const idStr = searchParams.get("id");
  const action = searchParams.get("action");

  const [invoice, setInvoice] = useState<any>(null);
  const [error, setError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const invoiceId = idStr ? parseInt(idStr, 10) : NaN;

  useEffect(() => {
    if (isNaN(invoiceId)) {
      setError(true);
      setIsLoading(false);
      return;
    }

    async function loadInvoice() {
      try {
        setIsLoading(true);
        const { data, error: fetchError } = await invoiceService.getInvoiceDetails(invoiceId);
        if (fetchError || !data) {
          setError(true);
        } else {
          setInvoice(data);
        }
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    }

    loadInvoice();
  }, [invoiceId]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 text-xs font-bold text-red-500">
        Invoice not found or failed to load.
      </div>
    );
  }

  if (isLoading || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 text-xs font-bold text-zinc-400">
        Loading printable invoice...
      </div>
    );
  }

  const shouldAutoPrint = action === "print" || action === "download";

  return <PrintPageClient invoice={invoice} shouldAutoPrint={shouldAutoPrint} />;
}

export default function InvoicePrintPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 text-xs font-bold text-zinc-400">
        Loading...
      </div>
    }>
      <PrintPageInner />
    </Suspense>
  );
}
