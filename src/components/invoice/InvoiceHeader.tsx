"use client";

import React, { useEffect, useState } from "react";
import { settingsService, BusinessDetails } from "@/services/settings.service";

interface InvoiceHeaderProps {
  layout: "thermal" | "a4";
  invoiceNo: string;
  dateStr: string;
}

export default function InvoiceHeader({ layout, invoiceNo, dateStr }: InvoiceHeaderProps) {
  const [business, setBusiness] = useState<BusinessDetails>({
    shopName: "TyreRetail Pro ERP",
    address: "",
    phone: "",
    gstin: ""
  });

  useEffect(() => {
    setBusiness(settingsService.getBusinessDetails());
  }, []);

  if (layout === "thermal") {
    return (
      <div className="text-center font-mono border-b border-dashed border-zinc-300 pb-3 mb-3 text-zinc-900">
        <h2 className="text-base font-extrabold uppercase tracking-tight">{business.shopName}</h2>
        <p className="text-[10px] leading-tight mt-0.5 whitespace-pre-line">{business.address}</p>
        <p className="text-[10px] mt-0.5">PH: {business.phone}</p>
        {business.gstin && <p className="text-[10px] font-bold">GSTIN: {business.gstin}</p>}
        
        <div className="mt-2.5 border-t border-dashed border-zinc-300 pt-2 text-[10px] space-y-0.5">
          <p className="font-bold uppercase tracking-wider">*** RETAIL INVOICE ***</p>
          <div className="flex justify-between font-semibold px-1">
            <span>NO: {invoiceNo}</span>
            <span>DT: {dateStr}</span>
          </div>
        </div>
      </div>
    );
  }

  // A4 layout (Full layout, strong visual hierarchy, brand columns)
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-2 border-zinc-900 pb-5 mb-5 text-zinc-900">
      {/* Shop Info details */}
      <div className="space-y-1.5 flex-1 max-w-[65%]">
        <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-900 leading-none">
          {business.shopName}
        </h1>
        <p className="text-xs text-zinc-600 font-semibold tracking-wide uppercase">
          Authorised Tyre Dealer & Alignment Experts
        </p>
        <p className="text-[11px] text-zinc-500 font-semibold leading-relaxed whitespace-pre-line">
          {business.address}
        </p>
        <div className="flex flex-wrap gap-x-4 pt-1 text-[11px] font-bold text-zinc-700">
          <span>Phone: {business.phone}</span>
          {business.gstin && (
            <span>GSTIN: <span className="font-mono text-zinc-905">{business.gstin}</span></span>
          )}
        </div>
      </div>

      {/* Invoice Meta */}
      <div className="text-right sm:self-start min-w-[200px] border-l-0 sm:border-l border-zinc-200 pl-0 sm:pl-5 space-y-2">
        <div className="inline-block bg-zinc-900 text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded">
          TAX INVOICE
        </div>
        <div className="space-y-1 text-xs">
          <p className="text-zinc-500 font-semibold uppercase text-[9px] tracking-wider">Invoice Number</p>
          <p className="font-mono font-bold text-sm text-zinc-900">{invoiceNo}</p>
          
          <p className="text-zinc-500 font-semibold uppercase text-[9px] tracking-wider mt-2">Invoice Date</p>
          <p className="font-bold text-zinc-800">{dateStr}</p>
        </div>
      </div>
    </div>
  );
}
