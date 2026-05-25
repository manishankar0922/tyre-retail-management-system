import { BillingItem, DiscountConfig, GstConfig, BillingSummaryResult } from "@/types/billing";

/**
 * Calculates the raw subtotal from billing items.
 */
export function calculateSubtotal(items: BillingItem[]): number {
  return items.reduce((sum, item) => {
    if (item.product && item.qty > 0) {
      const price = Number(item.price) || 0;
      const qty = Number(item.qty) || 0;
      return sum + (price * qty);
    }
    return sum;
  }, 0);
}

/**
 * Calculates the discount amount based on config, capped at subtotal.
 */
export function calculateDiscount(subtotal: number, discount: DiscountConfig): number {
  let discountAmount = 0;
  if (subtotal > 0 && discount.value > 0) {
    if (discount.type === "percentage") {
      const pct = Math.max(0, Math.min(100, Number(discount.value) || 0));
      discountAmount = subtotal * (pct / 100);
    } else {
      discountAmount = Math.max(0, Number(discount.value) || 0);
    }
  }
  return Math.min(discountAmount, subtotal);
}

/**
 * Calculates the taxable amount after applying discount to subtotal.
 */
export function calculateTaxableAmount(subtotal: number, discountAmount: number): number {
  return Math.max(0, subtotal - discountAmount);
}

/**
 * Calculates GST amount based on taxable amount.
 */
export function calculateGST(taxableAmount: number, gst: GstConfig): number {
  if (gst.enabled && gst.rate > 0) {
    const rate = Math.max(0, Number(gst.rate) || 0);
    return taxableAmount * (rate / 100);
  }
  return 0;
}

/**
 * Calculates the final net total.
 */
export function calculateFinalTotal(taxableAmount: number, gstAmount: number): number {
  return Math.max(0, taxableAmount + gstAmount);
}

/**
 * Main orchestration function for billing calculations.
 * Returns values rounded to 2 decimal places to prevent float issues.
 */
export function calculateBillingTotals(
  items: BillingItem[],
  discount: DiscountConfig,
  gst: GstConfig
): BillingSummaryResult {
  const subtotal = Math.round(calculateSubtotal(items) * 100) / 100;
  const discountAmount = Math.round(calculateDiscount(subtotal, discount) * 100) / 100;
  const taxableAmount = Math.round(calculateTaxableAmount(subtotal, discountAmount) * 100) / 100;
  const gstAmount = Math.round(calculateGST(taxableAmount, gst) * 100) / 100;
  const cgstAmount = Math.round((gstAmount / 2) * 100) / 100;
  const sgstAmount = Math.round((gstAmount - cgstAmount) * 100) / 100;
  const finalTotal = Math.round(calculateFinalTotal(taxableAmount, gstAmount) * 100) / 100;

  return {
    subtotal,
    discountAmount,
    taxableAmount,
    gstAmount,
    cgstAmount,
    sgstAmount,
    finalTotal
  };
}
