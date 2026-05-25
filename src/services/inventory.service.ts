import { supabase } from "@/lib/supabase";

export const inventoryService = {
  async getProducts() {
    return await supabase.from("products").select("*");
  },
  // Add other inventory related services here
};
