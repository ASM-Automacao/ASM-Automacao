import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function TabelaDiaPage() {
  return (
    <DashboardShell>
      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Tabela do dia</h2>
        <p className="mt-2 text-sm text-slate-600">
          O fluxo completo de colar tabela, parsear e disparar campanha será ligado à UI no próximo bloco. Já existe o endpoint{" "}
          <code className="rounded bg-slate-100 px-1 text-xs">POST /api/price-tables/parse</code> e{" "}
          <code className="rounded bg-slate-100 px-1 text-xs">POST /api/campaigns/send-table</code>.
        </p>
        <p className="mt-4 text-sm">
          <Link href="/clientes" className="font-medium text-emerald-700 underline">
            Ver clientes
          </Link>{" "}
          ·{" "}
          <Link href="/configuracoes/whatsapp" className="font-medium text-emerald-700 underline">
            WhatsApp Meta
          </Link>
        </p>
      </section>
    </DashboardShell>
  );
}
