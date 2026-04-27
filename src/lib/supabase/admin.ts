import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env";
import { getSupabaseUrl } from "@/lib/supabase/constants";

/**
 * Cliente service-role (somente servidor). Retorna null se URL/chave não estiverem
 * configuradas (ex.: build CI sem secrets) — rotas devem tratar.
 */
export function createAdminClient(): SupabaseClient | null {
  try {
    const url = getSupabaseUrl();
    const key = serverEnv.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) return null;

    return createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  } catch {
    return null;
  }
}
