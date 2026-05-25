"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Search, 
  Eye, 
  X,
  Receipt,
  AlertCircle,
  Printer,
  Download
} from "lucide-react";
import { invoiceService } from "@/services/invoice.service";
import { getInvoiceFilename } from "@/utils/pdfNaming";
import { createInvoicePdfBlob } from "@/utils/invoicePdf";
import { formatIST } from "@/utils/date";

interface InvoiceData {
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
}

interface InvoiceDetailData {
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
  invoice_items: {
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
  }[];
}


export default function AccountantInvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetailData | null>(null);
  
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [isVoiding, setIsVoiding] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const router = useRouter();

  const downloadInvoicePdf = async (invoiceId: number) => {
    setIsDownloadingPdf(true);
    try {
      const { data, error } = await invoiceService.getInvoiceDetails(invoiceId);
      if (error || !data) {
        throw new Error(error?.message || "Unable to fetch invoice details for PDF download.");
      }

      const blob = await createInvoicePdfBlob(data);
      const fileName = `${getInvoiceFilename(data.invoice_no)}.pdf`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      console.error("Failed to download invoice PDF:", downloadError);
      setErrorMessage("Unable to generate PDF at this time. Please try again.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePrintView = (invoiceId: number) => {
    router.push(`/invoice/print/${invoiceId}?action=print`);
  };

  // Load invoices matching search query
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      try {
        setIsLoadingList(true);
        setErrorMessage(null);
        const { data, error } = await invoiceService.searchInvoices(searchQuery);
        
        if (error) {
          console.error("Error searching invoices:", error);
          setErrorMessage("Failed to query invoices from database.");
        } else {
          setInvoices((data || []) as unknown as InvoiceData[]);
        }
      } catch (err) {
        console.error("Unexpected exception during invoice search:", err);
        setErrorMessage("An unexpected network error occurred.");
      } finally {
        setIsLoadingList(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, refreshCount]);

  // Load detailed invoice when selected — with timeout and user-visible errors
  useEffect(() => {
    const idToFetch = selectedInvoiceId;
    if (idToFetch === null) {
      setSelectedInvoice(null);
      return;
    }

    let didCancel = false;
    let slowLoadTimer: NodeJS.Timeout | null = null;

    async function loadDetails() {
      try {
        setIsLoadingDetail(true);
        setErrorMessage(null);

        // If the request takes longer than 6s, show a helpful message
        slowLoadTimer = setTimeout(() => {
          if (!didCancel) {
            setErrorMessage("Loading invoice is taking longer than usual. You can retry or check your network.");
          }
        }, 6000);

        const { data, error } = await invoiceService.getInvoiceDetails(idToFetch as number);
        if (didCancel) return;

        if (error) {
          console.error("Error loading invoice details:", error);
          setErrorMessage("Failed to load invoice details from the server.");
        } else if (!data) {
          setErrorMessage("Invoice not found or no details available.");
        } else {
          setSelectedInvoice(data as InvoiceDetailData);
        }
      } catch (err) {
        console.error("Exception loading invoice details:", err);
        if (!didCancel) setErrorMessage("Network error while loading invoice details.");
      } finally {
        if (slowLoadTimer) clearTimeout(slowLoadTimer);
        if (!didCancel) setIsLoadingDetail(false);
      }
    }

    loadDetails();

    return () => {
      didCancel = true;
      if (slowLoadTimer) clearTimeout(slowLoadTimer);
    };
  }, [selectedInvoiceId]);

  useEffect(() => {
    const handleInvoiceSaved = () => {
      setRefreshCount(prev => prev + 1);
    };

    const handleStorageUpdate = (event: StorageEvent) => {
      if (event.key === "invoice_saved_event" && event.newValue) {
        setRefreshCount(prev => prev + 1);
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setRefreshCount(prev => prev + 1);
      }
    };

    window.addEventListener("invoice_saved", handleInvoiceSaved);
    window.addEventListener("storage", handleStorageUpdate);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("invoice_saved", handleInvoiceSaved);
      window.removeEventListener("storage", handleStorageUpdate);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const handleVoidInvoice = async () => {
    if (!selectedInvoice) return;

    const confirmVoid = window.confirm(
      `Are you sure you want to VOID invoice ${selectedInvoice.invoice_no}? This will soft-delete it from history.`
    );

    if (!confirmVoid) return;

    try {
      setIsVoiding(true);

      let accountantName = "Accountant";
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("currentUser");
        if (stored) {
          try {
            const user = JSON.parse(stored);
            if (user.name) accountantName = user.name;
          } catch (e) {
            console.error(e);
          }
        }
      }

      const { error } = await invoiceService.softDeleteInvoice(selectedInvoice.id, accountantName);
      if (error) {
        alert(`Failed to void invoice: ${error.message || error}`);
      } else {
        alert("Invoice has been successfully voided.");
        setSelectedInvoiceId(null);
        setRefreshCount(prev => prev + 1);
      }
    } catch (err: any) {
      console.error("Error voiding invoice:", err);
      alert(`Unexpected error: ${err.message || err}`);
    } finally {
      setIsVoiding(false);
    }
  };

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
              Invoice History
            </h1>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-505 font-semibold uppercase tracking-wider">
              Search billing logs, verify transactions, and check history
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

      {/* Persistent Search Bar */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-850 rounded-2xl p-5 shadow-sm">
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-3.5 flex items-center text-zinc-400 dark:text-zinc-505 pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search by invoice number, customer phone, or vehicle plate number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs py-3.5 pl-11 pr-4 rounded-xl text-zinc-850 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-505 outline-none transition-all"
          />
        </div>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/50 rounded-xl flex items-center gap-2 text-xs font-bold text-red-650 dark:text-red-400">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Grid: Left is Invoice Table, Right is Selected Invoice Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Invoice List Table */}
        <div className={`bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden transition-all duration-300 ${selectedInvoiceId !== null ? "lg:col-span-2" : "lg:col-span-3"}`}>
          <div className="overflow-x-auto">
            {isLoadingList ? (
              <div className="p-16 text-center text-zinc-400 dark:text-zinc-500 text-xs font-extrabold uppercase tracking-wider">
                Searching database logs...
              </div>
            ) : invoices.length === 0 ? (
              <div className="p-16 text-center text-zinc-400 dark:text-zinc-500 text-xs font-bold">
                {searchQuery ? "No invoices found matching criteria" : "No invoices registered in the database"}
              </div>
            ) : (
              <table className="w-full min-w-[800px] text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50/50 dark:bg-zinc-900/40 text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold uppercase tracking-widest border-b border-zinc-200 dark:border-zinc-800">
                    <th className="py-2.5 px-4">Invoice ID</th>
                    <th className="py-2.5 px-4">Date / Time</th>
                    <th className="py-2.5 px-4">Customer & Contact</th>
                    <th className="py-2.5 px-4">Vehicle No</th>
                    <th className="py-2.5 px-4">Grand Total</th>
                    <th className="py-2.5 px-4">Payment Mode</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                  {invoices.map((inv) => {
                    const dateStr = formatIST(inv.created_at);
                    const isSelected = selectedInvoiceId === inv.id;

                    return (
                      <tr
                        key={inv.id}
                        onClick={() => setSelectedInvoiceId(inv.id)}
                        className={`hover:bg-zinc-50/30 dark:hover:bg-zinc-900/30 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer group ${isSelected ? "bg-indigo-50/20 dark:bg-indigo-950/20" : ""}`}
                      >
                        <td className="py-2 px-4 font-mono text-zinc-900 dark:text-zinc-100 font-bold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {inv.invoice_no}
                        </td>
                        <td className="py-2 px-4 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                          {dateStr}
                        </td>
                        <td className="py-2 px-4">
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
                        <td className="py-2 px-4 font-mono text-zinc-500 dark:text-zinc-400">
                          {inv.customers?.vehicle_no || "N/A"}
                        </td>
                        <td className="py-2 px-4 font-black text-zinc-900 dark:text-zinc-100 text-sm">
                          ₹{Number(inv.total_amount || 0).toLocaleString()}
                        </td>
                        <td className="py-2 px-4">
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-800/80">
                            {inv.payment_mode}
                          </span>
                        </td>
                        <td className="py-2 px-4 text-right whitespace-nowrap">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedInvoiceId(inv.id);
                            }}
                            className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-zinc-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors cursor-pointer" 
                            title="View invoice details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Invoice Detail Modal/Side-panel */}
        {selectedInvoiceId !== null && (
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-850 rounded-2xl shadow-md overflow-hidden flex flex-col h-full lg:col-span-1">
            
            {/* Detail Header */}
            <div className="p-4 border-b border-zinc-150 dark:border-zinc-900 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/20">
              <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                <Receipt className="w-4 h-4 text-indigo-500" />
                <h3 className="font-extrabold text-sm">Invoice Details</h3>
              </div>
              <button 
                onClick={() => setSelectedInvoiceId(null)}
                className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Detail Body */}
            {isLoadingDetail ? (
              <div className="p-12 text-center text-xs font-semibold text-zinc-400">
                Loading line items...
              </div>
            ) : selectedInvoice ? (
              <div className="p-5 space-y-5">
                
                {/* Meta details */}
                <div className="grid grid-cols-2 gap-3 border-b border-zinc-100 dark:border-zinc-900 pb-4 text-xs font-semibold">
                  <div>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-505 uppercase tracking-wider font-extrabold">Invoice Number</p>
                    <p className="font-mono font-bold text-zinc-850 dark:text-zinc-100 mt-0.5">{selectedInvoice.invoice_no}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-505 uppercase tracking-wider font-extrabold">Date & Time</p>
                    <p className="text-zinc-850 dark:text-zinc-200 mt-0.5">
                      {formatIST(selectedInvoice.created_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-505 uppercase tracking-wider font-extrabold">Payment Mode</p>
                    <p className="text-zinc-850 dark:text-zinc-200 mt-0.5 font-bold">{selectedInvoice.payment_mode}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-505 uppercase tracking-wider font-extrabold">Billing Grand Total</p>
                    <p className="text-indigo-650 dark:text-indigo-400 mt-0.5 font-black text-sm">₹{Number(selectedInvoice.total_amount || 0).toLocaleString()}</p>
                  </div>
                </div>

                {/* Invoice Action Options */}
                <div className="grid grid-cols-2 gap-2 border-b border-zinc-100 dark:border-zinc-900 pb-4">
                  <button
                    onClick={() => handlePrintView(selectedInvoice.id)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-250 dark:border-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 rounded-xl transition-all cursor-pointer shadow-sm hover:scale-[1.01]"
                  >
                    <Printer className="w-3.5 h-3.5 text-zinc-550" />
                    <span>Print Invoice</span>
                  </button>
                  <button
                    onClick={() => downloadInvoicePdf(selectedInvoice.id)}
                    disabled={isDownloadingPdf}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 border border-indigo-100/30 dark:border-indigo-900/30 text-xs font-extrabold text-indigo-650 dark:text-indigo-400 rounded-xl transition-all cursor-pointer hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isDownloadingPdf ? "Downloading..." : "Save PDF"}</span>
                  </button>
                </div>

                {/* Customer Details */}
                <div className="space-y-2 border-b border-zinc-100 dark:border-zinc-900 pb-4">
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-550 uppercase tracking-wider font-extrabold">Customer Details</p>
                  <div className="text-xs space-y-1 font-semibold">
                    <p className="text-zinc-850 dark:text-zinc-100 font-bold">
                      {selectedInvoice.customers?.name || "Walk-in Customer"}
                    </p>
                    {selectedInvoice.customers?.phone && (
                      <p className="text-zinc-500">Phone: <span className="font-mono text-zinc-700 dark:text-zinc-300">{selectedInvoice.customers.phone}</span></p>
                    )}
                    {selectedInvoice.customers?.vehicle_no && (
                      <p className="text-zinc-500">Vehicle: <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{selectedInvoice.customers.vehicle_no}</span></p>
                    )}
                  </div>
                </div>

                {/* Line Items List */}
                <div className="space-y-2">
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-550 uppercase tracking-wider font-extrabold">Products Purchased</p>
                  
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-900 text-xs font-semibold">
                    {selectedInvoice.invoice_items?.map((item) => (
                      <div key={item.id} className="py-2.5 flex justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-bold text-zinc-800 dark:text-zinc-100 truncate">
                            {item.products?.brand?.toUpperCase()} {item.products?.model}
                          </p>
                          <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-normal">
                            Size: {item.products?.tyre_size} &bull; Qty: {item.qty} units
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-zinc-900 dark:text-zinc-100">₹{Number(item.total).toLocaleString()}</p>
                          <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-normal">
                            ₹{Number(item.price).toLocaleString()} / unit
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Void Invoice Button */}
                <div className="pt-4 border-t border-zinc-150 dark:border-zinc-900 mt-2">
                  <button
                    onClick={handleVoidInvoice}
                    disabled={isVoiding}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-red-50 hover:bg-red-100 active:bg-red-200 dark:bg-red-950/20 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 font-extrabold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isVoiding ? "Voiding Invoice..." : "Void Invoice (Soft Delete)"}
                  </button>
                </div>

              </div>
            ) : (
              <div className="p-12 text-center text-xs font-semibold text-zinc-400">
                Failed to load details.
              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
}
