import { supabase } from "@/lib/supabase";
import { Invoice } from "@/types/invoice";

export const billingService = {
  async generateBill(
    invoice: { 
      customer_id: number; 
      subtotal: number;
      discount_amount: number;
      gst_amount: number;
      total_amount: number; 
      payment_mode: string 
    },
    items: { product_id: number; qty: number; price: number; total: number }[],
    accountantName: string
  ) {
    try {
      // 1. Generate invoice number automatically
      let invoiceNo = `INV-${Date.now()}`;
      try {
        const { data: latestInvoice, error: fetchError } = await supabase
          .from("invoices")
          .select("invoice_no")
          .order("id", { ascending: false })
          .limit(1);

        if (fetchError) {
          console.error("Error fetching latest invoice number:", JSON.stringify(fetchError, null, 2));
        } else if (latestInvoice && latestInvoice.length > 0) {
          const lastNo = latestInvoice[0].invoice_no;
          const match = lastNo.match(/^INV-(\d+)$/);
          if (match) {
            const nextNum = parseInt(match[1]) + 1;
            invoiceNo = `INV-${nextNum}`;
          }
        } else {
          // Database is empty, start sequence at INV-1001
          invoiceNo = "INV-1001";
        }
      } catch (err) {
        console.error("Unexpected exception during invoice number generation:", err);
      }

      console.log(`Generated Invoice Number for Insertion: ${invoiceNo}`);

      // 1. Fetch current stock levels of products before we insert invoice items (which decreases stock)
      const productIds = items.map(item => item.product_id);
      const { data: currentProducts, error: prodFetchError } = await supabase
        .from("products")
        .select("id, stock_qty, brand, model")
        .in("id", productIds);

      if (prodFetchError) {
        console.error("Error fetching product stock levels before billing:", prodFetchError);
        return { success: false, error: "Failed to verify product stock levels from the database." };
      }

      if (!currentProducts || currentProducts.length === 0) {
        return { success: false, error: "None of the requested products could be found in the database." };
      }

      // 2. Validate stock levels for each item BEFORE inserting the invoice header
      for (const item of items) {
        const prod = currentProducts.find(p => p.id === item.product_id);
        if (!prod) {
          return { success: false, error: `Product ID ${item.product_id} not found in the database.` };
        }
        if (item.qty <= 0 || isNaN(item.qty)) {
          return { success: false, error: `Invalid quantity (${item.qty}) requested for ${prod.brand} ${prod.model}.` };
        }
        if (prod.stock_qty < item.qty) {
          return {
            success: false,
            error: `Insufficient stock for ${prod.brand} ${prod.model}. Available: ${prod.stock_qty}, Requested: ${item.qty}.`
          };
        }
      }

      // 3. Insert main invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          invoice_no: invoiceNo,
          customer_id: invoice.customer_id,
          subtotal: invoice.subtotal,
          discount_amount: invoice.discount_amount,
          gst_amount: invoice.gst_amount,
          total_amount: invoice.total_amount,
          payment_mode: invoice.payment_mode,
          updated_by: accountantName,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (invoiceError) {
        console.error("FULL Supabase Error Output (Invoice Insert):");
        console.log(JSON.stringify(invoiceError, null, 2));
        return { success: false, error: invoiceError.message || "Database error creating invoice header." };
      }

      const createdInvoice = invoiceData as Invoice;
      const invoiceId = createdInvoice.id;

      if (!invoiceId) {
        return { success: false, error: "Failed to retrieve generated invoice ID from DB." };
      }

      // 4. Map invoice items to include the foreign key
      const itemsToInsert = items.map(item => ({
        invoice_id: invoiceId,
        product_id: item.product_id,
        qty: item.qty,
        price: item.price,
        total: item.total
      }));

      // 5. Insert items into invoice_items table
      const { error: itemsError } = await supabase
        .from("invoice_items")
        .insert(itemsToInsert);

      if (itemsError) {
        console.error("FULL Supabase Error Output (Invoice Items Insert):");
        console.log(JSON.stringify(itemsError, null, 2));

        // TRANSACTION ROLLBACK: Delete the created invoice header
        console.warn(`Rolling back transaction: deleting invoice ${invoiceNo} (ID: ${invoiceId}) due to items insertion failure.`);
        const { error: rollbackError } = await supabase
          .from("invoices")
          .delete()
          .eq("id", invoiceId);

        if (rollbackError) {
          console.error("CRITICAL: Rollback failed! Orphaned invoice header exists:", rollbackError);
          return {
            success: false,
            error: `Invoice checkout failed. System failed to write invoice items (${itemsError.message}) and manual rollback failed: ${rollbackError.message}`
          };
        }

        return { 
          success: false, 
          error: `Checkout failed: ${itemsError.message}. The invoice transaction was safely aborted and rolled back.` 
        };
      }

      // 6. Insert inventory logs for stock deduction
      if (currentProducts && currentProducts.length > 0) {
        const logsToInsert = items.map(item => {
          const prod = currentProducts.find(p => p.id === item.product_id);
          const oldStock = prod ? prod.stock_qty : 0;
          const newStock = oldStock - item.qty;
          return {
            product_id: item.product_id,
            old_stock: oldStock,
            new_stock: newStock,
            changed_by: accountantName,
            action_type: `SALE (Invoice: ${invoiceNo})`
          };
        });

        const { error: logsError } = await supabase
          .from("inventory_logs")
          .insert(logsToInsert);

        if (logsError) {
          console.error("Error inserting inventory logs during sale:", logsError.message || logsError);
        }
      }

      return { 
        success: true, 
        invoice: createdInvoice 
      };

    } catch (err: any) {
      console.error("Exception caught in billingService.generateBill:", err);
      return { success: false, error: err.message || "An unexpected error occurred during bill generation." };
    }
  }
};
