import { supabase } from "@/lib/supabase";

export interface QuickNote {
  id: number;
  note: string;
  created_by: number;
  created_at: string;
  users?: {
    name: string;
  } | null;
}

export const notesService = {
  async fetchRecentNotes(limit = 10): Promise<QuickNote[]> {
    // Try with joining users table
    const { data, error } = await supabase
      .from("quick_notes")
      .select(`
        id,
        note,
        created_by,
        created_at,
        users (
          name
        )
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.warn("Failed fetching quick_notes with users join, trying fallback...", error);
      
      // Fallback: Fetch without join
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("quick_notes")
        .select("id, note, created_by, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (fallbackError) {
        console.error("Error fetching quick_notes fallback:", fallbackError);
        return [];
      }
      return (fallbackData || []).map((item: any) => ({
        id: item.id,
        note: item.note,
        created_by: item.created_by,
        created_at: item.created_at,
        users: null
      }));
    }

    return (data || []).map((item: any) => {
      const u = Array.isArray(item.users) ? item.users[0] : item.users;
      return {
        id: item.id,
        note: item.note,
        created_by: item.created_by,
        created_at: item.created_at,
        users: u ? { name: u.name } : null
      };
    });
  },

  async createNote(note: string, createdByUserId: number): Promise<QuickNote | null> {
    const { data, error } = await supabase
      .from("quick_notes")
      .insert({
        note,
        created_by: createdByUserId,
        created_at: new Date().toISOString()
      })
      .select(`
        id,
        note,
        created_by,
        created_at,
        users (
          name
        )
      `)
      .single();

    if (error) {
      console.warn("Failed creating note with join, trying fallback...", error);
      
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("quick_notes")
        .insert({
          note,
          created_by: createdByUserId,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (fallbackError) {
        console.error("Error creating note fallback:", fallbackError);
        return null;
      }
      return {
        id: fallbackData.id,
        note: fallbackData.note,
        created_by: fallbackData.created_by,
        created_at: fallbackData.created_at,
        users: null
      };
    }

    const u = Array.isArray(data.users) ? data.users[0] : data.users;
    return {
      id: data.id,
      note: data.note,
      created_by: data.created_by,
      created_at: data.created_at,
      users: u ? { name: u.name } : null
    };
  },

  async updateNote(noteId: number, note: string): Promise<boolean> {
    const { error } = await supabase
      .from("quick_notes")
      .update({ note })
      .eq("id", noteId);

    if (error) {
      console.error("Error updating quick note:", error);
      return false;
    }
    return true;
  },

  async deleteNote(noteId: number): Promise<boolean> {
    const { error } = await supabase
      .from("quick_notes")
      .delete()
      .eq("id", noteId);

    if (error) {
      console.error("Error deleting quick note:", error);
      return false;
    }
    return true;
  }
};
