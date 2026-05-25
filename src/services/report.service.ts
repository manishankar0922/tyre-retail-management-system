import { supabase } from "@/lib/supabase";

export interface SalesStats {
  grossRevenue: number;
  gstCollected: number;
  discountTotals: number;
  netRevenue: number;
  invoiceCount: number;
  tyresSold: number;
}

export interface PaymentBreakdown {
  cash: number;
  upi: number;
  card: number;
}

export interface LowStockProduct {
  brand: string;
  model: string;
  tyre_size: string;
  stock_qty: number;
  min_stock: number;
}

export interface ActivityLog {
  id: number;
  action_type: string;
  old_stock: number;
  new_stock: number;
  created_at: string;
  product: {
    brand: string;
    model: string;
    tyre_size: string;
  } | null;
}

export interface RecentInvoice {
  id: number;
  invoice_no: string;
  total_amount: number;
  payment_mode: string;
  created_at: string;
  customer_name: string;
}

export interface DailyReportData {
  stats: SalesStats;
  paymentBreakdown: PaymentBreakdown;
  lowStockProducts: LowStockProduct[];
  activityLogs: ActivityLog[];
  recentInvoices: RecentInvoice[];
}

export const reportService = {
  async getDailyReport(): Promise<DailyReportData> {
    // Calculate the start and end of today in local date converted to ISO format.
    // ERP runs in the shop's local timezone.
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTodayISO = startOfToday.toISOString();

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    const endOfTodayISO = endOfToday.toISOString();

        // Parallel fetching to avoid database query cascading and waterfall loading
    const [
      todayInvoicesRes,
      lowStockRes,
      activityLogsRes,
      recentInvoicesRes,
      todayInvoiceItemsRes
    ] = await Promise.all([
      // 1. Fetch today's invoices for revenue and payment breakdown
      supabase
        .from("invoices")
        .select("id, subtotal, discount_amount, gst_amount, total_amount, payment_mode")
        .neq("is_deleted", true)
        .gte("created_at", startOfTodayISO)
        .lte("created_at", endOfTodayISO),

      // 2. Fetch products for low stock checking (fetch minimum columns needed)
      supabase
        .from("products")
        .select("brand, model, tyre_size, stock_qty, min_stock")
        .eq("is_active", true),

      // 3. Fetch latest inventory activity logs (limit to 15 logs)
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
        .limit(15),

      // 4. Fetch latest active invoices (limit to 10 invoices)
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
        .limit(10),

      // 5. Fetch all today's invoice items to calculate tyres sold count
      supabase
        .from("invoice_items")
        .select("qty, invoices!inner(created_at, is_deleted)")
        .neq("invoices.is_deleted", true)
        .gte("invoices.created_at", startOfTodayISO)
        .lte("invoices.created_at", endOfTodayISO)
    ]);

    // Handle database errors gracefully by logging them
    if (todayInvoicesRes.error) console.error("Error fetching today's invoices:", todayInvoicesRes.error);
    if (lowStockRes.error) console.error("Error fetching products for low stock:", lowStockRes.error);
    if (activityLogsRes.error) console.error("Error fetching activity logs:", activityLogsRes.error);
    if (recentInvoicesRes.error) console.error("Error fetching recent invoices:", recentInvoicesRes.error);
    if (todayInvoiceItemsRes.error) console.error("Error fetching today's invoice items:", todayInvoiceItemsRes.error);

    const invoices = todayInvoicesRes.data || [];
    const products = lowStockRes.data || [];
    const rawLogs = activityLogsRes.data || [];
    const rawInvoices = recentInvoicesRes.data || [];
    const rawTodayInvoiceItems = todayInvoiceItemsRes.data || [];

    // Calculate today's sales breakdown (Revenue & Payment Breakdown)
    let todayGrossRevenue = 0;
    let todayDiscountTotals = 0;
    let todayGstCollected = 0;
    let todayNetRevenue = 0;
    let cashTotal = 0;
    let upiTotal = 0;
    let cardTotal = 0;

    invoices.forEach(inv => {
      const gross = Number(inv.subtotal !== null && inv.subtotal !== undefined ? inv.subtotal : (inv.total_amount || 0));
      const disc = Number(inv.discount_amount || 0);
      const gstAmt = Number(inv.gst_amount || 0);
      const net = Number(inv.total_amount || 0);

      todayGrossRevenue += gross;
      todayDiscountTotals += disc;
      todayGstCollected += gstAmt;
      todayNetRevenue += net;
      
      const mode = (inv.payment_mode || "Cash").toUpperCase();
      if (mode === "UPI") {
        upiTotal += net;
      } else if (mode === "CARD") {
        cardTotal += net;
      } else {
        cashTotal += net;
      }
    });

    // Fetch total tyres sold today: Sum up qty from parallel fetched invoice items
    const tyresSoldToday = rawTodayInvoiceItems.reduce((sum, item) => sum + Number(item.qty || 0), 0);

    // Filter products having stock <= min_stock
    const lowStockProducts: LowStockProduct[] = products
      .filter(p => p.stock_qty <= (p.min_stock !== undefined ? p.min_stock : 5))
      .map(p => ({
        brand: p.brand,
        model: p.model,
        tyre_size: p.tyre_size,
        stock_qty: p.stock_qty,
        min_stock: p.min_stock !== undefined ? p.min_stock : 5
      }));

    // Map logs to clean TypeScript objects
    const activityLogs: ActivityLog[] = rawLogs.map((log: any) => ({
      id: log.id,
      action_type: log.action_type,
      old_stock: log.old_stock,
      new_stock: log.new_stock,
      created_at: log.created_at,
      product: log.products ? {
        brand: log.products.brand,
        model: log.products.model,
        tyre_size: log.products.tyre_size
      } : null
    }));

    // Map recent invoices to clean TypeScript objects
    const recentInvoices: RecentInvoice[] = rawInvoices.map((inv: any) => ({
      id: inv.id,
      invoice_no: inv.invoice_no,
      total_amount: Number(inv.total_amount || 0),
      payment_mode: inv.payment_mode || "Cash",
      created_at: inv.created_at,
      customer_name: inv.customers ? inv.customers.name : "Walk-in Customer"
    }));

    return {
      stats: {
        grossRevenue: todayGrossRevenue,
        gstCollected: todayGstCollected,
        discountTotals: todayDiscountTotals,
        netRevenue: todayNetRevenue,
        invoiceCount: invoices.length,
        tyresSold: tyresSoldToday
      },
      paymentBreakdown: {
        cash: cashTotal,
        upi: upiTotal,
        card: cardTotal
      },
      lowStockProducts,
      activityLogs,
      recentInvoices
    };
  }
};
