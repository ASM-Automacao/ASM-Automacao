import type { SupabaseClient } from "@supabase/supabase-js";
import { sanitizeMetaErrorMessage } from "@/lib/whatsapp/sanitize-meta-error";

export type RecordOutboundInput = {
  phone: string;
  body: string;
  clientId?: string | null;
  campaignId?: string | null;
  provider: "mock" | "meta";
  providerMessageId?: string | null;
  status: string;
  errorMessage?: string | null;
  rawResponse?: unknown;
};

export async function recordOutboundMessage(supabase: SupabaseClient, input: RecordOutboundInput) {
  const error_message = input.errorMessage
    ? sanitizeMetaErrorMessage(input.errorMessage)
    : null;

  const { error } = await supabase.from("outbound_messages").insert({
    client_id: input.clientId ?? null,
    campaign_id: input.campaignId ?? null,
    phone: input.phone,
    body: input.body,
    provider: input.provider,
    provider_message_id: input.providerMessageId ?? null,
    status: input.status,
    error_message,
    raw_response: input.rawResponse ?? null,
    sent_at: input.status === "failed" ? null : new Date().toISOString(),
  });

  if (error) throw new Error(error.message);
}
