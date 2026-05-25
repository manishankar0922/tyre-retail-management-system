import { supabase } from "@/lib/supabase";

export const customerService = {
  async getCustomers() {
    return await supabase.from("customers").select("id, name, phone, vehicle_no");
  },

  async searchCustomers(query: string) {
    if (!query) return { data: [], error: null };
    
    // Search by matching partial phone number OR partial vehicle_no OR partial customer name
    return await supabase
      .from("customers")
      .select("id, name, phone, vehicle_no")
      .or(`phone.ilike.%${query}%,vehicle_no.ilike.%${query}%,name.ilike.%${query}%`);
  },

  async createCustomer(name: string, phone: string, vehicleNo: string) {
    return await supabase
      .from("customers")
      .insert({
        name: name.trim(),
        phone: phone.trim(),
        vehicle_no: vehicleNo.trim().toUpperCase(),
      })
      .select()
      .single();
  }
};
