import { Suspense } from "react";
import { reportService } from "@/services/report.service";
import DailyReportView from "@/components/reports/DailyReportView";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function DailyReportLoader({ searchParams }: { searchParams: PageProps["searchParams"] }) {
  await searchParams; // Await inside the Suspense boundary to avoid blocking layout
  const data = await reportService.getDailyReport();
  return <DailyReportView data={data} role="owner" />;
}

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

export default function OwnerReportsPage({ searchParams }: PageProps) {
  return (
    <Suspense fallback={<ReportSkeleton />}>
      <DailyReportLoader searchParams={searchParams} />
    </Suspense>
  );
}
