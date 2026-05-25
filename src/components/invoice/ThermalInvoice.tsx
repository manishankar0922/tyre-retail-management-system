"use client";

import React, { useEffect, useState } from "react";
import { settingsService, BusinessDetails } from "@/services/settings.service";
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

interface ThermalInvoiceProps {
  invoice: InvoiceDetail;
}

export default function ThermalInvoice({ invoice }: ThermalInvoiceProps) {
  const [business, setBusiness] = useState<BusinessDetails>({
    shopName: "TyreRetail Pro ERP",
    address: "",
    phone: "",
    gstin: ""
  });

  useEffect(() => {
    setBusiness(settingsService.getBusinessDetails());
  }, []);

  const dateStr = formatDateIST(invoice.created_at);
  const timeStr = formatTimeIST(invoice.created_at);

  const totalAmount = Number(invoice.total_amount || 0);
  const discountAmount = Number(invoice.discount_amount || 0);
  
  let subtotal = Number(invoice.subtotal);
  let gstAmount = Number(invoice.gst_amount);

  if (isNaN(subtotal) || invoice.subtotal === null || invoice.subtotal === undefined || subtotal === 0) {
    const taxableVal = totalAmount / 1.18;
    gstAmount = totalAmount - taxableVal;
    subtotal = taxableVal + discountAmount;
  }

  return (
    <div className="w-[76mm] max-w-full mx-auto bg-white p-2 text-zinc-950 font-mono text-[11px] leading-tight select-none border border-zinc-200 shadow-sm print:border-0 print:shadow-none print:p-0 print:w-full">
      {/* Print CSS specific to Thermal roll size */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: 80mm auto;
            margin: 0;
          }
          html, body {
            width: 80mm;
            margin: 0;
            padding: 0;
          }
        }
      `}} />

      {/* SHOP NAME, Phone, GSTIN */}
      <div className="text-center">
        <h2 className="text-sm font-black uppercase tracking-tight leading-none mb-1">{business.shopName}</h2>
        <p className="text-[10px]">Phone: {business.phone}</p>
        {business.gstin && <p className="text-[10px] font-bold">GSTIN: {business.gstin}</p>}
      </div>

      {/* Invoice No, Date, Payment Mode */}
      <div className="border-t border-dashed border-zinc-400 pt-1.5 mt-1.5 space-y-0.5">
        <div className="flex justify-between">
          <span>Invoice No:</span>
          <span className="font-bold">{invoice.invoice_no}</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{dateStr} {timeStr}</span>
        </div>
        <div className="flex justify-between">
          <span>Payment Mode:</span>
          <span className="font-bold uppercase">{invoice.payment_mode}</span>
        </div>
      </div>

      {/* Customer, Vehicle Number */}
      <div className="border-t border-dashed border-zinc-400 pt-1.5 mt-1.5 space-y-0.5">
        <div className="flex justify-between">
          <span>Customer:</span>
          <span className="uppercase font-semibold text-zinc-900">{invoice.customers?.name || "WALK-IN"}</span>
        </div>
        {invoice.customers?.phone && (
          <div className="flex justify-between">
            <span>Phone:</span>
            <span>{invoice.customers.phone}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Vehicle Number:</span>
          <span className="font-bold uppercase">{invoice.customers?.vehicle_no || "WALK-IN"}</span>
        </div>
      </div>

      {/* Products list */}
      <div className="border-t border-dashed border-zinc-400 pt-1.5 mt-1.5">
        <div className="font-bold uppercase tracking-wider text-[9px] pb-1 border-b border-dashed border-zinc-200 mb-1">Products</div>
        <div className="space-y-2">
          {invoice.invoice_items.map((item, idx) => (
            <div key={item.id || idx} className="space-y-0.5">
              <div className="font-bold uppercase leading-none text-zinc-900">
                {idx + 1}. {item.products ? `${item.products.brand.toUpperCase()} ${item.products.model}` : "TYRE PRODUCT"}
              </div>
              {item.products && (
                <div className="text-[10px] text-zinc-500 font-semibold pl-3">
                  Size: {item.products.tyre_size}
                </div>
              )}
              <div className="flex justify-between text-[10px] pl-3 text-zinc-700">
                <span>{item.qty} × ₹{Number(item.price).toFixed(2)}</span>
                <span className="font-bold text-zinc-950">₹{Number(item.total).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals Breakdown */}
      <div className="border-t border-dashed border-zinc-400 pt-1.5 mt-1.5">
        <InvoiceTotals
          layout="thermal"
          subtotal={subtotal}
          discountAmount={discountAmount}
          gstAmount={gstAmount}
          totalAmount={totalAmount}
          paymentMode={invoice.payment_mode}
        />
      </div>

      {/* Thank You Footer */}
      <div className="text-center font-bold border-t border-dashed border-zinc-400 pt-2 mt-2 text-[9px] uppercase tracking-wide">
        <p>Thank You</p>
        <p className="text-[8px] text-zinc-400 mt-1 font-semibold normal-case leading-tight">
          Warranty subject to manufacturer terms. Disputes subject to local jurisdiction.
        </p>
      </div>
    </div>
  );
}
