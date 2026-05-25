import { supabase } from "@/lib/supabase";

export interface DashboardKPIs {
  todayGrossRevenue: number;
  todayInvoiceCount: number;
  todayGstCollected: number;
  todayNetRevenue: number;
  lowStockCount: number;
}

export interface RecentInvoiceActivity {
  id: number;
  invoice_no: string;
  total_amount: number;
  payment_mode: string;
  created_at: string;
  customer_name: string;
}

export interface RecentStockActivity {
  id: number;
  action_type: string;
  old_stock: number;
  new_stock: number;
  created_at: string;
  product_name: string;
}

export interface InventoryInsightItem {
  id: number;
  brand: string;
  model: string;
  tyre_size: string;
  stock_qty: number;
  min_stock: number;
}

export interface RecentPurchaseActivity {
  id: number;
  supplier_name: string;
  total_amount: number;
  purchase_date: string;
  created_at: string;
}

export interface ActivityFeedData {
  recentInvoices: RecentInvoiceActivity[];
  recentStockUpdates: RecentStockActivity[];
  recentPurchases: RecentPurchaseActivity[];
}

export const ownerDashboardService = {
  /**
   * Fetches the lightweight daily KPIs without resolving the full dataset.
   * Utilizes Supabase aggregate count features where possible.
   */
  async getTodayKPIs(): Promise<DashboardKPIs> {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTodayISO = startOfToday.toISOString();

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    const endOfTodayISO = endOfToday.toISOString();

    const [invoicesRes, lowStockRes] = await Promise.all([
      supabase
        .from("invoices")
        .select("total_amount, subtotal, gst_amount")
        .neq("is_deleted", true)
        .gte("created_at", startOfTodayISO)
        .lte("created_at", endOfTodayISO),
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true)
        .lte("stock_qty", 5) // Simplified low stock heuristic threshold
    ]);

    const invoices = invoicesRes.data || [];
    let todayGrossRevenue = 0;
    let todayNetRevenue = 0;
    let todayGstCollected = 0;

    invoices.forEach(inv => {
      todayGrossRevenue += Number(inv.subtotal !== null && inv.subtotal !== undefined ? inv.subtotal : (inv.total_amount || 0));
      todayNetRevenue += Number(inv.total_amount || 0);
      todayGstCollected += Number(inv.gst_amount || 0);
    });

    return {
      todayGrossRevenue,
      todayInvoiceCount: invoices.length,
      todayGstCollected,
      todayNetRevenue,
      lowStockCount: lowStockRes.count || 0
    };
  },

  /**
   * Fetches only the required recent activity logs (limited rows).
   */
  async getRecentActivity(limit = 10): Promise<ActivityFeedData> {
    const [recentInvoicesRes, inventoryLogsRes, recentPurchasesRes] = await Promise.all([
      supabase
        .from("invoices")
        .select(`
          id,
          invoice_no,
          total_amount,
          payment_mode,
          created_at,
          customers (
            name
          )
        `)
        .neq("is_deleted", true)
        .order("id", { ascending: false })
        .limit(limit),
      supabase
        .from("inventory_logs")
        .select(`
          id,
          action_type,
          old_stock,
          new_stock,
          created_at,
          products (
            brand,
            model,
            tyre_size
          )
        `)
        .order("id", { ascending: false })
        .limit(limit),
      supabase
        .from("purchases")
        .select(`
          id,
          total_amount,
          purchase_date,
          created_at,
          suppliers (
            name
          )
        `)
        .order("id", { ascending: false })
        .limit(limit)
    ]);

    const rawRecentInvoices = recentInvoicesRes.data || [];
    const rawLogs = inventoryLogsRes.data || [];
    const rawRecentPurchases = recentPurchasesRes.data || [];

    const recentInvoices: RecentInvoiceActivity[] = rawRecentInvoices.map((inv: any) => ({
      id: inv.id,
      invoice_no: inv.invoice_no,
      total_amount: Number(inv.total_amount || 0),
      payment_mode: inv.payment_mode || "Cash",
      created_at: inv.created_at,
      customer_name: inv.customers ? inv.customers.name : "Walk-in Customer"
    }));

    const recentStockUpdates: RecentStockActivity[] = rawLogs.map((log: any) => ({
      id: log.id,
      action_type: log.action_type || "Update",
      old_stock: log.old_stock || 0,
      new_stock: log.new_stock || 0,
      created_at: log.created_at,
      product_name: log.products 
        ? `${log.products.brand} ${log.products.model} (${log.products.tyre_size})` 
        : "Product"
    }));

    const recentPurchases: RecentPurchaseActivity[] = rawRecentPurchases.map((p: any) => ({
      id: p.id,
      supplier_name: p.suppliers ? p.suppliers.name : "Supplier",
      total_amount: Number(p.total_amount || 0),
      purchase_date: p.purchase_date,
      created_at: p.created_at
    }));

    return {
      recentInvoices,
      recentStockUpdates,
      recentPurchases
    };
  },

  /**
   * Fetches all active products for stock panels (lightweight projection).
   */
  async getAllProductsLightweight(limit = 15) {
    const { data } = await supabase
      .from("products")
      .select("id, brand, model, tyre_size, stock_qty, min_stock")
      .eq("is_active", true)
      .order("stock_qty", { ascending: true }) // Automatically put low stock at the top
      .limit(limit);
    return data || [];
  },

  async recordPurchase(
    supplierName: string,
    productId: number,
    qty: number,
    buyPrice: number,
    purchaseDate: string
  ): Promise<boolean> {
    try {
      const cleanName = supplierName.trim();
      const { data: existingSuppliers, error: findError } = await supabase
        .from("suppliers")
        .select("id")
        .ilike("name", cleanName)
        .limit(1);
        
      if (findError) throw findError;
      
      let supplierId: number;
      if (existingSuppliers && existingSuppliers.length > 0) {
        supplierId = existingSuppliers[0].id;
      } else {
        const { data: newSupplier, error: createError } = await supabase
          .from("suppliers")
          .insert({ name: cleanName })
          .select("id")
          .single();
          
        if (createError) throw createError;
        supplierId = newSupplier.id;
      }
      
      const totalAmount = qty * buyPrice;

      // 1. Insert purchase header
      const { data: purchaseData, error: purchaseError } = await supabase
        .from("purchases")
        .insert({
          supplier_id: supplierId,
          total_amount: totalAmount,
          purchase_date: purchaseDate
        })
        .select()
        .single();
        
      if (purchaseError) throw purchaseError;

      const purchaseId = purchaseData.id;

      // 2. Fetch current stock levels of product to calculate log values
      const { data: productData, error: prodFetchError } = await supabase
        .from("products")
        .select("stock_qty")
        .eq("id", productId)
        .single();

      if (prodFetchError) throw prodFetchError;
      const oldStock = productData.stock_qty;
      const newStock = oldStock + qty;

      // 3. Insert purchase item (trigger will automatically increment product stock)
      const { error: itemError } = await supabase
        .from("purchase_items")
        .insert({
          purchase_id: purchaseId,
          product_id: productId,
          qty: qty,
          buy_price: buyPrice,
          total: totalAmount
        });

      if (itemError) {
        console.warn(`Purchase item insert failed. Rolling back purchase header ID: ${purchaseId}`);
        await supabase.from("purchases").delete().eq("id", purchaseId);
        throw itemError;
      }

      // Fetch user name from localStorage if available
      let updaterName = "Owner";
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

      // 4. Insert inventory logs
      const { error: logError } = await supabase
        .from("inventory_logs")
        .insert({
          product_id: productId,
          old_stock: oldStock,
          new_stock: newStock,
          changed_by: updaterName,
          action_type: `PURCHASE (Supplier: ${cleanName})`
        });

      if (logError) {
        console.error("Error inserting inventory log during purchase registration:", logError);
      }

      return true;
    } catch (e) {
      console.error("Failed to record purchase:", e);
      return false;
    }
  },

  async getNotificationFeed() {
    try {
      const [logsRes, invoicesRes, purchasesRes] = await Promise.all([
        supabase
          .from("inventory_logs")
          .select("id, action_type, created_at, products(brand, model)")
          .order("id", { ascending: false })
          .limit(5),
        supabase
          .from("invoices")
          .select("id, invoice_no, total_amount, created_at, customers(name)")
          .neq("is_deleted", true)
          .order("id", { ascending: false })
          .limit(5),
        supabase
          .from("purchases")
          .select("id, total_amount, purchase_date, created_at, suppliers(name)")
          .order("id", { ascending: false })
          .limit(5)
      ]);
      
      const events: any[] = [];
      
      if (logsRes.data) {
        logsRes.data.forEach((log: any) => {
          const prod = log.products;
          const prodName = prod ? `${prod.brand} ${prod.model}` : "Tyre product";
          events.push({
            id: `log-${log.id}`,
            type: "stock_update",
            message: `Stock updated: ${prodName} (${log.action_type})`,
            created_at: log.created_at
          });
        });
      }
      
      if (invoicesRes.data) {
        invoicesRes.data.forEach((inv: any) => {
          const custName = inv.customers ? inv.customers.name : "Walk-in";
          events.push({
            id: `inv-${inv.id}`,
            type: "invoice_generated",
            message: `Invoice Generated: ${inv.invoice_no} for ₹${Number(inv.total_amount || 0).toLocaleString("en-IN")} (${custName})`,
            created_at: inv.created_at
          });
        });
      }
      
      if (purchasesRes.data) {
        purchasesRes.data.forEach((p: any) => {
          const supplierName = p.suppliers ? p.suppliers.name : "Supplier";
          events.push({
            id: `purch-${p.id}`,
            type: "purchase_added",
            message: `Purchase Recorded: ₹${Number(p.total_amount || 0).toLocaleString("en-IN")} from ${supplierName}`,
            created_at: p.created_at
          });
        });
      }
      
      // Low stock checks
      const { data: lowStockProds } = await supabase
        .from("products")
        .select("brand, model, stock_qty, min_stock")
        .eq("is_active", true)
        .lte("stock_qty", 20)
        .limit(20);
        
      if (lowStockProds) {
        lowStockProds.forEach((p: any) => {
          const min = p.min_stock !== null && p.min_stock !== undefined ? p.min_stock : 5;
          if (p.stock_qty <= min) {
            events.push({
              id: `low-${p.brand}-${p.model}`,
              type: "low_stock",
              message: `CRITICAL STOCK: ${p.brand} ${p.model} is low (${p.stock_qty} available, min ${min})`,
              created_at: new Date().toISOString()
            });
          }
        });
      }
      
      return events.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 15);
    } catch (e) {
      console.error("Failed to fetch notification feed:", e);
      return [];
    }
  },

  async getAccountantNotificationFeed() {
    try {
      const [logsRes, invoicesRes, purchasesRes] = await Promise.all([
        supabase
          .from("inventory_logs")
          .select("id, action_type, created_at, products(brand, model)")
          .order("id", { ascending: false })
          .limit(10),
        supabase
          .from("invoices")
          .select("id, invoice_no, total_amount, subtotal, discount_amount, gst_amount, payment_mode, created_at, updated_at, updated_by, customers(name)")
          .neq("is_deleted", true)
          .order("id", { ascending: false })
          .limit(10),
        supabase
          .from("purchases")
          .select("id, total_amount, purchase_date, created_at, suppliers(name)")
          .order("id", { ascending: false })
          .limit(10)
      ]);

      const events: any[] = [];

      // 1. Stock Updated
      if (logsRes.data) {
        logsRes.data.forEach((log: any) => {
          const prod = log.products;
          const prodName = prod ? `${prod.brand} ${prod.model}` : "Tyre product";
          events.push({
            id: `stock-${log.id}`,
            type: "stock_updated",
            message: `Stock Updated: ${prodName} (${log.action_type})`,
            created_at: log.created_at
          });
        });
      }

      // 2. Invoice Generated, Invoice Updated, Payment Completed, GST/Billing Error
      if (invoicesRes.data) {
        invoicesRes.data.forEach((inv: any) => {
          const custName = inv.customers ? inv.customers.name : "Walk-in";
          const totalStr = Number(inv.total_amount || 0).toLocaleString("en-IN");

          // Invoice Generated
          events.push({
            id: `inv-gen-${inv.id}`,
            type: "invoice_generated",
            message: `Invoice Generated: ${inv.invoice_no} for ₹${totalStr} (${custName})`,
            created_at: inv.created_at
          });

          // Invoice Updated
          if (inv.updated_at && inv.created_at) {
            const diff = Math.abs(new Date(inv.updated_at).getTime() - new Date(inv.created_at).getTime());
            if (diff > 1000) {
              events.push({
                id: `inv-upd-${inv.id}`,
                type: "invoice_updated",
                message: `Invoice Updated: ${inv.invoice_no} by ${inv.updated_by || "Accountant"}`,
                created_at: inv.updated_at
              });
            }
          }

          // Payment Completed
          if (inv.payment_mode) {
            events.push({
              id: `pay-comp-${inv.id}`,
              type: "payment_completed",
              message: `Payment Completed: ${inv.invoice_no} via ${inv.payment_mode}`,
              created_at: inv.created_at
            });
          }

          // GST/Billing Error Alert
          const sub = inv.subtotal || 0;
          const disc = inv.discount_amount || 0;
          const taxAmt = sub - disc;
          const gst = inv.gst_amount || 0;
          const expectedTotal = taxAmt + gst;
          if (Math.abs(expectedTotal - inv.total_amount) > 0.05) {
            events.push({
              id: `gst-err-${inv.id}`,
              type: "gst_billing_error",
              message: `GST/Billing Error Alert: Mathematical discrepancy on ${inv.invoice_no} (Expected: ₹${expectedTotal.toFixed(2)}, Found: ₹${inv.total_amount})`,
              created_at: inv.created_at
            });
          }
        });
      }

      // 3. Purchase Added
      if (purchasesRes.data) {
        purchasesRes.data.forEach((p: any) => {
          const supplierName = p.suppliers ? p.suppliers.name : "Supplier";
          events.push({
            id: `purch-${p.id}`,
            type: "purchase_added",
            message: `Purchase Added: ₹${Number(p.total_amount || 0).toLocaleString("en-IN")} from ${supplierName}`,
            created_at: p.created_at
          });
        });
      }

      return events.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 30);
    } catch (e) {
      console.error("Failed to fetch accountant notification feed:", e);
      return [];
    }
  }
};
