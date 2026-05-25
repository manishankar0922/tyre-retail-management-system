import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
}
if (!supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY environment variable");
}

const originalFetch = globalThis.fetch;
const fetchTracker = async (url: RequestInfo | URL, options?: RequestInit) => {
  const start = Date.now();
  const result = await originalFetch(url, options);
  const duration = Date.now() - start;
  
  if (typeof url === 'string' && url.includes(supabaseUrl)) {
    const path = url.replace(supabaseUrl, '');
    const method = options?.method || 'GET';
    console.log(`[FETCH TRACE] ${method} ${path} - ${duration}ms`);
  }
  
  return result;
};

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    global: {
      fetch: fetchTracker
    }
  }
);