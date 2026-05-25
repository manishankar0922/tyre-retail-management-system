"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export type SaveStatus = "idle" | "typing" | "saving" | "saved" | "error";

export function useAutoSave(
  saveCallback: (value: string) => Promise<any>,
  delay = 1000
) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const saveCallbackRef = useRef(saveCallback);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Keep callback reference updated
  useEffect(() => {
    saveCallbackRef.current = saveCallback;
  }, [saveCallback]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const triggerSave = useCallback((value: string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setStatus("typing");

    timerRef.current = setTimeout(async () => {
      setStatus("saving");
      try {
        await saveCallbackRef.current(value);
        setStatus("saved");
      } catch (err) {
        console.error("Auto-save failed:", err);
        setStatus("error");
      }
    }, delay);
  }, [delay]);

  return {
    status,
    setStatus,
    triggerSave,
    cancelPending: useCallback(() => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    }, [])
  };
}
