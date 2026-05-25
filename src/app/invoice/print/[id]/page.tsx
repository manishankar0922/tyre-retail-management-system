import { invoiceService } from "@/services/invoice.service";
import PrintPageClient from "@/components/invoice/PrintPageClient";
import { notFound } from "next/navigation";

export const unstable_instant = false;

interface PrintPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ action?: string }>;
}

export default async function InvoicePrintPage(props: PrintPageProps) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  const invoiceId = parseInt(params.id, 10);
  if (isNaN(invoiceId)) {
    return notFound();
  }

  // Fetch invoice details on the server (includes customer, items, and products)
  const { data: invoice, error } = await invoiceService.getInvoiceDetails(invoiceId);

  if (error || !invoice) {
    console.error("Error loading invoice for printing:", error);
    return notFound();
  }

  const shouldAutoPrint = searchParams.action === "print" || searchParams.action === "download";

  return (
    <PrintPageClient 
      invoice={invoice as any} 
      shouldAutoPrint={shouldAutoPrint} 
    />
  );
}
