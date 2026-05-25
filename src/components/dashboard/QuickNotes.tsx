"use client";

import React, { useEffect, useState, useCallback } from "react";
import { StickyNote, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { notesService, QuickNote } from "@/services/notes.service";
import NoteTextarea from "./NoteTextarea";
import NotesList from "./NotesList";

interface CurrentUser {
  id: number;
  name: string;
  role: string;
}

interface QuickNotesProps {
  variant?: "dashboard" | "sidebar";
}

export default function QuickNotes({ variant = "dashboard" }: QuickNotesProps) {
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(variant === "sidebar");

  const isSidebar = variant === "sidebar";

  // Load current session user
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("currentUser");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setCurrentUser({
            id: parsed.id || 3,
            name: parsed.name || "Store Accountant",
            role: parsed.role || "accountant"
          });
        } catch (e) {
          // fallback
        }
      }
      
      // Default fallback if no session is active
      if (!stored) {
        setCurrentUser({
          id: 3, // Fallback ID from users sample
          name: "Store Accountant",
          role: "accountant"
        });
      }
    }
  }, []);

  const loadNotes = useCallback(async () => {
    setIsLoading(true);
    try {
      const limit = isSidebar ? 3 : 5;
      const data = await notesService.fetchRecentNotes(limit);
      setNotes(data);
    } catch (e) {
      console.error("Failed to load quick notes:", e);
    } finally {
      setIsLoading(false);
    }
  }, [isSidebar]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Note creation handler
  const handleNoteCreated = useCallback((newNote: QuickNote) => {
    if (newNote && currentUser) {
      if (!newNote.users) {
        newNote.users = { name: currentUser.name };
      }
    }
    setNotes((prev) => {
      const filtered = prev.filter((n) => n.id !== newNote.id);
      return [newNote, ...filtered];
    });
  }, [currentUser]);

  // Note updates handler
  const handleNoteUpdated = useCallback((id: number, text: string) => {
    if (!text.trim()) {
      setNotes((prev) => prev.filter((n) => n.id !== id));
      return;
    }

    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, note: text } : n))
    );
  }, []);

  // Note optimistic deletion handler
  const handleNoteDeleted = useCallback(async (id: number) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    await notesService.deleteNote(id);
  }, []);

  if (!currentUser) return null;

  // Render Sidebar Variant
  if (isSidebar) {
    return (
      <div className="border-t border-zinc-900 bg-zinc-950/20">
        {/* Collapsible Header */}
        <div 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center justify-between px-5 py-3 hover:bg-zinc-900/40 transition-colors cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <StickyNote className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-[11px] font-extrabold tracking-wider uppercase text-zinc-400">
              Quick Notes
            </span>
            {notes.length > 0 && (
              <span className="text-[9px] font-black px-1.5 py-0.2 bg-zinc-800 text-zinc-400 rounded-md border border-zinc-700/40">
                {notes.length}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={loadNotes}
              className="p-1 rounded-md hover:bg-zinc-900 text-zinc-500 hover:text-zinc-350 transition-colors cursor-pointer"
              title="Reload Notes"
            >
              <RefreshCw className={`w-2.5 h-2.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-zinc-500 hover:text-zinc-350"
            >
              {isCollapsed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Collapsible Body */}
        {!isCollapsed && (
          <div className="px-5 pb-5 pt-1 space-y-3.5">
            <NoteTextarea
              userId={currentUser.id}
              onNoteCreated={handleNoteCreated}
              onNoteUpdated={handleNoteUpdated}
            />

            <div className="border-t border-zinc-900/80 pt-3 space-y-2">
              <h4 className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-500">
                Recent Notes
              </h4>
              
              {isLoading && notes.length === 0 ? (
                <div className="py-3 text-center text-zinc-600 text-[10px] font-bold">
                  Syncing database...
                </div>
              ) : (
                <NotesList notes={notes} onDelete={handleNoteDeleted} />
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render Dashboard Variant (Original Panel)
  return (
    <div className="bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between">
      <div className="p-5 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-100 flex items-center gap-1.5">
            <StickyNote className="w-4 h-4 text-zinc-400" />
            <span>Quick Shop Notes</span>
          </h3>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">
            Fast accountant scratchpad
          </p>
        </div>
        <button
          onClick={loadNotes}
          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          title="Reload Notes"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="p-5 space-y-4">
        <NoteTextarea
          userId={currentUser.id}
          onNoteCreated={handleNoteCreated}
          onNoteUpdated={handleNoteUpdated}
        />

        <div className="border-t border-zinc-100 dark:border-zinc-900/60 pt-4 space-y-2">
          <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            Recent Notes History
          </h4>
          
          {isLoading && notes.length === 0 ? (
            <div className="py-6 text-center text-zinc-455 dark:text-zinc-500 text-xs font-semibold">
              Syncing notes database...
            </div>
          ) : (
            <NotesList notes={notes} onDelete={handleNoteDeleted} />
          )}
        </div>
      </div>
    </div>
  );
}
