import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import OwnerSettings from "@/components/settings/OwnerSettings";
export default function OwnerSettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-850 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/owner/dashboard"
            className="p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-extrabold text-zinc-900 dark:text-white">
              Owner Control Center
            </h1>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-505 font-semibold uppercase tracking-wider">
              Manage business headers, default billing settings, taxes, printer choices, and credentials
            </p>
          </div>
        </div>
      </div>

      {/* Main Owner Form Component */}
      <OwnerSettings />
    </div>
  );
}
