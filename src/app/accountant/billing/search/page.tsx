"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Calendar,
  Eye,
  Printer,
  Download
} from "lucide-react";
import { invoiceService } from "@/services/invoice.service";
import { formatDateIST } from "@/utils/date";

interface InvoiceData {
  id: number;
  invoice_no: string;
  created_at: string;
  total_amount: number;
  payment_mode: string;
  customers?: {
    name: string;
    phone: string;
    vehicle_no: string;
  } | null;
}

export default function AccountantSearchInvoicePage() {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    async function fetchInvoices() {
      try {
        setIsLoading(true);
        const { data, error } = await invoiceService.searchInvoices(debouncedQuery);
        if (!error && data) {
          setInvoices(data as unknown as InvoiceData[]);
        }
      } catch (err) {
        console.error("Error loading invoices:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchInvoices();
  }, [debouncedQuery]);

  // Filter logic (Payment and Date are client-side on the returned subset)
  const filteredInvoices = invoices.filter(inv => {
    // 1. Payment mode filter
    const matchesPayment = paymentFilter === "all" || inv.payment_mode === paymentFilter;

    // 2. Date range filter
    let matchesDate = true;
    if (inv.created_at) {
      const createdDate = new Date(inv.created_at);
      const now = new Date();
      
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const startOfYesterday = new Date(startOfToday);
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);

      const startOfWeek = new Date(startOfToday);
      startOfWeek.setDate(startOfWeek.getDate() - 7);

      const startOfMonth = new Date(startOfToday);
      startOfMonth.setMonth(startOfMonth.getMonth() - 1);

      if (dateFilter === "today") {
        matchesDate = createdDate >= startOfToday;
      } else if (dateFilter === "yesterday") {
        matchesDate = createdDate >= startOfYesterday && createdDate < startOfToday;
      } else if (dateFilter === "week") {
        matchesDate = createdDate >= startOfWeek;
      } else if (dateFilter === "month") {
        matchesDate = createdDate >= startOfMonth;
      }
    }

    return matchesPayment && matchesDate;
  });

  return (
    <div className="space-y-6">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-850 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/accountant"
            className="p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-extrabold text-zinc-900 dark:text-white">
              Search Invoices
            </h1>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-505 font-semibold uppercase tracking-wider">
              Search and manage customer billing records
            </p>
          </div>
        </div>

        <Link
          href="/accountant/billing"
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-extrabold rounded-xl hover:from-indigo-400 hover:to-purple-500 transition-all cursor-pointer shadow-md"
        >
          <span>Generate Bill</span>
        </Link>
      </div>

      {/* Filter and Search Section */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-850 rounded-2xl p-5 shadow-sm space-y-4">
        
        {/* Search controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-zinc-400 dark:text-zinc-505 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search by invoice number, customer name, phone, vehicle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs py-2.5 pl-10 pr-4 rounded-xl text-zinc-850 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-505 outline-none transition-all"
            />
          </div>

          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-zinc-400 dark:text-zinc-505 pointer-events-none">
              <Calendar className="w-4 h-4" />
            </span>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 focus:border-indigo-500 text-xs py-2.5 pl-10 pr-4 rounded-xl text-zinc-700 dark:text-zinc-300 outline-none cursor-pointer appearance-none"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-zinc-400 dark:text-zinc-505 pointer-events-none">
              <Filter className="w-4 h-4" />
            </span>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 focus:border-indigo-500 text-xs py-2.5 pl-10 pr-4 rounded-xl text-zinc-700 dark:text-zinc-300 outline-none cursor-pointer appearance-none"
            >
              <option value="all">All Payments</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoice List Container */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-850 rounded-2xl shadow-sm overflow-hidden">
        
        {/* Table representation */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-zinc-400 dark:text-zinc-505 text-xs font-bold">
              Loading invoices...
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="p-12 text-center text-zinc-400 dark:text-zinc-505 text-xs font-bold">
              No matching invoice records found.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 dark:bg-zinc-900/40 text-[10px] text-zinc-400 dark:text-zinc-550 font-extrabold uppercase tracking-widest border-b border-zinc-150 dark:border-zinc-900">
                  <th className="py-3.5 px-6">Invoice ID</th>
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6">Customer Name & Phone</th>
                  <th className="py-3.5 px-6">Vehicle Number</th>
                  <th className="py-3.5 px-6">Grand Total</th>
                  <th className="py-3.5 px-6">Payment Mode</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {filteredInvoices.map((inv) => {
                  const dateStr = inv.created_at 
                    ? formatDateIST(inv.created_at)
                    : "N/A";

                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-zinc-50/20 dark:hover:bg-zinc-900/20 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors group"
                    >
                      <td className="py-4 px-6 font-mono text-zinc-900 dark:text-zinc-100 font-bold group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors">
                        {inv.invoice_no}
                      </td>
                      <td className="py-4 px-6 text-zinc-500 dark:text-zinc-450 whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-bold text-zinc-800 dark:text-zinc-100">
                            {inv.customers?.name || "Walk-in Customer"}
                          </p>
                          {inv.customers?.phone && (
                            <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-normal">
                              {inv.customers.phone}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono text-zinc-500">
                        {inv.customers?.vehicle_no || "N/A"}
                      </td>
                      <td className="py-4 px-6 font-black text-zinc-900 dark:text-zinc-100">
                        ₹{inv.total_amount.toLocaleString()}
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-650 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-800/80">
                          {inv.payment_mode}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border-emerald-250/30 dark:border-emerald-900/30">
                          Paid
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 rounded-lg transition-colors cursor-pointer" title="View details">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 rounded-lg transition-colors cursor-pointer" title="Print invoice">
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer pagination */}
        <div className="p-4 bg-zinc-50/50 dark:bg-zinc-900/30 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
          <span>
            {isLoading ? "..." : `Showing ${filteredInvoices.length} of ${invoices.length} records`}
          </span>
        </div>

      </div>

    </div>
  );
}
