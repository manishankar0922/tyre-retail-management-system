import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Auto-detect if we should run in mock mode
export const isMockMode = !supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("placeholder") || supabaseAnonKey.includes("placeholder");

// ----------------- MOCK DATA SEEDING & CONTROL -----------------

const isBrowser = typeof window !== "undefined";
const memoryDb: Record<string, any[]> = {};

function getInitialData(table: string): any[] {
  if (table === "products") {
    return [
      { id: 1, brand: "Michelin", model: "Pilot Sport 5", tyre_size: "225/45 R17", stock_qty: 12, min_stock: 4, buy_price: 7500, sell_price: 9800, is_active: true },
      { id: 2, brand: "Bridgestone", model: "Turanza T005", tyre_size: "195/65 R15", stock_qty: 3, min_stock: 5, buy_price: 4500, sell_price: 5800, is_active: true },
      { id: 3, brand: "Yokohama", model: "BluEarth AE50", tyre_size: "205/55 R16", stock_qty: 22, min_stock: 6, buy_price: 5200, sell_price: 6800, is_active: true },
      { id: 4, brand: "MRF", model: "ZLX", tyre_size: "165/70 R14", stock_qty: 40, min_stock: 8, buy_price: 2100, sell_price: 2850, is_active: true },
      { id: 5, brand: "Apollo", model: "Alnac 4G", tyre_size: "185/65 R15", stock_qty: 15, min_stock: 5, buy_price: 3100, sell_price: 4100, is_active: true },
      { id: 6, brand: "CEAT", model: "SecuraDrive", tyre_size: "195/55 R16", stock_qty: 8, min_stock: 5, buy_price: 3700, sell_price: 4950, is_active: true }
    ];
  }
  if (table === "customers") {
    return [
      { id: 1, name: "Rajesh Kumar", phone: "9876543210", vehicle_no: "KA-03-MK-7788", created_at: new Date(Date.now() - 3600000 * 24).toISOString() },
      { id: 2, name: "Suresh Patel", phone: "9812345678", vehicle_no: "MH-12-RS-1234", created_at: new Date(Date.now() - 3600000 * 2).toISOString() },
      { id: 3, name: "Vikram Singh", phone: "9900112233", vehicle_no: "DL-01-AB-9900", created_at: new Date().toISOString() }
    ];
  }
  if (table === "invoices") {
    return [
      { id: 1, invoice_no: "INV-2026-0001", customer_id: 1, subtotal: 19600, discount_amount: 500, gst_amount: 3438, total_amount: 22538, payment_mode: "UPI", created_at: new Date(Date.now() - 3600000 * 24).toISOString(), is_deleted: false, updated_by: "Mock Accountant" },
      { id: 2, invoice_no: "INV-2026-0002", customer_id: 2, subtotal: 11600, discount_amount: 0, gst_amount: 2088, total_amount: 13688, payment_mode: "Cash", created_at: new Date(Date.now() - 3600000 * 2).toISOString(), is_deleted: false, updated_by: "Mock Accountant" }
    ];
  }
  if (table === "invoice_items") {
    return [
      { id: 1, invoice_id: 1, product_id: 1, qty: 2, price: 9800, total: 19600 },
      { id: 2, invoice_id: 2, product_id: 2, qty: 2, price: 5800, total: 11600 }
    ];
  }
  if (table === "inventory_logs") {
    return [
      { id: 1, product_id: 1, old_stock: 14, new_stock: 12, changed_by: "Mock Accountant", action_type: "SALE", created_at: new Date(Date.now() - 3600000 * 24).toISOString() },
      { id: 2, product_id: 2, old_stock: 5, new_stock: 3, changed_by: "Mock Accountant", action_type: "SALE", created_at: new Date(Date.now() - 3600000 * 2).toISOString() }
    ];
  }
  if (table === "user_profiles") {
    return [
      { id: "mock-owner-id", full_name: "Mock Owner", role: "owner" },
      { id: "mock-accountant-id", full_name: "Mock Accountant", role: "accountant" }
    ];
  }
  return [];
}

function getMockTable(table: string): any[] {
  if (!isBrowser) {
    return memoryDb[table] || getInitialData(table);
  }
  const key = `mock_db_${table}`;
  const stored = localStorage.getItem(key);
  if (!stored) {
    const initial = getInitialData(table);
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return getInitialData(table);
  }
}

function saveMockTable(table: string, data: any[]) {
  if (!isBrowser) {
    memoryDb[table] = data;
    return;
  }
  localStorage.setItem(`mock_db_${table}`, JSON.stringify(data));
}

// ----------------- MOCK SUPABASE CLIENT -----------------

class MockSupabaseQueryBuilder {
  table: string;
  filters: Array<(item: any) => boolean> = [];
  orderByCol: string | null = null;
  orderByAscending = true;
  limitVal: number | null = null;
  singleRow = false;
  countOptions: string | null = null;

  constructor(table: string) {
    this.table = table;
  }

  select(columns: string = "*", options?: { count?: string; head?: boolean }) {
    if (options?.count) {
      this.countOptions = options.count;
    }
    return this;
  }

  eq(col: string, val: any) {
    this.filters.push((item) => item[col] === val);
    return this;
  }

  neq(col: string, val: any) {
    this.filters.push((item) => item[col] !== val);
    return this;
  }

  gte(col: string, val: any) {
    this.filters.push((item) => {
      if (!item[col]) return false;
      return new Date(item[col]) >= new Date(val);
    });
    return this;
  }

  lte(col: string, val: any) {
    this.filters.push((item) => {
      if (!item[col]) return false;
      return new Date(item[col]) <= new Date(val);
    });
    return this;
  }

  or(queryStr: string) {
    this.filters.push((item) => {
      const parts = queryStr.split(",");
      return parts.some(part => {
        const subParts = part.split(".ilike.");
        if (subParts.length < 2) return false;
        const field = subParts[0].trim();
        const val = subParts[1].replace(/%/g, "").trim().toLowerCase();
        const itemVal = String(item[field] || "").toLowerCase();
        return itemVal.includes(val);
      });
    });
    return this;
  }

  order(col: string, options?: { ascending?: boolean }) {
    this.orderByCol = col;
    this.orderByAscending = options?.ascending !== false;
    return this;
  }

  limit(val: number) {
    this.limitVal = val;
    return this;
  }

  single() {
    this.singleRow = true;
    return this;
  }

  private resolveRelationships(items: any[]) {
    if (this.table === "invoices") {
      const customers = getMockTable("customers");
      return items.map(inv => ({
        ...inv,
        customers: customers.find(c => c.id === inv.customer_id) || null
      }));
    }
    if (this.table === "invoice_items") {
      const products = getMockTable("products");
      return items.map(item => ({
        ...item,
        products: products.find(p => p.id === item.product_id) || null
      }));
    }
    if (this.table === "inventory_logs") {
      const products = getMockTable("products");
      return items.map(log => ({
        ...log,
        products: products.find(p => p.id === log.product_id) || null
      }));
    }
    return items;
  }

  private executeQuery() {
    let list = getMockTable(this.table);

    // Apply filters
    for (const filter of this.filters) {
      list = list.filter(filter);
    }

    // Resolve relationships
    list = this.resolveRelationships(list);

    // Apply sorting
    if (this.orderByCol) {
      list.sort((a, b) => {
        const valA = a[this.orderByCol!];
        const valB = b[this.orderByCol!];
        if (valA < valB) return this.orderByAscending ? -1 : 1;
        if (valA > valB) return this.orderByAscending ? 1 : -1;
        return 0;
      });
    }

    const count = list.length;

    // Apply limit
    if (this.limitVal !== null) {
      list = list.slice(0, this.limitVal);
    }

    let resultData: any = list;
    if (this.singleRow) {
      resultData = list[0] || null;
    }

    return {
      data: resultData,
      error: null,
      count: this.countOptions ? count : null
    };
  }

  // Thenable to allow direct await on the builder
  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    const res = this.executeQuery();
    return Promise.resolve(res).then(onfulfilled, onrejected);
  }

  insert(payload: any) {
    return {
      select: () => {
        return {
          single: () => {
            const list = getMockTable(this.table);
            const items = Array.isArray(payload) ? payload : [payload];
            const newItems = items.map((item, idx) => {
              const newItem = {
                id: list.length > 0 ? Math.max(...list.map((x: any) => typeof x.id === 'number' ? x.id : 0)) + 1 + idx : 1,
                created_at: new Date().toISOString(),
                ...item
              };
              list.push(newItem);
              return newItem;
            });
            saveMockTable(this.table, list);

            // Cascade logic for invoice items: deduct product stock quantity
            if (this.table === "invoice_items") {
              newItems.forEach(item => {
                const products = getMockTable("products");
                const prod = products.find((p: any) => p.id === item.product_id);
                if (prod) {
                  const oldStock = prod.stock_qty;
                  prod.stock_qty = Math.max(0, prod.stock_qty - item.qty);
                  saveMockTable("products", products);

                  // Auto log stock reduction
                  const logs = getMockTable("inventory_logs");
                  logs.push({
                    id: logs.length > 0 ? Math.max(...logs.map((l: any) => l.id)) + 1 : 1,
                    product_id: item.product_id,
                    old_stock: oldStock,
                    new_stock: prod.stock_qty,
                    changed_by: "System Sale",
                    action_type: "SALE",
                    created_at: new Date().toISOString()
                  });
                  saveMockTable("inventory_logs", logs);
                }
              });
            }

            return Promise.resolve({ data: newItems[0], error: null });
          },
          then: (onfulfilled?: (value: any) => any) => {
            const list = getMockTable(this.table);
            const items = Array.isArray(payload) ? payload : [payload];
            const newItems = items.map((item, idx) => {
              const newItem = {
                id: list.length > 0 ? Math.max(...list.map((x: any) => typeof x.id === 'number' ? x.id : 0)) + 1 + idx : 1,
                created_at: new Date().toISOString(),
                ...item
              };
              list.push(newItem);
              return newItem;
            });
            saveMockTable(this.table, list);
            return Promise.resolve({ data: newItems, error: null }).then(onfulfilled);
          }
        };
      },
      then: (onfulfilled?: (value: any) => any) => {
        const list = getMockTable(this.table);
        const items = Array.isArray(payload) ? payload : [payload];
        const newItems = items.map((item, idx) => {
          const newItem = {
            id: list.length > 0 ? Math.max(...list.map((x: any) => typeof x.id === 'number' ? x.id : 0)) + 1 + idx : 1,
            created_at: new Date().toISOString(),
            ...item
          };
          list.push(newItem);
          return newItem;
        });
        saveMockTable(this.table, list);
        return Promise.resolve({ data: newItems, error: null }).then(onfulfilled);
      }
    };
  }

  update(payload: any) {
    return {
      eq: (col: string, val: any) => {
        const executeUpdate = () => {
          const list = getMockTable(this.table);
          const item = list.find((x: any) => x[col] === val);
          if (item) {
            Object.assign(item, payload);
            saveMockTable(this.table, list);
          }
          return { data: item || null, error: null };
        };

        return {
          select: () => {
            return {
              single: () => {
                const res = executeUpdate();
                return Promise.resolve(res);
              }
            };
          },
          then: (onfulfilled?: (value: any) => any) => {
            const res = executeUpdate();
            return Promise.resolve(res).then(onfulfilled);
          }
        };
      }
    };
  }
}

const mockSupabase = {
  auth: {
    signInWithPassword: async ({ email }: { email: string }) => {
      const isOwner = email.toLowerCase().includes("owner");
      return {
        data: {
          user: {
            id: isOwner ? "mock-owner-id" : "mock-accountant-id",
            email: email
          },
          session: {
            access_token: "mock-access-token"
          }
        },
        error: null
      };
    },
    signOut: async () => {
      return { error: null };
    }
  },
  from: (table: string) => {
    return new MockSupabaseQueryBuilder(table);
  }
};

// ----------------- EXPORT DECISION -----------------

let supabaseInstance: any;

if (isMockMode) {
  console.log("[SUPABASE CLIENT] Running in LOCAL MOCK MODE (localStorage fallback)");
  supabaseInstance = mockSupabase;
} else {
  console.log("[SUPABASE CLIENT] Initializing LIVE Supabase connection");
  
  const originalFetch = globalThis.fetch;
  const fetchTracker = async (url: RequestInfo | URL, options?: RequestInit) => {
    const start = Date.now();
    const result = await originalFetch(url, options);
    const duration = Date.now() - start;
    
    if (typeof url === 'string' && url.includes(supabaseUrl!)) {
      const path = url.replace(supabaseUrl!, '');
      const method = options?.method || 'GET';
      console.log(`[FETCH TRACE] ${method} ${path} - ${duration}ms`);
    }
    
    return result;
  };

  supabaseInstance = createClient(
    supabaseUrl!,
    supabaseAnonKey!,
    {
      global: {
        fetch: fetchTracker
      }
    }
  );
}

export const supabase = supabaseInstance;