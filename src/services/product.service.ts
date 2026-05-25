import { supabase } from "@/lib/supabase";
import { Product } from "@/types/product";

export const productService = {
  async getProducts() {
    return await supabase
      .from("products")
      .select("id, brand, model, tyre_size, stock_qty, min_stock, buy_price, sell_price, is_active")
      .order("brand", { ascending: true })
      .order("model", { ascending: true });
  },

  async searchProducts(query: string) {
    if (!query) return { data: [], error: null };
    return await supabase
      .from("products")
      .select("id, brand, model, tyre_size, stock_qty, min_stock, buy_price, sell_price, is_active")
      .or(`brand.ilike.%${query}%,model.ilike.%${query}%,tyre_size.ilike.%${query}%`)
      .order("brand", { ascending: true });
  },

  async updateProduct(productId: number, payload: Partial<Product>, updatedBy: string) {
    // 1. Get the current product details to check the old stock quantity
    const { data: oldProduct, error: fetchError } = await supabase
      .from("products")
      .select("stock_qty")
      .eq("id", productId)
      .single();

    if (fetchError) {
      console.error("Error fetching product for update:", fetchError.message || fetchError);
      return { data: null, error: fetchError };
    }

    // 2. Perform the product update
    const updatePayload = {
      ...payload,
      updated_by: updatedBy,
      updated_at: new Date().toISOString()
    };

    const { data, error: updateError } = await supabase
      .from("products")
      .update(updatePayload)
      .eq("id", productId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating product:", updateError.message || updateError);
      return { data: null, error: updateError };
    }

    // 3. If stock quantity changed, log to inventory_logs
    if (payload.stock_qty !== undefined && payload.stock_qty !== oldProduct.stock_qty) {
      const { error: logError } = await supabase
        .from("inventory_logs")
        .insert({
          product_id: productId,
          old_stock: oldProduct.stock_qty,
          new_stock: payload.stock_qty,
          changed_by: updatedBy,
          action_type: "MANUAL_UPDATE"
        });

      if (logError) {
        console.error("Error logging stock change:", logError.message || logError);
      }
    }

    return { data, error: null };
  },

  async createProduct(product: Omit<Product, 'id'>, createdBy: string) {
    const payload = {
      ...product,
      updated_by: createdBy,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from("products")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("Error creating product:", error.message || error);
      return { data: null, error };
    }

    // If stock_qty > 0, log it in inventory_logs
    if (product.stock_qty > 0 && data) {
      const { error: logError } = await supabase
        .from("inventory_logs")
        .insert({
          product_id: data.id,
          old_stock: 0,
          new_stock: product.stock_qty,
          changed_by: createdBy,
          action_type: "MANUAL_UPDATE"
        });

      if (logError) {
        console.error("Error logging initial stock quantity:", logError.message || logError);
      }
    }

    return { data, error: null };
  }
};
