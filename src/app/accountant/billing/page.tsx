"use client";

import { useState, useEffect, useMemo } from "react";
import { useRenderTrace } from "@/hooks/useRenderTrace";
import Link from "next/link";
import { 
  ArrowLeft, 
  ShoppingCart, 
  UserPlus, 
  Search,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Coins,
  Smartphone,
  User,
  Car
} from "lucide-react";
import { customerService } from "@/services/customer.service";
import { productService } from "@/services/product.service";
import { billingService } from "@/services/billing.service";
import { Customer } from "@/types/customer";
import { Product } from "@/types/product";
import InvoiceActions from "@/components/invoice/InvoiceActions";

import { DiscountConfig, GstConfig, BillingItem, BillingSummaryResult } from "@/types/billing";
import { calculateBillingTotals } from "@/utils/billingCalculations";
import DiscountSection from "@/components/billing/DiscountSection";
import GstSection from "@/components/billing/GstSection";
import BillingSummary from "@/components/billing/BillingSummary";
import InvoicePreview from "@/components/billing/InvoicePreview";

interface BillingRow {
  key: string;
  product: Product | null;
  qty: number;
  price: number;
}

export default function AccountantBillingPage() {
  useRenderTrace("AccountantBillingPage");

  // Database data
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  
  // Customer state
  const [customerSearch, setCustomerSearch] = useState("");
  const [searchedCustomers, setSearchedCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Quick Create Customer state
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustVehicle, setNewCustVehicle] = useState("");

  // Billing rows state (initially empty to remove mock entries)
  const [rows, setRows] = useState<BillingRow[]>([]);
  const [activeRowSearchKey, setActiveRowSearchKey] = useState<string | null>(null);
  const [rowSearchQueries, setRowSearchQueries] = useState<Record<string, string>>({});

  // Payment mode (Strict case-sensitive values allowed by DB check constraint)
  const [paymentMode, setPaymentMode] = useState<"Cash" | "UPI" | "Card">("Cash");

  // Flow control states
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [generatedInvoice, setGeneratedInvoice] = useState<{ id: number; invoiceNo: string } | null>(null);

  // Discount & GST settings states
  const [discount, setDiscount] = useState<DiscountConfig>({
    type: "percentage",
    value: 0
  });

  const [gst, setGst] = useState<GstConfig>({
    enabled: false,
    rate: 18
  });

  // Load products cache on mount
  useEffect(() => {
    async function loadProducts() {
      try {
        setErrorMsg(null);
        const { data, error } = await productService.getProducts();
        if (error) {
          setErrorMsg(`Failed to load inventory products: ${error.message}`);
        } else if (data) {
          setAllProducts(data as Product[]);
        }
      } catch (err: any) {
        setErrorMsg(`Inventory loading exception: ${err.message || err}`);
      }
    }
    loadProducts();
  }, []);

  useEffect(() => {
    const refreshProducts = async () => {
      try {
        const { data, error } = await productService.getProducts();
        if (!error && data) {
          setAllProducts(data as Product[]);
        }
      } catch (err) {
        console.warn("Unable to refresh inventory products after invoice update:", err);
      }
    };

    const handleInvoiceSaved = () => {
      refreshProducts();
    };

    const handleStorageUpdate = (event: StorageEvent) => {
      if (event.key === "invoice_saved_event" && event.newValue) {
        refreshProducts();
      }
    };

    window.addEventListener("invoice_saved", handleInvoiceSaved);
    window.addEventListener("storage", handleStorageUpdate);

    return () => {
      window.removeEventListener("invoice_saved", handleInvoiceSaved);
      window.removeEventListener("storage", handleStorageUpdate);
    };
  }, []);

  // Handle customer search query change (only searches DB, no local arrays)
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      try {
        if (customerSearch.trim().length >= 2) {
          const { data, error } = await customerService.searchCustomers(customerSearch);
          if (error) {
            console.error("Customer search error:", error);
          } else if (data) {
            setSearchedCustomers(data as Customer[]);
            setShowDropdown(true);
          }
        } else {
          setSearchedCustomers([]);
          setShowDropdown(false);
        }
      } catch (err) {
        console.error("Customer search exception:", err);
      }
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [customerSearch]);

  const handleSelectCustomer = (cust: Customer) => {
    setSelectedCustomer(cust);
    setCustomerSearch(`${cust.name} (${cust.phone})`);
    setShowDropdown(false);
    setShowQuickCreate(false);
  };

  const handleQuickCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim() || !newCustVehicle.trim()) {
      setErrorMsg("Failed to register customer: All fields are required.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { data, error } = await customerService.createCustomer(
        newCustName,
        newCustPhone,
        newCustVehicle
      );

      setIsLoading(false);

      if (error) {
        setErrorMsg(`Customer registration failed: ${error.message}`);
      } else if (data) {
        const created = data as Customer;
        setSelectedCustomer(created);
        setCustomerSearch(`${created.name} (${created.phone})`);
        setShowQuickCreate(false);
        setNewCustName("");
        setNewCustPhone("");
        setNewCustVehicle("");
        setSuccessMsg(`Customer ${created.name} registered and selected.`);
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(`Customer registration exception: ${err.message || err}`);
    }
  };

  const handleAddRow = () => {
    const newKey = `row-${Date.now()}`;
    // Quantity defaults to 0 and price defaults to 0 until product is selected and qty is entered
    setRows([...rows, { key: newKey, product: null, qty: 0, price: 0 }]);
  };

  const handleRemoveRow = (keyToRemove: string) => {
    setRows(rows.filter(row => row.key !== keyToRemove));
  };

  const handleUpdateRowProduct = (key: string, product: Product) => {
    setRows(prevRows => {
      // Check if product already exists in ANY row (other than the one currently being edited)
      const existingRowIndex = prevRows.findIndex(r => r.product?.id === product.id && r.key !== key);
      
      if (existingRowIndex >= 0) {
        const existingRow = prevRows[existingRowIndex];
        const currentRow = prevRows.find(r => r.key === key);
        
        // If current row had a quantity, add it, otherwise add 1
        const qtyToAdd = currentRow && currentRow.qty > 0 ? currentRow.qty : 1;
        let newQty = existingRow.qty + qtyToAdd;
        
        // Stock validation
        if (newQty > product.stock_qty) {
          newQty = product.stock_qty;
          setErrorMsg(`Cannot add more. Maximum stock for ${product.brand} ${product.model} is ${product.stock_qty}.`);
          setTimeout(() => setErrorMsg(null), 4000);
        } else {
          setSuccessMsg(`Product already added. Quantity updated to ${newQty}.`);
          setTimeout(() => setSuccessMsg(null), 3000);
        }
        
        const newRows = [...prevRows];
        newRows[existingRowIndex] = { ...existingRow, qty: newQty };
        
        // Remove the row that was just used to select the duplicate product
        return newRows.filter(r => r.key !== key);
      }
      
      // Normal flow: Product doesn't exist, update the current row
      return prevRows.map(row => {
        if (row.key === key) {
          // If qty was 0, initialize to 1 when a product is selected
          const initialQty = row.qty === 0 ? 1 : row.qty;
          return { 
            ...row, 
            product,
            qty: initialQty,
            price: product.sell_price
          };
        }
        return row;
      });
    });
    setActiveRowSearchKey(null);
  };

  const handleUpdateRowQty = (key: string, qtyVal: string) => {
    let qty = parseInt(qtyVal) || 0;
    
    setRows(prevRows => prevRows.map(row => {
      if (row.key === key) {
        if (qty < 0) {
          setErrorMsg("Quantity cannot be negative.");
          setTimeout(() => setErrorMsg(null), 4000);
          qty = 1;
        }
        
        if (row.product && qty > row.product.stock_qty) {
          setErrorMsg(`Insufficient stock. Maximum available is ${row.product.stock_qty}.`);
          setTimeout(() => setErrorMsg(null), 4000);
          return { ...row, qty: row.product.stock_qty };
        }
        return { ...row, qty };
      }
      return row;
    }));
  };

  // Memoized calculations using billing calculations utility
  const billingItems = useMemo<BillingItem[]>(() => {
    return rows.map((r) => ({
      product: r.product,
      qty: r.qty,
      price: r.price
    }));
  }, [rows]);

  const totals = useMemo<BillingSummaryResult>(() => {
    return calculateBillingTotals(billingItems, discount, gst);
  }, [billingItems, discount, gst]);

  const handleCheckout = async () => {
    if (isLoading) return;

    // 1. Validate Customer Selected
    if (!selectedCustomer || selectedCustomer.id === undefined || selectedCustomer.id === null) {
      setErrorMsg("Checkout failed: You must select an existing customer or register a new one.");
      return;
    }

    // 2. Validate Cart Items
    const validRows = rows.filter(r => r.product !== null && r.qty > 0);
    if (validRows.length === 0) {
      setErrorMsg("Checkout failed: Please select at least one tyre product and enter a quantity.");
      return;
    }

    // 3. Validate Quantities and Stock levels
    for (const r of validRows) {
      if (r.qty <= 0) {
        setErrorMsg(`Checkout failed: Invalid quantity specified for ${r.product!.brand} ${r.product!.model}.`);
        return;
      }
      if (r.qty > r.product!.stock_qty) {
        setErrorMsg(`Checkout failed: Insufficient stock for ${r.product!.brand} ${r.product!.model}. Available: ${r.product!.stock_qty}, requested: ${r.qty}.`);
        return;
      }
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const invoicePayload = {
        customer_id: selectedCustomer.id,
        subtotal: totals.subtotal,
        discount_amount: totals.discountAmount,
        gst_amount: totals.gstAmount,
        total_amount: totals.finalTotal,
        payment_mode: paymentMode
      };

      const itemsPayload = validRows.map(r => ({
        product_id: r.product!.id,
        qty: r.qty,
        price: r.price,
        total: r.qty * r.price
      }));

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

      const result = await billingService.generateBill(invoicePayload, itemsPayload, accountantName);

      setIsLoading(false);

      if (!result.success) {
        setErrorMsg(result.error || "Database error occurred during invoice generation.");
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("invoice_save_failure", {
            detail: {
              customer: selectedCustomer?.name || "Walk-in Customer",
              error: result.error || "Database error occurred"
            }
          }));
        }
      } else {
        const inv = result.invoice;
        if (inv && inv.id !== undefined) {
          setGeneratedInvoice({ id: inv.id, invoiceNo: inv.invoice_no || "INV-SUCCESS" });
        }
        setSuccessMsg(`Invoice generated successfully! Reference: ${inv?.invoice_no || 'INV-SUCCESS'}`);

        if (typeof window !== "undefined") {
          const payload = {
            invoiceId: inv?.id,
            invoiceNo: inv?.invoice_no,
            timestamp: Date.now()
          };
          window.dispatchEvent(new CustomEvent("invoice_saved", { detail: payload }));
          localStorage.setItem("invoice_saved_event", JSON.stringify(payload));
        }

        // Reset form to empty rows
        setRows([]);
        setSelectedCustomer(null);
        setCustomerSearch("");
        setRowSearchQueries({});
        setDiscount({ type: "percentage", value: 0 });
        setGst({ enabled: false, rate: 18 });
        
        // Refresh products cache in the background so the user does not wait on the invoice response.
        productService.getProducts()
          .then((resp) => {
            if (resp?.data) {
              setAllProducts(resp.data as Product[]);
            }
          })
          .catch((fetchErr) => {
            console.warn("Background stock cache refresh failed:", fetchErr);
          });
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(`Checkout Exception: ${err.message || err}`);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      
      {/* Messages */}
      {errorMsg && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && !generatedInvoice && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {generatedInvoice && (
        <InvoiceActions 
          invoiceId={generatedInvoice.id} 
          invoiceNo={generatedInvoice.invoiceNo} 
          onClose={() => {
            setGeneratedInvoice(null);
            setSuccessMsg(null);
          }}
        />
      )}

      {/* Top Banner/Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/accountant"
            className="p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-extrabold text-zinc-900 dark:text-white">
              Billing Console
            </h1>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider">
              {selectedCustomer ? `Selected: ${selectedCustomer.name}` : "Generate New Tyre Bill"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              setShowQuickCreate(!showQuickCreate);
              if (!showQuickCreate) {
                if (/^\d+$/.test(customerSearch)) {
                  setNewCustPhone(customerSearch);
                } else if (customerSearch.length > 3) {
                  setNewCustName(customerSearch);
                }
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-bold text-zinc-700 dark:text-zinc-300 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{showQuickCreate ? "Cancel Registration" : "Quick Register Customer"}</span>
          </button>
        </div>
      </div>

      {/* Main Billing Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Span 2): Product Selection Row Manager */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick Customer Creation Form */}
          {showQuickCreate && (
            <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/30 dark:from-indigo-950/20 dark:to-purple-950/10 border border-indigo-200/50 dark:border-indigo-900/40 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                <UserPlus className="w-4.5 h-4.5" />
                <h3 className="font-extrabold text-sm">Register New Customer</h3>
              </div>
              <form onSubmit={handleQuickCreateCustomer} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                    <User className="w-3 h-3" /> Full Name
                  </label>
                  <input 
                    type="text" 
                    placeholder="Enter customer name"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    required
                    className="w-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs py-2.5 px-3 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-800 dark:text-zinc-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                    <Smartphone className="w-3 h-3" /> Phone Number
                  </label>
                  <input 
                    type="text" 
                    placeholder="10-digit number"
                    maxLength={10}
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value.replace(/\D/g, ''))}
                    required
                    className="w-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs py-2.5 px-3 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-800 dark:text-zinc-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                    <Car className="w-3 h-3" /> Vehicle Number
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. AP-02-BG-1234"
                    value={newCustVehicle}
                    onChange={(e) => setNewCustVehicle(e.target.value.toUpperCase())}
                    required
                    className="w-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs py-2.5 px-3 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-800 dark:text-zinc-200"
                  />
                </div>
                <div className="sm:col-span-3 flex justify-end">
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold rounded-xl shadow-md cursor-pointer transition-all disabled:opacity-55"
                  >
                    {isLoading ? "Saving Customer..." : "Register & Select"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tyre Items Table */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-100">
                Tyre Line Items
              </h3>
            </div>
            
            <div className="overflow-visible">
              {rows.length === 0 ? (
                <div className="border border-dashed border-zinc-200 dark:border-zinc-800/60 rounded-xl p-8 text-center bg-zinc-50/30 dark:bg-zinc-900/10 mb-4">
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
                    Cart is empty
                  </p>
                  <p className="text-[11px] text-zinc-400/80 mt-1">
                    Click "Add Tyre Row" to select tyre products from the inventory.
                  </p>
                </div>
              ) : (
                <>
                  {/* Mobile Cards for Cart items (< md) */}
                  <div className="md:hidden space-y-3 mb-4">
                    {rows.map((row) => {
                      const rowSearch = rowSearchQueries[row.key] || "";
                      // Search suggestions appear on focus; if query is empty, show top 15 products, otherwise filter
                      const showSuggestions = activeRowSearchKey === row.key;
                      const matchingProducts = showSuggestions 
                        ? (() => {
                            const q = rowSearch.toLowerCase().trim();
                            const filtered = allProducts.filter(p => {
                              if (!q) return true;
                              const searchStr = `${p.brand} ${p.model} ${p.tyre_size}`.toLowerCase();
                              return searchStr.includes(q);
                            });
                            return q ? filtered : filtered.slice(0, 15);
                          })()
                        : [];

                      return (
                        <div key={row.key} className="p-3.5 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-900/60 space-y-3">
                          {/* Product Selector */}
                          <div>
                            <label className="text-[9px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
                              Tyre Product
                            </label>
                            <div className="mt-1 relative">
                              {row.product ? (
                                <div className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                      {row.product.brand.toUpperCase()} {row.product.model}
                                    </p>
                                    <p className="text-[10px] text-zinc-500 dark:text-zinc-500 font-semibold mt-0.5">
                                      Size: {row.product.tyre_size}
                                    </p>
                                  </div>
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      setRows(rows.map(r => r.key === row.key ? { ...r, product: null, price: 0, qty: 0 } : r));
                                      setRowSearchQueries({ ...rowSearchQueries, [row.key]: "" });
                                    }}
                                    className="text-[9px] text-indigo-500 hover:text-indigo-600 font-black uppercase cursor-pointer pl-2"
                                  >
                                    Change
                                  </button>
                                </div>
                              ) : (
                                <div>
                                  <input 
                                    type="text"
                                    placeholder="Search brand, model, size..."
                                    value={rowSearch}
                                    onFocus={() => setActiveRowSearchKey(row.key)}
                                    onChange={(e) => {
                                      setRowSearchQueries({
                                        ...rowSearchQueries,
                                        [row.key]: e.target.value
                                      });
                                      setActiveRowSearchKey(row.key);
                                    }}
                                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs py-2.5 px-3 rounded-lg outline-none focus:border-indigo-500 text-zinc-800 dark:text-zinc-200"
                                  />

                                  {/* Dropdown list for matching tyres */}
                                  {showSuggestions && (
                                    <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 divide-y divide-zinc-100 dark:divide-zinc-900">
                                      {matchingProducts.length === 0 ? (
                                        <div className="p-3 text-[10px] text-zinc-400 text-center font-bold">
                                          No products found
                                        </div>
                                      ) : (
                                        matchingProducts.map((p) => (
                                          <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => handleUpdateRowProduct(row.key, p)}
                                            className="w-full text-left p-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center justify-between cursor-pointer"
                                          >
                                            <div className="flex flex-col min-w-0 pr-2">
                                              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                                                {p.brand.toUpperCase()} {p.model}
                                              </span>
                                              <span className="text-[10px] text-zinc-500 dark:text-zinc-500 truncate">
                                                Size: {p.tyre_size}
                                              </span>
                                            </div>
                                            <span className={`text-[9px] shrink-0 font-extrabold px-1.5 py-0.5 rounded ${p.stock_qty <= 5 ? "bg-amber-100 dark:bg-amber-950/40 text-amber-600" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-400"}`}>
                                              Stock: {p.stock_qty}
                                            </span>
                                          </button>
                                        )))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Quantity & Unit Price Row */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[9px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
                                Quantity
                              </label>
                              <input 
                                type="number" 
                                min={1}
                                disabled={!row.product}
                                value={row.qty || ""}
                                placeholder="0"
                                onChange={(e) => handleUpdateRowQty(row.key, e.target.value)}
                                className="w-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs py-2.5 px-3 rounded-lg outline-none focus:border-indigo-500 disabled:opacity-50 text-zinc-800 dark:text-zinc-200"
                              />
                              {row.product && (
                                <p className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-1 font-semibold">
                                  Available: {row.product.stock_qty} pcs
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="text-[9px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
                                Unit Price (₹)
                              </label>
                              <input 
                                type="number" 
                                readOnly
                                value={row.price || ""}
                                placeholder="0"
                                className="w-full mt-1 bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-xs py-2.5 px-3 rounded-lg cursor-not-allowed text-zinc-500 dark:text-zinc-400"
                              />
                            </div>
                          </div>

                          {/* Row Total & Delete Action */}
                          <div className="flex items-center justify-between pt-2.5 border-t border-zinc-100 dark:border-zinc-900 text-xs">
                            <div>
                              <span className="text-[10px] text-zinc-400 font-semibold mr-1">Total:</span>
                              <span className="font-bold text-zinc-900 dark:text-zinc-200">₹{(row.qty * row.price).toLocaleString("en-IN")}</span>
                            </div>
                            <button 
                              type="button"
                              onClick={() => handleRemoveRow(row.key)}
                              className="flex items-center gap-1 py-1.5 px-3 bg-red-50 dark:bg-red-950/20 text-red-500 hover:text-red-650 rounded-lg cursor-pointer text-[10px] font-bold transition-all border border-red-200/20 dark:border-red-900/30"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop Table view (>= md) */}
                  <div className="hidden md:block">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-50/80 dark:bg-zinc-900/60 text-[10px] text-zinc-500 dark:text-zinc-400 font-black uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-900">
                          <th className="py-3 px-4">Tyre Description</th>
                          <th className="py-3 px-4 w-32">Stock / Qty</th>
                          <th className="py-3 px-4 w-36">Unit Price (₹)</th>
                          <th className="py-3 px-4 w-36">Total (₹)</th>
                          <th className="py-3 px-2 w-12 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                        {rows.map((row) => {
                          const rowSearch = rowSearchQueries[row.key] || "";
                          // Search suggestions appear on focus; if query is empty, show top 15 products, otherwise filter
                          const showSuggestions = activeRowSearchKey === row.key;
                          const matchingProducts = showSuggestions 
                            ? (() => {
                                const q = rowSearch.toLowerCase().trim();
                                const filtered = allProducts.filter(p => {
                                  if (!q) return true;
                                  const searchStr = `${p.brand} ${p.model} ${p.tyre_size}`.toLowerCase();
                                  return searchStr.includes(q);
                                });
                                return q ? filtered : filtered.slice(0, 15);
                              })()
                            : [];

                          return (
                            <tr key={row.key} className="hover:bg-zinc-50/10 dark:hover:bg-zinc-900/10">
                              {/* Tyre Select cell */}
                              <td className="py-4 px-4 relative align-top">
                                {row.product ? (
                                  <div className="flex flex-col">
                                    <span className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                                      {row.product.brand.toUpperCase()} {row.product.model}
                                    </span>
                                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold mt-0.5">
                                      Size: {row.product.tyre_size}
                                    </span>
                                    <button 
                                      onClick={() => {
                                        setRows(rows.map(r => r.key === row.key ? { ...r, product: null, price: 0, qty: 0 } : r));
                                        setRowSearchQueries({ ...rowSearchQueries, [row.key]: "" });
                                      }}
                                      className="text-[9px] text-indigo-500 hover:text-indigo-600 font-extrabold uppercase mt-1 self-start cursor-pointer"
                                    >
                                      Change Product
                                    </button>
                                  </div>
                                ) : (
                                  <div>
                                    <input 
                                      type="text"
                                      placeholder="Type to search tyres (e.g. Apollo, 165/80R14)..."
                                      value={rowSearch}
                                      onFocus={() => setActiveRowSearchKey(row.key)}
                                      onChange={(e) => {
                                        setRowSearchQueries({
                                          ...rowSearchQueries,
                                          [row.key]: e.target.value
                                        });
                                        setActiveRowSearchKey(row.key);
                                      }}
                                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs py-2 px-3 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-800 dark:text-zinc-200"
                                    />

                                    {/* Dropdown list for matching tyres */}
                                    {showSuggestions && (
                                      <div className="absolute left-3 right-3 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 divide-y divide-zinc-100 dark:divide-zinc-900">
                                        {matchingProducts.length === 0 ? (
                                          <div className="p-3 text-[11px] text-zinc-400 text-center font-bold">
                                            No matching products found
                                          </div>
                                        ) : (
                                          matchingProducts.map((p) => (
                                            <button
                                              key={p.id}
                                              type="button"
                                              onClick={() => handleUpdateRowProduct(row.key, p)}
                                              className="w-full text-left p-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center justify-between cursor-pointer"
                                            >
                                              <div className="flex flex-col">
                                                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                                                  {p.brand.toUpperCase()} {p.model}
                                                </span>
                                                <span className="text-[10px] text-zinc-500 dark:text-zinc-500">
                                                  Size: {p.tyre_size}
                                                </span>
                                              </div>
                                              <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${p.stock_qty <= 5 ? "bg-amber-100 dark:bg-amber-950/40 text-amber-600" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"}`}>
                                                Stock: {p.stock_qty}
                                              </span>
                                            </button>
                                          ))
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>

                              {/* Quantity cell */}
                              <td className="py-3 px-3 align-top">
                                <div className="flex flex-col">
                                  <input 
                                    type="number" 
                                    min={1}
                                    disabled={!row.product}
                                    value={row.qty || ""}
                                    placeholder="0"
                                    onChange={(e) => handleUpdateRowQty(row.key, e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs py-2 px-3 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 text-zinc-800 dark:text-zinc-200"
                                  />
                                  {row.product && (
                                    <span className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-1 font-bold">
                                      Max stock: {row.product.stock_qty}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Price cell */}
                              <td className="py-3 px-3 align-top">
                                <input 
                                  type="number" 
                                  readOnly
                                  value={row.price || ""}
                                  placeholder="0"
                                  className="w-full bg-zinc-200 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-xs py-2 px-3 rounded-lg outline-none cursor-not-allowed text-zinc-500 dark:text-zinc-400"
                                />
                              </td>

                              {/* Row Total cell */}
                              <td className="py-4 px-4 align-top text-zinc-900 dark:text-zinc-100 font-black text-sm pt-4">
                                ₹{(row.qty * row.price).toLocaleString()}
                              </td>

                              {/* Action cell */}
                              <td className="py-4 px-2 align-top text-center pt-3.5">
                                <button 
                                  type="button"
                                  onClick={() => handleRemoveRow(row.key)}
                                  className="p-2 bg-zinc-100 hover:bg-red-50 hover:text-red-500 dark:bg-zinc-900 dark:hover:bg-red-950/20 text-zinc-400 dark:text-zinc-500 rounded-lg cursor-pointer transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
            <button 
              type="button"
              onClick={handleAddRow}
              className="flex items-center justify-center gap-2 w-full py-3 mt-4 border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 text-xs font-extrabold text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900/50 transition-all cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="uppercase tracking-widest">Add Tyre Line Item</span>
            </button>
          </div>

          {/* Discount & GST Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DiscountSection discount={discount} onChange={setDiscount} />
            <GstSection gst={gst} onChange={setGst} />
          </div>

        </div>

        {/* Right Column: Checkout Summary & Customer details */}
        <div className="space-y-6">
          
          {/* Customer Selection/Details Card */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4 relative">
            <h3 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-100">
              Customer Profile
            </h3>

            <div className="space-y-3">
              <div className="relative">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Search Phone or Vehicle Number
                </label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-3 flex items-center text-zinc-400 dark:text-zinc-500 pointer-events-none">
                    <Search className="w-3.5 h-3.5" />
                  </span>
                  <input 
                    type="text" 
                    placeholder="Type phone or vehicle no..."
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      if (selectedCustomer) {
                        setSelectedCustomer(null);
                      }
                    }}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs py-2 px-3 pl-9 rounded-lg outline-none focus:border-indigo-500 text-zinc-800 dark:text-zinc-200"
                  />
                </div>

                {/* Autocomplete Dropdown (ONLY uses DB search) */}
                {showDropdown && searchedCustomers.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 divide-y divide-zinc-100 dark:divide-zinc-900">
                    {searchedCustomers.map((cust) => (
                      <button
                        key={cust.id}
                        type="button"
                        onClick={() => handleSelectCustomer(cust)}
                        className="w-full text-left p-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                            {cust.name}
                          </span>
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-500 mt-0.5">
                            Phone: {cust.phone}
                          </span>
                        </div>
                        <span className="text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded border border-indigo-100/50 dark:border-indigo-900/40">
                          {cust.vehicle_no}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Show selected customer details */}
              {selectedCustomer ? (
                <div className="p-3 bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-200/40 dark:border-indigo-900/30 rounded-xl space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-300">
                      {selectedCustomer.name}
                    </span>
                    <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
                      Selected
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Phone: <span className="font-semibold">{selectedCustomer.phone}</span>
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Vehicle: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{selectedCustomer.vehicle_no}</span>
                  </p>
                </div>
              ) : (
                customerSearch.trim().length >= 3 && searchedCustomers.length === 0 && (
                  <div className="p-3 bg-amber-50/30 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/40 rounded-xl text-center space-y-2">
                    <p className="text-[11px] text-amber-600 dark:text-amber-500 font-semibold">
                      No matching customer found.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowQuickCreate(true);
                        setNewCustName("");
                        if (/^\d+$/.test(customerSearch)) {
                          setNewCustPhone(customerSearch);
                          setNewCustVehicle("");
                        } else {
                          setNewCustPhone("");
                          setNewCustVehicle(customerSearch.toUpperCase());
                        }
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-extrabold rounded-lg shadow-sm cursor-pointer"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>Create & Select "{customerSearch}"</span>
                    </button>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Billing Summary Card */}
          <BillingSummary
            summary={totals}
            paymentMode={paymentMode}
            onChangePaymentMode={setPaymentMode}
            onCheckout={handleCheckout}
            isLoading={isLoading}
            customerSelected={selectedCustomer !== null}
          />

          {/* Live Invoice Preview Draft */}
          <div className="lg:sticky lg:top-6">
            <InvoicePreview
              customer={selectedCustomer}
              items={billingItems}
              summary={totals}
              discount={discount}
              gst={gst}
              paymentMode={paymentMode}
            />
          </div>

        </div>

      </div>

      {/* Sticky Bottom Totals Bar for Mobile */}
      {rows.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-900 p-3 flex items-center justify-between shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
          <div className="min-w-0 pr-3">
            <span className="text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
              Grand Total
            </span>
            <p className="text-sm font-black font-mono text-zinc-900 dark:text-white truncate">
              ₹{totals.finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <button
            onClick={handleCheckout}
            disabled={isLoading}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer whitespace-nowrap"
          >
            {isLoading ? "Processing..." : !selectedCustomer ? "Select Customer" : "Generate Bill"}
          </button>
        </div>
      )}

    </div>
  );
}
