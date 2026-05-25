"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthListener() {
  const router = useRouter();

  useEffect(() => {
    // Intercept and prevent the Next.js Dev Overlay for Supabase "Invalid Refresh Token" errors
    const handleRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      if (
        error &&
        (error.name === "AuthApiError" ||
          error.status === 400 ||
          error.message?.includes("Refresh Token") ||
          String(error).includes("Refresh Token"))
      ) {
        event.preventDefault(); // Stop Next.js error overlay
        console.warn("Caught invalid refresh token unhandled rejection. Cleaning session...");
        clearSession();
        router.push("/");
      }
    };

    window.addEventListener("unhandledrejection", handleRejection);

    // Only listen to active auth events, skip the redundant initial mount fetch
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        clearSession();
        router.push("/");
      } else if (event === "TOKEN_REFRESHED" && session) {
        document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=86400; SameSite=Lax`;
      }
    });

    function clearSession() {
      localStorage.removeItem("currentUser");
      document.cookie = "currentUser=; path=/; max-age=0; SameSite=Lax";
      document.cookie = "sb-access-token=; path=/; max-age=0; SameSite=Lax";
    }

    return () => {
      window.removeEventListener("unhandledrejection", handleRejection);
      subscription.unsubscribe();
    };
  }, [router]);

  return null;
}
