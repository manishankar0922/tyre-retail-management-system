"use client";

import { useEffect } from "react";

export default function PrintTrigger() {
  useEffect(() => {
    // A small delay ensures the stylesheet and images/fonts are parsed before printing
    const timer = setTimeout(() => {
      try {
        window.print();
      } catch (err) {
        console.error("Print dialog execution failed:", err);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
