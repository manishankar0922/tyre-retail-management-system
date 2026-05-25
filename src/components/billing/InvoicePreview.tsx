"use client";

import React from "react";
import { Customer } from "@/types/customer";
import { BillingItem, BillingSummaryResult, DiscountConfig, GstConfig } from "@/types/billing";
import { Receipt, Disc } from "lucide-react";
import { formatDateIST } from "@/utils/date";

interface InvoicePreviewProps {
  customer: Customer | null;
  items: BillingItem[];
  summary: BillingSummaryResult;
  discount: DiscountConfig;
  gst: GstConfig;
  paymentMode: string;
}

export default function InvoicePreview({
  customer,
  items,
  summary,
  discount,
  gst,
  paymentMode,
}: InvoicePreviewProps) {
  const { subtotal, discountAmount, taxableAmount, gstAmount, cgstAmount, sgstAmount, finalTotal } = summary;
  const [todayDate, setTodayDate] = React.useState("");

  React.useEffect(() => {
    setTodayDate(formatDateIST(new Date()));
  }, []);

  const validItems = items.filter(item => item.product && item.qty > 0);

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header Bar */}
      <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-900 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/20">
        <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
          <Receipt className="w-4 h-4 text-indigo-500" />
          <h3 className="font-extrabold text-xs uppercase tracking-wider">Live Invoice Preview</h3>
        </div>
        <span className="text-[9px] font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 rounded uppercase tracking-wider">
          Draft
        </span>
      </div>

      {/* Preview Sheet Area */}
      <div className="p-6 flex-1 overflow-y-auto space-y-5 select-none text-zinc-800 dark:text-zinc-300 font-sans text-[11px] leading-relaxed">
        {/* Mock Store Details */}
        <div className="flex justify-between items-start border-b border-zinc-100 dark:border-zinc-900 pb-4">
          <div>
            <div className="flex items-center gap-1.5 font-black text-xs text-zinc-900 dark:text-white uppercase tracking-tight">
              <Disc className="w-4 h-4 text-indigo-500" />
              <span>TyreRetail Pro ERP</span>
            </div>
            <p className="text-[9px] text-zinc-500 dark:text-zinc-500 mt-1">Opp. RTC Depot, Sri Swathi Complex</p>
            <p className="text-[9px] text-zinc-500 dark:text-zinc-500">Tadepalligudem - 534101</p>
          </div>
          <div className="text-right text-[10px] space-y-0.5 font-semibold text-zinc-500">
            <p className="font-mono text-zinc-900 dark:text-zinc-100">INV-PREVIEW</p>
            <p>{todayDate}</p>
            <p className="uppercase text-indigo-600 dark:text-indigo-400 font-extrabold">{paymentMode}</p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="grid grid-cols-2 gap-3 bg-zinc-50/50 dark:bg-zinc-900/30 p-3 rounded-xl border border-zinc-200/40 dark:border-zinc-900/40 font-semibold">
          <div>
            <p className="text-[9px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-extrabold">Billed To:</p>
            <p className="text-zinc-800 dark:text-zinc-200 uppercase mt-0.5 font-bold">{customer?.name || "Walk-in Customer"}</p>
            {customer?.phone && <p className="text-zinc-500 font-mono text-[10px] mt-0.5">{customer.phone}</p>}
          </div>
          <div className="text-right">
            <p className="text-[9px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-extrabold">Vehicle Number:</p>
            <p className="font-mono text-indigo-600 dark:text-indigo-400 font-bold uppercase mt-0.5">{customer?.vehicle_no || "N/A"}</p>
          </div>
        </div>

        {/* Invoice Items table */}
        <div className="space-y-2">
          <p className="text-[9px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-extrabold">Line Items</p>
          {validItems.length === 0 ? (
            <div className="py-8 text-center text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider text-[10px] border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
              Cart is currently empty
            </div>
          ) : (
            <div className="border border-zinc-200 dark:border-zinc-900 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900/50 text-[9px] text-zinc-500 dark:text-zinc-500 font-extrabold uppercase border-b border-zinc-200 dark:border-zinc-900">
                    <th className="py-2 px-3">Item</th>
                    <th className="py-2 px-2 text-center w-12">Qty</th>
                    <th className="py-2 px-3 text-right w-24">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                  {validItems.map((item, idx) => (
                    <tr key={idx} className="font-semibold text-zinc-700 dark:text-zinc-350">
                      <td className="py-2 px-3">
                        <span className="font-bold text-zinc-900 dark:text-zinc-200 uppercase">
                          {item.product?.brand} {item.product?.model}
                        </span>
                        <span className="block text-[9px] text-zinc-400 dark:text-zinc-500 font-mono">
                          {item.product?.tyre_size}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center font-mono">
                        {item.qty}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-zinc-800 dark:text-zinc-200">
                        ₹{(item.qty * item.price).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Computation Ledger */}
        <div className="border-t border-zinc-200 dark:border-zinc-900 pt-3 space-y-1.5 font-semibold text-[10px] text-zinc-500 dark:text-zinc-450">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-mono text-zinc-800 dark:text-zinc-200">₹{subtotal.toFixed(2)}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-605">
              <span>Discount {discount.type === "percentage" ? `(${discount.value}%)` : ""}</span>
              <span className="font-mono font-bold">- ₹{discountAmount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between border-t border-zinc-100 dark:border-zinc-900 pt-1 font-bold text-zinc-700 dark:text-zinc-300">
            <span>Taxable Amount</span>
            <span className="font-mono">₹{taxableAmount.toFixed(2)}</span>
          </div>

          {gstAmount > 0 && (
            <>
              <div className="flex justify-between text-[9px] pl-2">
                <span>CGST ({(gst.rate / 2).toFixed(1)}%)</span>
                <span className="font-mono text-zinc-800 dark:text-zinc-200">+ ₹{cgstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[9px] pl-2">
                <span>SGST ({(gst.rate / 2).toFixed(1)}%)</span>
                <span className="font-mono text-zinc-800 dark:text-zinc-200">+ ₹{sgstAmount.toFixed(2)}</span>
              </div>
            </>
          )}

          <div className="flex items-center justify-between border-t-2 border-zinc-200 dark:border-zinc-800 pt-3 mt-2 text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest">
            <span>Grand Total</span>
            <span className="font-mono text-2xl text-indigo-600 dark:text-indigo-400 tabular-nums">₹{finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>
    </div>

  );
}
