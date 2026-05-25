"use client";

import React from "react";
import { Trash2, Calendar } from "lucide-react";
import { QuickNote } from "@/services/notes.service";
import { formatIST, formatTimeIST } from "@/utils/date";

interface NotesListProps {
  notes: QuickNote[];
  onDelete: (id: number) => void;
}

function NotesList({ notes, onDelete }: NotesListProps) {
  const formatTime = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const isToday = new Date().toDateString() === date.toDateString();
    if (isToday) return formatTimeIST(dateStr);
    return formatIST(dateStr);
  };

  if (notes.length === 0) {
    return (
      <div className="py-6 text-center text-zinc-400 dark:text-zinc-500 text-xs font-semibold">
        No recent scratchpad notes.
      </div>
    );
  }

  return (
    <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
      {notes.map((note) => {
        const creatorName = note.users?.name || "System";
        const initials = creatorName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase() || "S";

        return (
          <div
            key={note.id}
            className="group flex gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 rounded-xl hover:border-zinc-300 dark:hover:border-zinc-700/80 transition-all duration-200"
          >
            {/* User Initials Circle */}
            <div
              className="w-7 h-7 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 flex items-center justify-center text-[10px] font-black shrink-0 select-none"
              title={`Created by ${creatorName}`}
            >
              {initials}
            </div>

            {/* Note text and timestamp */}
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-xs text-zinc-850 dark:text-zinc-200 font-semibold leading-relaxed break-words whitespace-pre-wrap">
                {note.note}
              </p>
              
              <div className="flex items-center gap-1.5 text-[9px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
                <Calendar className="w-2.5 h-2.5 shrink-0" />
                <span>{formatTime(note.created_at)}</span>
                <span>&bull;</span>
                <span className="text-zinc-500">{creatorName}</span>
              </div>
            </div>

            {/* Delete button (Optimistic delete trigger) */}
            <button
              onClick={() => onDelete(note.id)}
              className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 text-zinc-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer self-start shrink-0"
              title="Delete Note"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// Wrap in React.memo to prevent re-renders when parent states change but notes list remains referentially identical
export default React.memo(NotesList);
