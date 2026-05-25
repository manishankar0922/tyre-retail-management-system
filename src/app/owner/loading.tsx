import { Loader2 } from "lucide-react";

export default function OwnerLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] w-full animate-in fade-in duration-300">
      <div className="p-4 rounded-2xl bg-white/50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest animate-pulse">
          Loading Data...
        </p>
      </div>
    </div>
  );
}
