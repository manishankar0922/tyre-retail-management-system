"use client";

import React, { useCallback, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  AlertTriangle,
  RotateCcw,
  ArrowUpDown,
  X
} from "lucide-react";
import { productService } from "@/services/product.service";
import { Product } from "@/types/product";

interface InventoryManagementProps {
  role: "owner" | "accountant";
}

export default function InventoryManagement({ role }: InventoryManagementProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Edit modal state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editSellPrice, setEditSellPrice] = useState("");
  const [editMinStock, setEditMinStock] = useState("");
  const [editStockQty, setEditStockQty] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Add modal state
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [addBrand, setAddBrand] = useState("");
  const [addModel, setAddModel] = useState("");
  const [addTyreSize, setAddTyreSize] = useState("");
  const [addBuyPrice, setAddBuyPrice] = useState("");
  const [addSellPrice, setAddSellPrice] = useState("");
  const [addStockQty, setAddStockQty] = useState("");
  const [addMinStock, setAddMinStock] = useState("5");
  const [isSavingNew, setIsSavingNew] = useState(false);
  const [addNewError, setAddNewError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await productService.getProducts();
      if (!error && data) {
        setProducts(data as Product[]);
      }
    } catch (err) {
      console.error("Error loading products:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    const handleInvoiceSaved = () => {
      loadProducts();
    };

    const handleStorageUpdate = (event: StorageEvent) => {
      if ((event.key === "invoice_saved_event" || event.key === "purchase_saved_event") && event.newValue) {
        loadProducts();
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadProducts();
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
  }, [loadProducts]);

  // Performance Optimization: Memoize filtered products list
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter(p => 
      p.brand.toLowerCase().includes(q) ||
      p.model.toLowerCase().includes(q) ||
      p.tyre_size.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  // Performance Optimization: Memoize low stock / out of stock metrics
  const lowStockCount = useMemo(() => {
    return products.filter(p => {
      const minStock = p.min_stock !== undefined ? p.min_stock : 5;
      return p.stock_qty > 0 && p.stock_qty <= minStock;
    }).length;
  }, [products]);

  const outOfStockCount = useMemo(() => {
    return products.filter(p => p.stock_qty <= 0).length;
  }, [products]);

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setEditSellPrice(product.sell_price.toString());
    setEditMinStock((product.min_stock !== undefined ? product.min_stock : 5).toString());
    setEditStockQty(product.stock_qty.toString());
    setSaveError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const sellPrice = parseFloat(editSellPrice);
    const minStock = parseInt(editMinStock);
    const stockQty = parseInt(editStockQty);

    if (isNaN(sellPrice) || sellPrice < 0) {
      setSaveError("Retail price must be a valid positive number.");
      return;
    }
    if (isNaN(minStock) || minStock < 0) {
      setSaveError("Minimum stock must be a valid positive integer.");
      return;
    }
    if (isNaN(stockQty) || stockQty < 0) {
      setSaveError("Stock quantity must be a valid positive integer.");
      return;
    }

    try {
      setIsSaving(true);
      setSaveError(null);

      let updaterName = role === "owner" ? "Owner" : "Accountant";
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("currentUser");
        if (stored) {
          try {
            const user = JSON.parse(stored);
            if (user.name) updaterName = user.name;
          } catch (err) {
            console.error(err);
          }
        }
      }

      const { error } = await productService.updateProduct(
        editingProduct.id,
        {
          sell_price: sellPrice,
          min_stock: minStock,
          stock_qty: stockQty
        },
        updaterName
      );

      if (error) {
        setSaveError(error.message || "Failed to update product.");
      } else {
        setEditingProduct(null);
        await loadProducts();
      }
    } catch (err: any) {
      console.error("Error saving product:", err);
      setSaveError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddClick = () => {
    setIsAddingProduct(true);
    setAddBrand("");
    setAddModel("");
    setAddTyreSize("");
    setAddBuyPrice("");
    setAddSellPrice("");
    setAddStockQty("");
    setAddNewError(null);
  };

  const handleSaveNew = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!addBrand.trim() || !addModel.trim() || !addTyreSize.trim()) {
      setAddNewError("Brand, Model, and Tyre Size are required.");
      return;
    }

    const buyPrice = parseFloat(addBuyPrice);
    const sellPrice = parseFloat(addSellPrice);
    const stockQty = parseInt(addStockQty);
    const minStock = parseInt(addMinStock);

    if (isNaN(buyPrice) || buyPrice < 0) {
      setAddNewError("Purchase cost must be a valid positive number.");
      return;
    }
    if (isNaN(sellPrice) || sellPrice < 0) {
      setAddNewError("Retail price must be a valid positive number.");
      return;
    }
    if (isNaN(stockQty) || stockQty < 0) {
      setAddNewError("Initial stock must be a valid positive integer.");
      return;
    }
    if (isNaN(minStock) || minStock < 0) {
      setAddNewError("Minimum stock threshold must be a valid positive integer.");
      return;
    }

    try {
      setIsSavingNew(true);
      setAddNewError(null);

      let updaterName = role === "owner" ? "Owner" : "Accountant";
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("currentUser");
        if (stored) {
          try {
            const user = JSON.parse(stored);
            if (user.name) updaterName = user.name;
          } catch (err) {
            console.error(err);
          }
        }
      }

      const { error } = await productService.createProduct(
        {
          brand: addBrand.trim(),
          model: addModel.trim(),
          tyre_size: addTyreSize.trim(),
          buy_price: buyPrice,
          sell_price: sellPrice,
          stock_qty: stockQty,
          min_stock: minStock,
          is_active: true
        },
        updaterName
      );

      if (error) {
        setAddNewError(error.message || "Failed to create product.");
      } else {
        setIsAddingProduct(false);
        await loadProducts();
      }
    } catch (err: any) {
      console.error("Error creating product:", err);
      setAddNewError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSavingNew(false);
    }
  };

  const backHref = role === "owner" ? "/owner/dashboard" : "/accountant";
  const actionButton = role === "owner" ? (
    <Link 
      href="/owner/purchases"
      className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-extrabold rounded-xl hover:from-indigo-400 hover:to-purple-500 transition-all cursor-pointer shadow-md"
    >
      <Plus className="w-4 h-4" />
      <span>Add Purchase</span>
    </Link>
  ) : (
    <Link 
      href="/accountant/billing"
      className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-extrabold rounded-xl hover:from-indigo-400 hover:to-purple-500 transition-all cursor-pointer shadow-md"
    >
      <Plus className="w-4 h-4" />
      <span>Generate Bill</span>
    </Link>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-850 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href={backHref}
            className="p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-extrabold text-zinc-900 dark:text-white">
              Inventory Directory
            </h1>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-505 font-semibold uppercase tracking-wider">
              Browse and query current stock levels
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={loadProducts}
            disabled={isLoading}
            className="p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl transition-all cursor-pointer disabled:opacity-50" 
            title="Refresh stock"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          {actionButton}
        </div>
      </div>

      {/* Grid: Stat Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-850 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-505 font-extrabold uppercase tracking-wider">Total Tyre SKUs</p>
            <h3 className="text-xl font-black text-zinc-850 dark:text-zinc-100 mt-1">
              {isLoading ? "..." : `${products.length} Types`}
            </h3>
          </div>
          <div className="p-2 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 rounded-xl">
            <ArrowUpDown className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-850 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-505 font-extrabold uppercase tracking-wider">Low Stock Warnings</p>
            <h3 className="text-xl font-black text-amber-500 mt-1">
              {isLoading ? "..." : `${lowStockCount} Items`}
            </h3>
          </div>
          <div className="p-2 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-xl">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-850 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-505 font-extrabold uppercase tracking-wider">Out of Stock</p>
            <h3 className="text-xl font-black text-red-500 mt-1">
              {isLoading ? "..." : `${outOfStockCount} Items`}
            </h3>
          </div>
          <div className="p-2 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
        </div>
      </div>

      {/* Search & Listing Table */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-850 rounded-2xl shadow-sm overflow-hidden">
        {/* Search tool & Add button */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <span className="absolute inset-y-0 left-3.5 flex items-center text-zinc-400 dark:text-zinc-550 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search by brand, size, model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs py-2.5 px-10 rounded-xl text-zinc-855 dark:text-zinc-250 outline-none transition-all"
            />
          </div>

          <button 
            type="button"
            onClick={handleAddClick}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-extrabold rounded-xl hover:from-indigo-400 hover:to-purple-500 transition-all cursor-pointer shadow-md shrink-0 animate-all"
          >
            <Plus className="w-4 h-4" />
            <span>Update or Add Inventory</span>
          </button>
        </div>

        {/* Inventory Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-zinc-400 dark:text-zinc-550 text-xs font-bold">
              Loading inventory directory...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center text-zinc-400 dark:text-zinc-550 text-xs font-bold">
              No products matching stock criteria found.
            </div>
          ) : (
            <table className="w-full min-w-[800px] text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 dark:bg-zinc-900/40 text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold uppercase tracking-widest border-b border-zinc-200 dark:border-zinc-800">
                  <th className="py-2.5 px-4">SKU Code</th>
                  <th className="py-2.5 px-4">Brand</th>
                  <th className="py-2.5 px-4">Model</th>
                  <th className="py-2.5 px-4">Size Details</th>
                  <th className="py-2.5 px-4">Current Stock</th>
                  <th className="py-2.5 px-4">Retail Price</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {filteredProducts.map((item) => {
                  const minStock = item.min_stock !== undefined ? item.min_stock : 5;
                  const isOutOfStock = item.stock_qty <= 0;
                  const isLowStock = item.stock_qty <= minStock;
                  const statusText = isOutOfStock ? "Out of Stock" : isLowStock ? "Low Stock" : "In Stock";

                  return (
                    <tr
                      key={item.id}
                      onClick={() => handleEditClick(item)}
                      className="hover:bg-zinc-50/20 dark:hover:bg-zinc-900/20 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors group cursor-pointer"
                    >
                      <td className="py-2 px-4 font-mono text-zinc-900 dark:text-zinc-200 font-bold group-hover:text-indigo-650 dark:group-hover:text-indigo-400">
                        TYRE-{item.id}
                      </td>
                      <td className="py-2 px-4 font-bold text-zinc-800 dark:text-zinc-100">
                        {item.brand.toUpperCase()}
                      </td>
                      <td className="py-2 px-4">
                        {item.model}
                      </td>
                      <td className="py-2 px-4 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                        {item.tyre_size}
                      </td>
                      <td className="py-2 px-4 font-bold">
                        {item.stock_qty} units
                      </td>
                      <td className="py-2 px-4 font-bold text-zinc-900 dark:text-zinc-200">
                        ₹{item.sell_price.toLocaleString()}
                      </td>
                      <td className="py-2 px-4">
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border
                          ${statusText === "In Stock" 
                            ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-250/30 dark:border-emerald-900/30" 
                            : statusText === "Low Stock"
                            ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-250/30 dark:border-amber-900/30"
                            : "bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 border-red-250/30 dark:border-red-900/30"
                          }`}
                        >
                          {statusText}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-zinc-100 dark:border-zinc-900 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/10">
              <div>
                <h3 className="font-extrabold text-zinc-900 dark:text-white">
                  Edit Stock & Details
                </h3>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">
                  {editingProduct.brand.toUpperCase()} {editingProduct.model} ({editingProduct.tyre_size})
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-5 space-y-4">
              {saveError && (
                <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/50 text-red-650 dark:text-red-400 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{saveError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-zinc-400 dark:text-zinc-505 uppercase tracking-wider mb-1.5">
                    Retail Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editSellPrice}
                    onChange={(e) => setEditSellPrice(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs py-3 px-4 rounded-xl text-zinc-855 dark:text-zinc-200 outline-none transition-all font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-zinc-400 dark:text-zinc-505 uppercase tracking-wider mb-1.5">
                    Current Stock Qty
                  </label>
                  <input
                    type="number"
                    value={editStockQty}
                    onChange={(e) => setEditStockQty(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs py-3 px-4 rounded-xl text-zinc-855 dark:text-zinc-200 outline-none transition-all font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-zinc-400 dark:text-zinc-505 uppercase tracking-wider mb-1.5">
                    Minimum Stock Alert Threshold
                  </label>
                  <input
                    type="number"
                    value={editMinStock}
                    onChange={(e) => setEditMinStock(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs py-3 px-4 rounded-xl text-zinc-855 dark:text-zinc-200 outline-none transition-all font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3 border-t border-zinc-100 dark:border-zinc-900">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Product Modal */}
      {isAddingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-855 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-zinc-100 dark:border-zinc-900 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/10">
              <div>
                <h3 className="font-extrabold text-zinc-900 dark:text-white">
                  Add New Tyre Product
                </h3>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">
                  Insert new brand/size specifications into the inventory catalog
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setIsAddingProduct(false)}
                className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSaveNew} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {addNewError && (
                <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-250/20 dark:border-red-900/35 text-red-655 dark:text-red-400 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{addNewError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-zinc-400 dark:text-zinc-505 uppercase tracking-wider mb-1.5">
                    Tyre Brand Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Apollo, Ceat, MRF, Michelin"
                    value={addBrand}
                    onChange={(e) => setAddBrand(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs py-3 px-4 rounded-xl text-zinc-855 dark:text-zinc-200 outline-none transition-all font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-zinc-400 dark:text-zinc-505 uppercase tracking-wider mb-1.5">
                    Model Designation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Amazer, Milaze, ZLX, Primacy"
                    value={addModel}
                    onChange={(e) => setAddModel(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs py-3 px-4 rounded-xl text-zinc-855 dark:text-zinc-200 outline-none transition-all font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-zinc-400 dark:text-zinc-505 uppercase tracking-wider mb-1.5">
                    Tyre Size Specification
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 195/65R15, 165/80R14"
                    value={addTyreSize}
                    onChange={(e) => setAddTyreSize(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs py-3 px-4 rounded-xl text-zinc-855 dark:text-zinc-200 outline-none transition-all font-semibold"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-zinc-400 dark:text-zinc-505 uppercase tracking-wider mb-1.5">
                      Purchase Cost (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Wholesale cost"
                      value={addBuyPrice}
                      onChange={(e) => setAddBuyPrice(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs py-3 px-4 rounded-xl text-zinc-855 dark:text-zinc-200 outline-none transition-all font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-zinc-400 dark:text-zinc-505 uppercase tracking-wider mb-1.5">
                      Retail Price (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Selling price"
                      value={addSellPrice}
                      onChange={(e) => setAddSellPrice(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs py-3 px-4 rounded-xl text-zinc-855 dark:text-zinc-200 outline-none transition-all font-semibold"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-zinc-400 dark:text-zinc-505 uppercase tracking-wider mb-1.5">
                      Initial Qty In Stock
                    </label>
                    <input
                      type="number"
                      placeholder="Stock quantity"
                      value={addStockQty}
                      onChange={(e) => setAddStockQty(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs py-3 px-4 rounded-xl text-zinc-855 dark:text-zinc-200 outline-none transition-all font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-zinc-400 dark:text-zinc-505 uppercase tracking-wider mb-1.5">
                      Min Stock Threshold
                    </label>
                    <input
                      type="number"
                      placeholder="Alert threshold"
                      value={addMinStock}
                      onChange={(e) => setAddMinStock(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs py-3 px-4 rounded-xl text-zinc-855 dark:text-zinc-200 outline-none transition-all font-semibold"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3 border-t border-zinc-100 dark:border-zinc-900">
                <button
                  type="button"
                  onClick={() => setIsAddingProduct(false)}
                  className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingNew}
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingNew ? "Creating..." : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
