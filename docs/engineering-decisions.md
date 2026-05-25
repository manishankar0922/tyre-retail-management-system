# Engineering Decisions & Hardening

The TyreRetail Pro ERP is designed for a chaotic physical store environment. The engineering choices prioritize **operational reliability** and **data integrity** over raw UI complexity.

## 1. Auth Stabilization & Middleware
Initially, auth checks were handled on the client-side using `useEffect` and React state. This caused a "flash of unauthenticated content" and slow redirects.
**Decision:** We migrated all role-based routing (Owner vs. Accountant) to a Next.js Edge Middleware (`src/proxy.ts`). 
- **Result:** Instant, server-side secure routing. The client never renders a restricted page layout.

## 2. Multi-Tab Inventory Synchronization
A major operational risk occurs when two tabs are open (e.g., Billing and Inventory), and an invoice is generated in one tab, leaving the other tab showing stale inventory data.
**Decision:** We bypassed heavy server-side polling and implemented a native `localStorage` event bridge.
- **Result:** When an invoice generates, a `invoice_saved_event` is written to localStorage. The background tabs listen for this `StorageEvent` and silently refetch their inventory cache in real-time without unmounting the UI or running a full `router.refresh()` storm.

## 3. Hydration Reduction
The dashboard originally suffered from heavy JavaScript execution as pure structural pages were marked as `"use client"`.
**Decision:** We aggressively audited component boundaries. Pages that only acted as wrappers (like `/owner/page.tsx`) were refactored into React Server Components (RSC).
- **Result:** Reduced main-thread blocking time by eliminating unnecessary hydration overhead on layout shells.

## 4. Transaction Safety & Inventory Correctness
Race conditions in a retail environment are catastrophic. If two accountants bill the last tyre simultaneously, stock goes negative.
**Decision:** 
1. **Application Constraints:** Client-side UI strictly validates `qty > 0` and checks against cached stock limits, locking the button (`disabled={isLoading}`) during checkout.
2. **Database Rollbacks:** If the line-items fail to insert due to a database-level trigger exception, the invoice header is caught and manually rolled back (deleted) to prevent orphaned records.
3. **Schema Checks:** The PostgreSQL database strictly enforces `CHECK (stock_qty >= 0)`.
- **Result:** Bulletproof inventory integrity.

## 5. Long-Session Stability
Retail ERPs are left open for 8+ hours a day. Progressive slowdowns are unacceptable.
**Decision:** We isolated auto-refreshing components. Instead of refreshing the entire dashboard tree for notifications, we isolated a 5-minute polling interval strictly inside the `<NotificationBell />` component, tied to `visibilitychange` events so it sleeps when the tab is backgrounded.
- **Result:** Zero memory leaks and consistent UI performance across an 8-hour shift.
