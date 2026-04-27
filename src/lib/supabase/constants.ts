import { publicEnv } from "@/lib/env";

export function getSupabaseUrl() {
  if (!publicEnv.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("Supabase URL não configurada. Defina NEXT_PUBLIC_SUPABASE_URL.");
  }

  return publicEnv.NEXT_PUBLIC_SUPABASE_URL;
}

export function getSupabasePublicKey() {
  const publicKey = publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!publicKey) {
    throw new Error(
      "Supabase chave pública não configurada. Defina NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (ou NEXT_PUBLIC_SUPABASE_ANON_KEY)."
    );
  }

  return publicKey;
}
