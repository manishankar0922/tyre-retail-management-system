"use client";

import React, { useEffect, useState, useRef } from "react";
import { PlusCircle, FileText, CheckCircle, RefreshCw, AlertCircle } from "lucide-react";
import { useAutoSave, SaveStatus } from "@/hooks/useAutoSave";
import { notesService, QuickNote } from "@/services/notes.service";

interface NoteTextareaProps {
  userId: number;
  onNoteCreated: (note: QuickNote) => void;
  onNoteUpdated: (id: number, text: string) => void;
}

export default function NoteTextarea({ userId, onNoteCreated, onNoteUpdated }: NoteTextareaProps) {
  const [text, setText] = useState("");
  const activeNoteIdRef = useRef<number | null>(null);
  
  // Save handler that is debounced
  const saveNote = async (currentText: string) => {
    const trimmed = currentText.trim();
    if (!trimmed) {
      // If user cleared the text and there is an active note, delete it
      if (activeNoteIdRef.current !== null) {
        const idToDelete = activeNoteIdRef.current;
        activeNoteIdRef.current = null;
        await notesService.deleteNote(idToDelete);
        onNoteUpdated(idToDelete, ""); // notify parent to remove or clear
      }
      return;
    }

    if (activeNoteIdRef.current === null) {
      // Create new note
      const newNote = await notesService.createNote(trimmed, userId);
      if (newNote) {
        activeNoteIdRef.current = newNote.id;
        onNoteCreated(newNote);
      } else {
        throw new Error("Failed to create note");
      }
    } else {
      // Update existing note
      const success = await notesService.updateNote(activeNoteIdRef.current, trimmed);
      if (success) {
        onNoteUpdated(activeNoteIdRef.current, trimmed);
      } else {
        throw new Error("Failed to update note");
      }
    }
  };

  const { status, triggerSave, setStatus } = useAutoSave(saveNote, 1000);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    triggerSave(val);
  };

  const handleStartNewNote = () => {
    setText("");
    activeNoteIdRef.current = null;
    setStatus("idle");
  };

  // Helper to render simple indicator
  const renderStatus = () => {
    switch (status) {
      case "typing":
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-400">
            <RefreshCw className="w-3 h-3 animate-spin text-indigo-500" />
            <span>Typing...</span>
          </span>
        );
      case "saving":
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-400">
            <RefreshCw className="w-3 h-3 animate-spin text-purple-500" />
            <span>Saving...</span>
          </span>
        );
      case "saved":
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500">
            <CheckCircle className="w-3 h-3" />
            <span>Saved</span>
          </span>
        );
      case "error":
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500">
            <AlertCircle className="w-3 h-3" />
            <span>Error saving</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-400">
            <FileText className="w-3 h-3" />
            <span>Scratchpad</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <textarea
          value={text}
          onChange={handleChange}
          placeholder="Type an operational note or scratchpad reminder... (Auto-saves)"
          rows={3}
          className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs py-2.5 px-3.5 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-semibold text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 resize-none transition-all"
        />
        
        {text.trim() && (
          <button
            type="button"
            onClick={handleStartNewNote}
            className="absolute top-2 right-2 p-1 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:text-indigo-500 text-zinc-400 transition-colors shadow-sm cursor-pointer"
            title="Start a new note"
          >
            <PlusCircle className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex justify-between items-center px-1">
        {renderStatus()}
        <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
          {text.length} chars
        </span>
      </div>
    </div>
  );
}
