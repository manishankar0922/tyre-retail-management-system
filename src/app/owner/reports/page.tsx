"use client";

import { useEffect, useState } from "react";
import { reportService } from "@/services/report.service";
import DailyReportView from "@/components/reports/DailyReportView";

function ReportSkeleton() {
  return (
    <div className="space-y-6 animate-pulse py-2">
      {/* Header Banner */}
      <div className="h-20 bg-zinc-200 dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-800" />
      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-[400px] bg-zinc-200 dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-800" />
        <div className="h-[400px] bg-zinc-200 dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-800" />
      </div>
    </div>
  );
}

export default function OwnerReportsPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      try {
        setIsLoading(true);
        const reportData = await reportService.getDailyReport();
        setData(reportData);
      } catch (err) {
        console.error("Error loading owner report:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadReport();
  }, []);

  if (isLoading || !data) {
    return <ReportSkeleton />;
  }

  return <DailyReportView data={data} role="owner" />;
}
