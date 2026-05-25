import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatIST } from "@/utils/date";

interface InvoiceItemProduct {
  brand?: string;
  model?: string;
  tyre_size?: string;
}

interface InvoiceItem {
  qty?: number;
  price?: number;
  total?: number;
  products?: InvoiceItemProduct | null;
}

interface InvoiceCustomer {
  name?: string;
  phone?: string;
  vehicle_no?: string;
}

interface InvoicePdfPayload {
  invoice_no?: string;
  created_at?: string;
  payment_mode?: string;
  subtotal?: number;
  discount_amount?: number;
  gst_amount?: number;
  total_amount?: number;
  customers?: InvoiceCustomer | null;
  invoice_items?: InvoiceItem[];
}

const formatCurrency = (value: number | undefined) => {
  if (value === undefined || value === null || Number.isNaN(value)) return "₹0.00";
  return `₹${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const safeString = (value: unknown) => {
  if (value === null || value === undefined) return "-";
  return String(value);
};

export async function createInvoicePdfBlob(invoice: InvoicePdfPayload): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margin = 40;
  const maxWidth = page.getWidth() - margin * 2;
  let y = page.getHeight() - margin;
  const lineHeight = 16;

  const drawText = (text: string, options: { size?: number; font?: any; color?: any; x?: number } = {}) => {
    const font = options.font || helvetica;
    const size = options.size || 10;
    page.drawText(text, {
      x: options.x ?? margin,
      y,
      size,
      font,
      color: options.color || rgb(0.1, 0.1, 0.1),
      maxWidth,
    });
    y -= lineHeight;
  };

  drawText("TyreRetail Pro ERP", { size: 18, font: helveticaBold, color: rgb(0.07, 0.1, 0.25) });
  y -= 4;
  drawText("Auto-generated Invoice", { size: 11, color: rgb(0.35, 0.35, 0.35) });
  y -= 8;

  drawText(`Invoice Number: ${safeString(invoice.invoice_no)}`, { font: helveticaBold });
  drawText(`Date: ${invoice.created_at ? formatIST(invoice.created_at) : "-"}`);
  drawText(`Payment Mode: ${safeString(invoice.payment_mode)}`);
  y -= 4;

  drawText("Bill To:", { font: helveticaBold, size: 12 });
  drawText(`Name: ${safeString(invoice.customers?.name || "Walk-in Customer")}`);
  drawText(`Phone: ${safeString(invoice.customers?.phone)}`);
  drawText(`Vehicle: ${safeString(invoice.customers?.vehicle_no)}`);
  y -= 4;

  drawText("Invoice Items:", { font: helveticaBold, size: 12 });
  drawText("Item                                    Qty    Rate       Total", { size: 10, font: helveticaBold });
  drawText("--------------------------------------------------------------", { size: 10 });

  const items = invoice.invoice_items || [];
  if (items.length === 0) {
    drawText("No invoice items found.");
  } else {
    for (const item of items) {
      const label = `${safeString(item.products?.brand)} ${safeString(item.products?.model)} ${safeString(item.products?.tyre_size)}`.trim();
      const itemText = label.length > 35 ? `${label.slice(0, 32)}...` : label;
      const qtyText = `${item.qty ?? 0}`.padStart(3);
      const rateText = formatCurrency(item.price).padStart(10);
      const totalText = formatCurrency(item.total).padStart(11);
      drawText(`${itemText.padEnd(36)}${qtyText}${rateText}${totalText}`);
    }
  }

  y -= 8;
  drawText("Summary:", { font: helveticaBold, size: 12 });
  drawText(`Subtotal: ${formatCurrency(invoice.subtotal)}`);
  drawText(`Discount: ${formatCurrency(invoice.discount_amount)}`);
  drawText(`GST: ${formatCurrency(invoice.gst_amount)}`);
  drawText(`Grand Total: ${formatCurrency(invoice.total_amount)}`, { font: helveticaBold });

  y -= 8;
  drawText("Thank you for your business!", { color: rgb(0.2, 0.2, 0.5) });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
}
