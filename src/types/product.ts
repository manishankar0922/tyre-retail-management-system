export interface Product {
  id: number;
  brand: string;
  model: string;
  tyre_size: string;
  stock_qty: number;
  min_stock?: number;
  buy_price: number;
  sell_price: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  updated_by?: string;
}
