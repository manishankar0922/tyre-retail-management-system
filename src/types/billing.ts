import { Product } from "./product";

export type DiscountType = "percentage" | "fixed";

export interface DiscountConfig {
  type: DiscountType;
  value: number;
}

export interface GstConfig {
  enabled: boolean;
  rate: number; // e.g. 5, 12, 18
}

export interface BillingItem {
  product: Product | null;
  qty: number;
  price: number;
}

export interface BillingSummaryResult {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  gstAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  finalTotal: number;
}

