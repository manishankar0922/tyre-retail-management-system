import { supabase } from "@/lib/supabase";

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  name: string;
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ success: boolean; user?: AuthUser; accessToken?: string; message?: string }> {
  try {
    // 1. Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return {
        success: false,
        message: authError?.message || "Invalid email or password",
      };
    }

    // 2. Query user_profiles table using the UUID
    console.log("[AUTH DEBUG] Authenticated session.user.id:", authData.user.id);
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("id, full_name, role")
      .eq("id", authData.user.id)
      .single();

    console.log("[AUTH DEBUG] Fetched profile response:", profile);
    console.log("[AUTH DEBUG] Supabase query error:", profileError);

    if (profileError || !profile) {
      return {
        success: false,
        message: `Your account credentials are valid, but no matching ERP profile was found. Details: ${profileError?.message || "No profile returned"}`,
      };
    }

    // Validate role
    const role = profile.role?.toLowerCase();
    if (role !== "owner" && role !== "accountant") {
      return {
        success: false,
        message: "Unauthorized role profile assigned. Please contact the administrator.",
      };
    }

      return {
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email || email,
        role: role,
        name: profile.full_name || "ERP User",
      },
      accessToken: authData.session?.access_token,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "An unexpected database authentication error occurred.",
    };
  }
}