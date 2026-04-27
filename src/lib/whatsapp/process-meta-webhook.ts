import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeBrazilPhone } from "@/lib/phone";

type MetaValue = {
  messages?: Array<Record<string, unknown>>;
  statuses?: Array<Record<string, unknown>>;
};

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
  return null;
}

export type WebhookStatusEvent = {
  providerMessageId: string;
  status: string;
  error: string | null;
  /** true quando o status não é um dos conhecidos (sent/delivered/read/failed) e não atualizamos a linha */
  skipped: boolean;
};

const META_OUTBOUND_STATUSES = new Set(["sent", "delivered", "read", "failed"]);

/**
 * Processa payload do webhook Meta (defensivo).
 * Não loga o payload completo em produção para reduzir risco de dados sensíveis.
 */
export async function processMetaWebhookPayload(
  supabase: SupabaseClient,
  payload: unknown
): Promise<{ inbound: number; statuses: number; statusEvents: WebhookStatusEvent[] }> {
  let inbound = 0;
  let statuses = 0;
  const statusEvents: WebhookStatusEvent[] = [];
  const maxEvents = 25;

  const root = asRecord(payload);
  const entries = Array.isArray(root?.entry) ? (root.entry as unknown[]) : [];

  for (const entry of entries) {
    const ent = asRecord(entry);
    const changes = Array.isArray(ent?.changes) ? (ent.changes as unknown[]) : [];

    for (const change of changes) {
      const ch = asRecord(change);
      const value = asRecord(ch?.value) as MetaValue | null;
      if (!value) continue;

      const messages = Array.isArray(value.messages) ? value.messages : [];
      for (const msg of messages) {
        const m = asRecord(msg);
        if (!m) continue;

        const fromRaw = typeof m.from === "string" ? m.from : "";
        const phone = normalizeBrazilPhone(fromRaw);
        const id = typeof m.id === "string" ? m.id : "";
        const type = typeof m.type === "string" ? m.type : "unknown";

        let body = "";
        if (type === "text") {
          const text = asRecord(m.text);
          body = typeof text?.body === "string" ? text.body : "";
        } else {
          body = `[${type}]`;
        }

        const { data: client } = await supabase.from("clients").select("id").eq("phone", phone).maybeSingle();

        let rawPayload: Record<string, unknown> = {};
        try {
          rawPayload = JSON.parse(JSON.stringify(payload)) as Record<string, unknown>;
        } catch {
          rawPayload = { _note: "payload não serializável" };
        }

        await supabase.from("inbound_messages").insert({
          client_id: client?.id ?? null,
          phone,
          body: body || "(sem texto)",
          provider_message_id: id || null,
          campaign_id: null,
          status: "new",
          raw_payload: rawPayload,
        });
        inbound += 1;
      }

      const sts = Array.isArray(value.statuses) ? value.statuses : [];
      for (const st of sts) {
        const s = asRecord(st);
        if (!s) continue;
        const providerMessageId = typeof s.id === "string" ? s.id : "";
        const status = typeof s.status === "string" ? s.status : "";

        if (!META_OUTBOUND_STATUSES.has(status)) {
          statuses += 1;
          if (statusEvents.length < maxEvents) {
            statusEvents.push({ providerMessageId, status, error: null, skipped: true });
          }
          continue;
        }

        const mapped = status;

        let err: string | null = null;
        if (status === "failed") {
          err = "Envio falhou (Meta).";
          const errs = s.errors;
          if (Array.isArray(errs) && errs.length > 0) {
            const first = asRecord(errs[0]);
            const code = first?.code;
            const title = first?.title;
            const msg = first?.message;
            const parts = [typeof code === "number" || typeof code === "string" ? String(code) : null, typeof title === "string" ? title : null, typeof msg === "string" ? msg : null].filter(
              Boolean
            ) as string[];
            if (parts.length > 0) {
              err = parts.join(" — ").slice(0, 1000);
            } else {
              try {
                err = JSON.stringify(errs).slice(0, 1000);
              } catch {
                err = "Envio falhou (Meta).";
              }
            }
          }
        }

        await supabase
          .from("outbound_messages")
          .update({
            status: mapped,
            error_message: err,
            raw_response: s as unknown as Record<string, unknown>,
          })
          .eq("provider_message_id", providerMessageId);

        statuses += 1;
        if (statusEvents.length < maxEvents) {
          statusEvents.push({ providerMessageId, status, error: err, skipped: false });
        }
      }
    }
  }

  return { inbound, statuses, statusEvents };
}
