export interface InvoiceItem {
  id?: number;
  invoice_id?: number;
  product_id: number;
  qty: number;
  price: number;
  total: number;
}

export interface Invoice {
  id?: number;
  invoice_no?: string;
  customer_id: number;
  subtotal?: number;
  discount_amount?: number;
  gst_amount?: number;
  total_amount: number;
  payment_mode: string;
  created_at?: string;
  updated_at?: string;
  updated_by?: string;
  is_deleted?: boolean;
  items?: InvoiceItem[];
}
