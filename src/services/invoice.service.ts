import { supabase } from "@/lib/supabase";

async function timed<T>(label: string, fn: () => Promise<T>) {
  const start = Date.now();
  try {
    const res = await fn();
    const dur = Date.now() - start;
    // Log slow calls > 1500ms as warnings for easier triage
    if (dur > 1500) {
      console.warn(`[SLOW FETCH] ${label} took ${dur}ms`);
    } else {
      console.log(`[FETCH TRACE] ${label} ${dur}ms`);
    }
    return res;
  } catch (err) {
    const dur = Date.now() - start;
    console.error(`[FETCH ERROR] ${label} after ${dur}ms`, err);
    throw err;
  }
}

export const invoiceService: any = {
  async getInvoices() {
    return await timed("invoiceService.getInvoices", async () =>
      await supabase
        .from("invoices")
        .select(`
          id,
          invoice_no,
          total_amount,
          payment_mode,
          created_at,
          customers (
            name,
            phone,
            vehicle_no
          )
        `)
        .neq("is_deleted", true)
        .order("id", { ascending: false })
        .limit(50)
    );
  },

  async getRecentInvoices(limit = 5) {
    return await timed("invoiceService.getRecentInvoices", async () =>
      await supabase
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
        .limit(limit)
    );
  },

  async searchInvoices(query: string) {
    if (!query || query.trim() === "") {
      return await this.getInvoices();
    }

    const cleanQuery = query.trim();

    // 1. Search customers matching phone or vehicle_no first
    const { data: matchedCustomers, error: customerError } = await timed(
      `invoiceService.searchInvoices:customers(${cleanQuery})`,
      async () => await supabase
        .from("customers")
        .select("id")
        .or(`phone.ilike.%${cleanQuery}%,vehicle_no.ilike.%${cleanQuery}%`)
    );

    if (customerError) {
      console.error("Error searching customers for invoices:", customerError);
    }

    const matchedCustIds = (matchedCustomers || []).map((c: any) => c.id);

    // 2. Query invoices matching invoice_no OR matching customer_id list
    let dbQuery = supabase
      .from("invoices")
      .select(`
        id,
        invoice_no,
        total_amount,
        payment_mode,
        created_at,
        customers (
          name,
          phone,
          vehicle_no
        )
      `)
      .neq("is_deleted", true);

    if (matchedCustIds.length > 0) {
      dbQuery = dbQuery.or(`invoice_no.ilike.%${cleanQuery}%,customer_id.in.(${matchedCustIds.join(",")})`);
    } else {
      dbQuery = dbQuery.ilike("invoice_no", `%${cleanQuery}%`);
    }

    return await timed(`invoiceService.searchInvoices:invoices(${cleanQuery})`, async () =>
      await dbQuery.order("id", { ascending: false }).limit(100)
    );
  },

  async getInvoiceDetails(invoiceId: number) {
    return await timed(`invoiceService.getInvoiceDetails:${invoiceId}`, async () =>
      await supabase
        .from("invoices")
        .select(`
          *,
          customers (
            name,
            phone,
            vehicle_no
          ),
          invoice_items (
            id,
            qty,
            price,
            total,
            products (
              id,
              brand,
              model,
              tyre_size
            )
          )
        `)
        .eq("id", invoiceId)
        .single()
    );
  },

  async softDeleteInvoice(invoiceId: number, deletedBy: string) {
    return await timed(`invoiceService.softDeleteInvoice:${invoiceId}`, async () =>
      await supabase
        .from("invoices")
        .update({
          is_deleted: true,
          updated_by: deletedBy,
          updated_at: new Date().toISOString()
        })
        .eq("id", invoiceId)
    );
  }
};
