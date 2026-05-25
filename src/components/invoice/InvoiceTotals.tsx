"use client";

import React from "react";

interface InvoiceTotalsProps {
  layout: "thermal" | "a4";
  subtotal: number;
  discountAmount: number;
  gstAmount: number;
  totalAmount: number;
  paymentMode: string;
}

export default function InvoiceTotals({
  layout,
  subtotal,
  discountAmount,
  gstAmount,
  totalAmount,
  paymentMode
}: InvoiceTotalsProps) {
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  
  // Deduce effective GST percentage
  const effectiveGstRate = taxableAmount > 0 ? Math.round((gstAmount / taxableAmount) * 100) : 0;
  
  const halfGstRate = Math.round((effectiveGstRate / 2) * 10) / 10;
  const cgstAmount = Math.round((gstAmount / 2) * 100) / 100;
  const sgstAmount = Math.round((gstAmount - cgstAmount) * 100) / 100;

  const formatCurrency = (val: number) => {
    return val.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  if (layout === "thermal") {
    return (
      <div className="font-mono text-[11px] border-t border-dashed border-zinc-400 pt-2 space-y-1 text-zinc-950">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span className="font-bold">₹{formatCurrency(subtotal)}</span>
        </div>
        
        {discountAmount > 0 && (
          <div className="flex justify-between text-zinc-700">
            <span>Discount:</span>
            <span className="font-bold">-₹{formatCurrency(discountAmount)}</span>
          </div>
        )}

        <div className="flex justify-between border-t border-zinc-200 pt-0.5 font-bold">
          <span>Taxable Amount:</span>
          <span>₹{formatCurrency(taxableAmount)}</span>
        </div>

        {gstAmount > 0 && (
          <>
            <div className="flex justify-between text-zinc-700 pl-2">
              <span>CGST ({halfGstRate}%):</span>
              <span>₹{formatCurrency(cgstAmount)}</span>
            </div>
            <div className="flex justify-between text-zinc-700 pl-2">
              <span>SGST ({halfGstRate}%):</span>
              <span>₹{formatCurrency(sgstAmount)}</span>
            </div>
          </>
        )}

        <div className="flex items-center justify-between text-sm font-black border-t-[3px] border-dashed border-zinc-800 pt-2 mt-2 uppercase">
          <span>Grand Total</span>
          <span className="text-xl">₹{formatCurrency(totalAmount)}</span>
        </div>

        <div className="flex justify-between text-[10px] pt-1 text-zinc-500 font-bold uppercase">
          <span>PAYMENT MODE:</span>
          <span>{paymentMode || "CASH"}</span>
        </div>
      </div>
    );
  }

  // A4 Layout - Clean, structured grid with strong vertical totals alignment
  return (
    <div className="flex flex-col sm:flex-row items-start justify-between gap-4 border-t border-zinc-200 pt-4 text-zinc-900">
      {/* Payment details / terms */}
      <div className="text-[10px] text-zinc-500 space-y-1 font-semibold flex-1">
        <p className="font-bold text-zinc-700 uppercase tracking-wider text-[9px]">Payment Information</p>
        <div className="flex gap-2">
          <span>Payment Method:</span>
          <span className="font-extrabold text-zinc-800 uppercase">{paymentMode || "Cash"}</span>
        </div>
        <p className="text-[9px] leading-relaxed max-w-[280px]">
          Thank you for your business. Tyres once fitted cannot be returned or replaced without manufacturer warranty validation.
        </p>
      </div>

      {/* Structured totals column */}
      <div className="w-full sm:w-[280px] space-y-1.5 text-xs font-semibold">
        <div className="flex justify-between text-zinc-600">
          <span>Subtotal</span>
          <span>₹{formatCurrency(subtotal)}</span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between text-emerald-600">
            <span>Discount</span>
            <span>-₹{formatCurrency(discountAmount)}</span>
          </div>
        )}

        <div className="flex justify-between text-zinc-800 border-t border-zinc-100 pt-1 font-bold">
          <span>Taxable Amount</span>
          <span>₹{formatCurrency(taxableAmount)}</span>
        </div>

        {gstAmount > 0 && (
          <>
            <div className="flex justify-between text-zinc-600 pl-2">
              <span>CGST ({halfGstRate}%)</span>
              <span>₹{formatCurrency(cgstAmount)}</span>
            </div>
            <div className="flex justify-between text-zinc-600 pl-2">
              <span>SGST ({halfGstRate}%)</span>
              <span>₹{formatCurrency(sgstAmount)}</span>
            </div>
          </>
        )}

        <div className="flex items-center justify-between text-base font-black text-zinc-950 border-t-[3px] border-zinc-900 pt-3 mt-1 uppercase tracking-widest">
          <span>Grand Total</span>
          <span className="text-2xl tabular-nums">₹{formatCurrency(totalAmount)}</span>
        </div>
      </div>
    </div>
  );
}
