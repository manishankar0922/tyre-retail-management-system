"use client";

import React from "react";
import InvoiceHeader from "./InvoiceHeader";
import InvoiceTotals from "./InvoiceTotals";
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
  subtotal?: number;
  discount_amount?: number;
  gst_amount?: number;
  total_amount: number;
  payment_mode: string;
  customers: {
    name: string;
    phone: string;
    vehicle_no: string;
  } | null;
  invoice_items: InvoiceItem[];
}

interface A4InvoiceProps {
  invoice: InvoiceDetail;
}

export default function A4Invoice({ invoice }: A4InvoiceProps) {
  const dateStr = formatDateIST(invoice.created_at);
  const timeStr = formatTimeIST(invoice.created_at);

  // Bounded fallbacks for financial metrics to support legacy records
  const totalAmount = Number(invoice.total_amount || 0);
  const discountAmount = Number(invoice.discount_amount || 0);
  
  // If subtotal exists, use it. Otherwise, back-calculate using inclusive GST assumption (18% inclusive)
  let subtotal = Number(invoice.subtotal);
  let gstAmount = Number(invoice.gst_amount);

  if (isNaN(subtotal) || invoice.subtotal === null || invoice.subtotal === undefined) {
    const taxableVal = totalAmount / 1.18;
    gstAmount = totalAmount - taxableVal;
    subtotal = taxableVal;
  }

  return (
    <div className="w-full bg-white p-8 sm:p-10 text-zinc-900 font-sans leading-normal">
      {/* Dynamic Invoice Header */}
      <InvoiceHeader 
        layout="a4" 
        invoiceNo={invoice.invoice_no} 
        dateStr={`${dateStr} ${timeStr ? `at ${timeStr}` : ""}`} 
      />

      {/* Structured Customer and Vehicle Metadata Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-zinc-50 border border-zinc-200/80 p-5 rounded-2xl text-xs font-semibold mb-6">
        <div>
          <h3 className="text-[10px] uppercase font-extrabold text-zinc-400 tracking-wider mb-2">
            BILL TO:
          </h3>
          <p className="text-sm font-black text-zinc-950 uppercase">
            {invoice.customers?.name || "Walk-in Customer"}
          </p>
          {invoice.customers?.phone && (
            <p className="text-zinc-650 mt-1 font-medium">
              Contact: <span className="text-zinc-950 font-mono font-semibold">{invoice.customers.phone}</span>
            </p>
          )}
        </div>
        <div className="sm:text-right">
          <h3 className="text-[10px] uppercase font-extrabold text-zinc-400 tracking-wider mb-2">
            VEHICLE DETAILS:
          </h3>
          <p className="text-sm font-black font-mono text-zinc-950 uppercase">
            {invoice.customers?.vehicle_no || "WALK-IN"}
          </p>
          <p className="text-[10px] text-zinc-400 mt-1 uppercase font-bold tracking-wider">
            Registered Number Plate
          </p>
        </div>
      </div>

      {/* Spacious Product Table */}
      <div className="mb-6 overflow-hidden rounded-xl border border-zinc-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-900 text-[10px] text-white font-black uppercase tracking-wider">
              <th className="py-3.5 px-4 w-12 text-center">S.No</th>
              <th className="py-3.5 px-4">Description of Tyres</th>
              <th className="py-3.5 px-4 w-20 text-center">Qty</th>
              <th className="py-3.5 px-4 w-32 text-right">Unit Price</th>
              <th className="py-3.5 px-4 w-36 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {invoice.invoice_items.map((item, idx) => (
              <tr key={item.id} className="text-xs font-semibold text-zinc-800 hover:bg-zinc-50/50 transition-colors">
                <td className="py-3.5 px-4 text-center text-zinc-400 font-mono">
                  {idx + 1}
                </td>
                <td className="py-3.5 px-4">
                  {item.products ? (
                    <div>
                      <div className="font-extrabold uppercase text-zinc-950">
                        {item.products.brand} {item.products.model}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                        Size: {item.products.tyre_size}
                      </div>
                    </div>
                  ) : (
                    <span className="italic text-zinc-400">Tyre Product</span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-center font-mono font-bold text-zinc-950">
                  {item.qty}
                </td>
                <td className="py-3.5 px-4 text-right font-mono">
                  ₹{Number(item.price).toFixed(2)}
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-black text-zinc-950">
                  ₹{Number(item.total).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Indian Compliant CGST/SGST ledger totals */}
      <InvoiceTotals
        layout="a4"
        subtotal={subtotal}
        discountAmount={discountAmount}
        gstAmount={gstAmount}
        totalAmount={totalAmount}
        paymentMode={invoice.payment_mode}
      />

      {/* Signature and Footer Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-12 text-center text-xs font-semibold mt-4 border-t border-zinc-100">
        <div>
          <div className="w-44 mx-auto border-b border-zinc-350 pb-1.5 text-zinc-400 italic font-medium">
            Customer Signature
          </div>
        </div>
        <div className="sm:text-right">
          <div className="w-48 sm:ml-auto mx-auto border-b border-zinc-355 pb-1.5 text-zinc-950 font-black uppercase">
            For TyreRetail Pro ERP
          </div>
          <p className="text-[9px] text-zinc-400 mt-6 uppercase font-extrabold tracking-wider">
            Authorized Signatory
          </p>
        </div>
      </div>
    </div>
  );
}
