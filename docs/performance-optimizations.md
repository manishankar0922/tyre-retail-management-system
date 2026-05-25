# Performance Optimizations

Our transition from an MVP to a production-grade ERP required several strict performance optimizations targeted at reducing Vercel serverless execution time and lowering browser memory usage.

## 1. Targeted Cache Invalidation
**Problem**: After completing an action (like generating a bill), the initial architecture invoked `router.refresh()` which caused the entire Next.js layout to fetch fresh server data and re-render. This created a visual flash and unnecessary network round trips.
**Optimization**: We isolated mutations. Sibling components (like the Inventory Table) listen to lightweight local events (`window.dispatchEvent` or `StorageEvent`) to surgically fetch *only* the data they need, keeping the Dashboard skeleton intact and instantly responsive.

## 2. In-Memory Search Indexing
**Problem**: Searching 1,000+ inventory items required constant API calls (`ilike` queries) to Supabase, which hit request limits and felt laggy.
**Optimization**: For high-read/low-write views (like the Billing item selection), the entire product catalog is prefetched and cached locally. We utilized `useMemo` hooks to filter data instantly on the client-side, achieving 0ms search latency without hitting the database.

## 3. Image & Font Optimization
We switched entirely to `next/font` (Inter) to eliminate Cumulative Layout Shift (CLS). Static assets use standard `.webp` optimizations.

## 4. Supabase Query Limiting
**Problem**: Dashboard activity feeds were fetching entire history tables.
**Optimization**: We enforced strict `.limit()` constraints and refined `select()` payloads to ONLY request the columns rendered on the screen, shrinking the JSON payload over the wire by over 70%.
