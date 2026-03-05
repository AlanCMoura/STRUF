import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

declare global {
  var _supabaseAdmin: SupabaseClient | undefined;
}

function getEnv(name: string) {
  const value = process.env[name];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

export function getSupabaseAdminClient() {
  const url = getEnv("SUPABASE_URL") ?? getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!url) {
    throw new Error("SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL is required");
  }

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
  }

  if (!globalThis._supabaseAdmin) {
    globalThis._supabaseAdmin = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return globalThis._supabaseAdmin;
}
