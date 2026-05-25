import Link from "next/link";
import { FileText, ChevronRight } from "lucide-react";
import { formatDateIST, formatTimeIST } from "@/utils/date";

export interface RecentInvoiceRow {
  id: string;
  invoice_no: string;
  customer_name: string;
  total_amount: number;
  payment_mode: string;
  created_at: string;
}

interface RecentInvoicesPanelProps {
  invoices: RecentInvoiceRow[];
  isLoading?: boolean;
  /** Fixed height of the scrollable list area. Defaults to "h-[340px]". */
  listHeight?: string;
  /** Link shown in the header. Defaults to /accountant/invoices */
  viewAllHref?: string;
}

const formatTime = (iso: string) => formatTimeIST(iso);
const formatDate = (iso: string) => formatDateIST(iso);

const paymentBadgeClass = (mode: string) => {
  switch (mode?.toUpperCase()) {
    case "UPI":
      return "bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border-purple-200/30 dark:border-purple-800/30";
    case "CARD":
      return "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-200/30 dark:border-blue-800/30";
    default:
      return "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200/30 dark:border-emerald-800/30";
  }
};

function InvoiceRow({ inv }: { inv: RecentInvoiceRow }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50/40 dark:hover:bg-zinc-900/30 transition-colors border-b border-zinc-100 dark:border-zinc-900 last:border-b-0 group">
      {/* Invoice No + Customer */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-black font-mono text-zinc-800 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
          {inv.invoice_no}
        </p>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold truncate mt-0.5">
          {inv.customer_name}
        </p>
      </div>

      {/* Amount */}
      <div className="shrink-0 text-right">
        <p className="text-xs font-black text-zinc-900 dark:text-zinc-100 tabular-nums">
          ₹{inv.total_amount.toLocaleString("en-IN")}
        </p>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5 tabular-nums">
          {formatDate(inv.created_at)} {formatTime(inv.created_at)}
        </p>
      </div>

      {/* Payment badge */}
      <div className="shrink-0 w-14 flex justify-end">
        <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${paymentBadgeClass(inv.payment_mode)}`}>
          {inv.payment_mode}
        </span>
      </div>
    </div>
  );
}

function RecentInvoicesPanel({
  invoices,
  isLoading = false,
  listHeight = "h-[340px]",
  viewAllHref = "/accountant/invoices",
}: RecentInvoicesPanelProps) {
  return (
    <div className="bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {/* Sticky Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/30 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
          <div className="min-w-0">
            <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 leading-none">
              Recent Invoices
            </h3>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">
              Live Transaction Feed
            </p>
          </div>
        </div>
        <Link
          href={viewAllHref}
          className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors shrink-0 ml-3"
        >
          <span>View All</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Scrollable Invoice List */}
      <div className={`${listHeight} overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent`}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-xs font-semibold text-zinc-400 dark:text-zinc-500">
            Loading transactions...
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-xs font-semibold text-zinc-400 dark:text-zinc-500">
            <FileText className="w-8 h-8 opacity-30" />
            <span>No invoices generated yet.</span>
          </div>
        ) : (
          invoices.map((inv) => <InvoiceRow key={inv.id} inv={inv} />)
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-2 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/30 dark:bg-zinc-900/10 shrink-0">
        <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-widest text-center">
          {invoices.length > 0 ? `Showing ${invoices.length} recent invoice${invoices.length > 1 ? "s" : ""}` : "Synchronized with live database"}
        </p>
      </div>
    </div>
  );
}

export default RecentInvoicesPanel;
