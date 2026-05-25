export function parseTimestampToDate(timestamp?: string | number | Date | null): Date | null {
  if (!timestamp) return null;

  if (timestamp instanceof Date) {
    if (Number.isNaN(timestamp.getTime())) return null;
    return timestamp;
  }

  const trimmed = String(timestamp).trim();

  // Supabase may return timestamps as 'YYYY-MM-DD HH:MM:SS' without timezone.
  const spaceIso = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[+-]\d{2}:\d{2})?$/;
  const isoLike = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/;

  try {
    if (spaceIso.test(trimmed)) {
      // Treat as UTC when there is no explicit timezone
      return new Date(trimmed.replace(" ", "T") + "Z");
    }

    if (isoLike.test(trimmed)) {
      return new Date(trimmed);
    }

    if (/^\d+$/.test(trimmed)) {
      return new Date(Number(trimmed));
    }

    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Format to IST readable timestamp: "25 May 2026, 9:55 AM"
 */
export function formatIST(timestamp?: string | number | Date | null): string {
  const parsed = parseTimestampToDate(timestamp);
  if (!parsed) return "N/A";
  
  try {
    return parsed.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).replace(/am|pm/i, (m) => m.toUpperCase());
  } catch {
    return "Invalid Date";
  }
}

/**
 * Format to IST readable date only: "25 May 2026"
 */
export function formatDateIST(timestamp?: string | number | Date | null): string {
  const parsed = parseTimestampToDate(timestamp);
  if (!parsed) return "N/A";
  
  try {
    return parsed.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "Invalid Date";
  }
}

/**
 * Format to IST readable time only: "9:55 AM"
 */
export function formatTimeIST(timestamp?: string | number | Date | null): string {
  const parsed = parseTimestampToDate(timestamp);
  if (!parsed) return "N/A";
  
  try {
    return parsed.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).replace(/am|pm/i, (m) => m.toUpperCase());
  } catch {
    return "Invalid Time";
  }
}
