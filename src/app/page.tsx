import { ClipboardList, MessageCircle, Send, Users } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Pill } from "@/components/ui/pill";
import { StatCard } from "@/components/ui/stat-card";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const steps = [
  ["1", "Cadastrar clientes"],
  ["2", "Configurar agenda"],
  ["3", "Ler tabela"],
  ["4", "Disparar campanha"],
  ["5", "Conferir respostas e pedidos"],
];

export default async function HomePage() {
  const supabase = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  if (!supabase) {
    return (
      <DashboardShell>
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Configure <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
          <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> no servidor para carregar métricas.
        </p>
      </DashboardShell>
    );
  }

  const [clientsActive, campaignsToday, outboundToday, inboundToday, ordersToday, ordersPending] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("campaigns").select("id", { count: "exact", head: true }).gte("created_at", `${today}T00:00:00`),
    supabase.from("outbound_messages").select("id", { count: "exact", head: true }).gte("created_at", `${today}T00:00:00`),
    supabase.from("inbound_messages").select("id", { count: "exact", head: true }).gte("created_at", `${today}T00:00:00`),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("date", today),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "verificar_estoque"),
  ]);

  return (
    <DashboardShell>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={Users} label="Clientes ativos" value={clientsActive.count ?? 0} hint="Cadastro no Supabase" />
        <StatCard icon={Send} label="Campanhas hoje" value={campaignsToday.count ?? 0} hint="Criadas hoje" />
        <StatCard icon={Send} label="Mensagens enviadas hoje" value={outboundToday.count ?? 0} hint="outbound_messages" />
        <StatCard icon={MessageCircle} label="Respostas hoje" value={inboundToday.count ?? 0} hint="Webhook Meta" />
        <StatCard icon={ClipboardList} label="Pedidos hoje" value={ordersToday.count ?? 0} hint="Data = hoje" />
        <StatCard icon={ClipboardList} label="Pedidos p/ estoque" value={ordersPending.count ?? 0} hint="Status verificar estoque" />
      </div>

      <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Fluxo operacional</h2>
            <p className="mt-1 text-sm text-slate-500">
              Configure o WhatsApp Meta em <span className="font-medium text-slate-700">WhatsApp Meta</span>, envie o template de teste e acompanhe respostas e pedidos.
            </p>
          </div>
          <Pill tone="green">Produção-ready (Meta)</Pill>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-5">
          {steps.map(([number, text]) => (
            <div key={number} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white">{number}</div>
              <p className="mt-3 text-sm font-medium text-slate-800">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Próximo passo</h2>
        <p className="mt-2 text-sm text-slate-600">
          Abra <strong>WhatsApp Meta</strong> no menu, confirme variáveis de ambiente e envie o template <code className="rounded bg-slate-100 px-1">hello_world</code> para um número autorizado no painel da Meta.
        </p>
      </section>
    </DashboardShell>
  );
}
