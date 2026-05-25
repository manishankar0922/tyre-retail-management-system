"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  Users, 
  CalendarDays,
  FileText
} from "lucide-react";
import { customerService } from "@/services/customer.service";
import { Customer } from "@/types/customer";

export default function AccountantCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCustomers() {
      try {
        setIsLoading(true);
        const { data, error } = await customerService.getCustomers();
        if (!error && data) {
          setCustomers(data as Customer[]);
        }
      } catch (err) {
        console.error("Error loading customers:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadCustomers();
  }, []);

  // Performance Optimization: Memoize client-side customer search filtering
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(cust => {
      return (
        cust.name.toLowerCase().includes(q) ||
        (cust.phone && cust.phone.includes(q)) ||
        (cust.vehicle_no && cust.vehicle_no.toLowerCase().includes(q))
      );
    });
  }, [customers, searchQuery]);

  return (
    <div className="space-y-6">
      
      {/* Header */}
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
              Customer Registry
            </h1>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider">
              Browse profiles, vehicle tags, and accounts
            </p>
          </div>
        </div>

        <Link 
          href="/accountant/billing"
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-extrabold rounded-xl hover:from-indigo-400 hover:to-purple-500 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Billing Transaction</span>
        </Link>
      </div>

      {/* Grid: Stat Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold uppercase tracking-wider">Total Registered Customers</p>
            <h3 className="text-xl font-black text-zinc-800 dark:text-zinc-200 mt-1">
              {isLoading ? "..." : `${customers.length} Profiles`}
            </h3>
          </div>
          <div className="p-2 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 rounded-xl">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold uppercase tracking-wider">Active This Month</p>
            <h3 className="text-xl font-black text-indigo-500 mt-1">
              {isLoading ? "..." : `${customers.length} Accounts`}
            </h3>
          </div>
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 rounded-xl">
            <CalendarDays className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Customers Table container */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        
        {/* Search tool */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-900">
          <div className="relative max-w-md">
            <span className="absolute inset-y-0 left-3.5 flex items-center text-zinc-400 dark:text-zinc-500 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search by phone, vehicle ID or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs py-2 px-10 rounded-xl text-zinc-800 dark:text-zinc-200 outline-none transition-all"
            />
          </div>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-zinc-400 dark:text-zinc-500 text-xs font-bold">
              Loading customer registry...
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-12 text-center text-zinc-400 dark:text-zinc-500 text-xs font-bold">
              No registered customers found.
            </div>
          ) : (
            <table className="w-full min-w-[800px] text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 dark:bg-zinc-900/40 text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold uppercase tracking-widest border-b border-zinc-200 dark:border-zinc-800">
                  <th className="py-2.5 px-4">Customer ID</th>
                  <th className="py-2.5 px-4">Name</th>
                  <th className="py-2.5 px-4">Phone</th>
                  <th className="py-2.5 px-4">Vehicle (Primary Model)</th>
                  <th className="py-2.5 px-4">Created On</th>
                  <th className="py-2.5 px-4">Account Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {filteredCustomers.map((cust) => (
                  <tr
                    key={cust.id}
                    className="hover:bg-zinc-50/20 dark:hover:bg-zinc-900/20 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors group cursor-pointer"
                  >
                    <td className="py-2 px-4 font-mono text-zinc-900 dark:text-zinc-100 font-bold group-hover:text-indigo-650 dark:group-hover:text-indigo-400">
                      CUST-{cust.id}
                    </td>
                    <td className="py-2 px-4 font-bold text-zinc-800 dark:text-zinc-100">
                      {cust.name}
                    </td>
                    <td className="py-2 px-4 font-mono text-[11px] text-zinc-500">
                      {cust.phone}
                    </td>
                    <td className="py-2 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                      {cust.vehicle_no}
                    </td>
                    <td className="py-2 px-4 text-zinc-500 dark:text-zinc-400">
                      {cust.created_at ? new Date(cust.created_at).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' }) : "N/A"}
                    </td>
                    <td className="py-2 px-4">
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200/30 dark:border-emerald-800/35">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>

    </div>
  );
}
