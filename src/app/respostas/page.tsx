import { DashboardShell } from "@/components/layout/dashboard-shell";
import { createAdminClient } from "@/lib/supabase/admin";
import { InboundList, type InboundRow } from "./inbound-list";

export const dynamic = "force-dynamic";

export default async function RespostasPage() {
  const supabase = createAdminClient();
  if (!supabase) {
    return (
      <DashboardShell>
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Supabase admin não configurado. Defina as variáveis de ambiente no servidor.
        </p>
      </DashboardShell>
    );
  }

  const { data, error } = await supabase
    .from("inbound_messages")
    .select(
      "id, phone, body, status, created_at, campaign_id, clients:client_id (contact_name, business_name)"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <DashboardShell>
      <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Respostas recebidas</h2>
        <p className="text-sm text-slate-500">Mensagens reais vindas do webhook da Meta (quando configurado).</p>
        <div className="mt-4">
          <InboundList items={(data ?? []) as InboundRow[]} error={error?.message} />
        </div>
      </section>
    </DashboardShell>
  );
}
