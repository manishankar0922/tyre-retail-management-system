import React from "react";
import { formatDateIST, formatTimeIST } from "@/utils/date";

interface InvoiceItem {
  id: number;
  qty: number;
  price: number;
  total: number;
  products: {
    id: number;
    brand: string;
    model: string;
    tyre_size: string;
  } | null;
}

interface InvoiceDetail {
  id: number;
  invoice_no: string;
  created_at: string;
  total_amount: number;
  payment_mode: string;
  customers: {
    name: string;
    phone: string;
    vehicle_no: string;
  } | null;
  invoice_items: InvoiceItem[];
}

interface PrintableInvoiceProps {
  invoice: InvoiceDetail;
}

export default function PrintableInvoice({ invoice }: PrintableInvoiceProps) {
  const dateStr = formatDateIST(invoice.created_at);
  const timeStr = formatTimeIST(invoice.created_at);

  // GST Breakdown calculations (18% GST inclusive standard)
  const totalAmount = Number(invoice.total_amount || 0);
  const taxableAmount = totalAmount / 1.18;
  const totalGst = totalAmount - taxableAmount;
  const cgst = totalGst / 2;
  const sgst = totalGst / 2;

  return (
    <div className="w-full max-w-[800px] mx-auto bg-white p-6 sm:p-8 border border-zinc-200 print:border-0 print:p-0 text-zinc-900 font-sans">
      {/* Print CSS Rules */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background-color: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 15mm 10mm 15mm 10mm;
          }
        }
      `}} />

      {/* Invoice Layout Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-zinc-900 pb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 uppercase">
            TyreRetail Pro ERP
          </h1>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
            Tyres & Services
          </p>
          <div className="text-[11px] text-zinc-500 mt-2.5 space-y-0.5 leading-relaxed font-semibold">
            <p>Opp. RTC Depot, Sri Swathi Complex</p>
            <p>Tadepalligudem - 534101, Andhra Pradesh</p>
            <p>Phone: +91 99999 88888 | GSTIN: 37AAAAA0000A1Z2</p>
          </div>
        </div>
        <div className="sm:text-right">
          <h2 className="text-lg font-black tracking-wider text-zinc-800 uppercase print:text-black">
            Retail Invoice
          </h2>
          <div className="text-xs mt-3.5 space-y-1.5 font-semibold text-zinc-650">
            <p>
              Invoice No: <span className="font-mono font-bold text-zinc-900">{invoice.invoice_no}</span>
            </p>
            <p>
              Date: <span className="text-zinc-900">{dateStr}</span> {timeStr && <span className="text-zinc-500 font-mono text-[10px]">&bull; {timeStr}</span>}
            </p>
            <p>
              Payment Mode: <span className="text-zinc-900 font-bold uppercase">{invoice.payment_mode}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Customer and Vehicle Metadata Block */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6 border-b border-zinc-200 text-xs font-semibold">
        <div>
          <h3 className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-2">
            Billed To:
          </h3>
          <p className="text-sm font-black text-zinc-900 uppercase">
            {invoice.customers?.name || "Walk-in Customer"}
          </p>
          {invoice.customers?.phone && (
            <p className="text-zinc-500 mt-1">
              Contact: <span className="text-zinc-800 font-mono">{invoice.customers.phone}</span>
            </p>
          )}
        </div>
        <div className="sm:text-right">
          <h3 className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-2">
            Vehicle Details:
          </h3>
          <p className="text-sm font-black font-mono text-zinc-900 uppercase">
            {invoice.customers?.vehicle_no || "N/A"}
          </p>
          <p className="text-[10px] text-zinc-400 mt-1 uppercase">
            Registered Number Plates
          </p>
        </div>
      </div>

      {/* Products Table */}
      <div className="py-6">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-100 print:bg-zinc-100 text-[10px] text-zinc-500 print:text-black font-extrabold uppercase tracking-wider border-b border-zinc-300">
              <th className="py-2.5 px-3 w-12 text-center">S.No</th>
              <th className="py-2.5 px-3">Description of Tyres</th>
              <th className="py-2.5 px-3 w-16 text-center">Qty</th>
              <th className="py-2.5 px-3 w-28 text-right">Unit Price</th>
              <th className="py-2.5 px-3 w-32 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {invoice.invoice_items.map((item, idx) => (
              <tr key={item.id} className="text-xs font-semibold text-zinc-800 print:text-black">
                <td className="py-3 px-3 text-center text-zinc-400 print:text-zinc-600 font-mono">
                  {idx + 1}
                </td>
                <td className="py-3 px-3">
                  {item.products ? (
                    <div>
                      <div className="font-black uppercase text-zinc-900">
                        {item.products.brand} {item.products.model}
                      </div>
                      <div className="text-[10px] text-zinc-500 print:text-zinc-600 font-mono mt-0.5">
                        Size: {item.products.tyre_size}
                      </div>
                    </div>
                  ) : (
                    <span className="italic text-zinc-400">Tyre Product</span>
                  )}
                </td>
                <td className="py-3 px-3 text-center font-mono">
                  {item.qty}
                </td>
                <td className="py-3 px-3 text-right font-mono">
                  ₹{Number(item.price).toFixed(2)}
                </td>
                <td className="py-3 px-3 text-right font-mono font-black">
                  ₹{Number(item.total).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Calculation Ledger & Signature Block */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start pt-4 border-t-2 border-zinc-900 mt-2">
        {/* Terms and Conditions */}
        <div className="text-[10px] text-zinc-500 leading-relaxed font-semibold">
          <h4 className="font-bold text-zinc-700 uppercase mb-1">Terms & Conditions:</h4>
          <ol className="list-decimal pl-4 space-y-0.5">
            <li>Goods once sold will not be taken back or exchanged.</li>
            <li>Warranty is directly subject to manufacturer terms and audits.</li>
            <li>All disputes are subject to Tadepalligudem jurisdiction.</li>
          </ol>
        </div>

        {/* GST Ledgers & Grand Total */}
        <div className="text-xs font-semibold space-y-1.5 w-full sm:max-w-xs sm:ml-auto">
          <div className="flex justify-between text-zinc-500">
            <span>Taxable Value:</span>
            <span className="font-mono">₹{taxableAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-zinc-500">
            <span>CGST (9%):</span>
            <span className="font-mono">₹{cgst.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-zinc-500">
            <span>SGST (9%):</span>
            <span className="font-mono">₹{sgst.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t border-zinc-200 pt-2 text-sm font-black text-zinc-900">
            <span>Grand Total (Incl. GST):</span>
            <span className="font-mono text-base">₹{totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Signature and Footer Area */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-16 text-center text-xs font-semibold">
        <div>
          <div className="w-48 mx-auto border-b border-zinc-400 pb-1 text-zinc-400 italic">
            Customer Signature
          </div>
        </div>
        <div className="sm:text-right">
          <div className="w-48 sm:ml-auto mx-auto border-b border-zinc-400 pb-1 text-zinc-950 font-bold uppercase">
            For TyreRetail Pro ERP
          </div>
          <p className="text-[10px] text-zinc-400 mt-8 uppercase font-bold tracking-wider">
            Authorized Signatory
          </p>
        </div>
      </div>
    </div>
  );
}
