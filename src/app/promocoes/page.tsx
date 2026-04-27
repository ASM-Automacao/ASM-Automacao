import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function PromocoesPage() {
  return (
    <DashboardShell>
      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Promoções</h2>
        <p className="mt-2 text-sm text-slate-600">
          A criação guiada de promoções com envio pela Meta será conectada aqui em seguida. O endpoint{" "}
          <code className="rounded bg-slate-100 px-1 text-xs">POST /api/campaigns/send-promotion</code> já envia texto (imagem via URL é anexada ao corpo até termos envio de mídia dedicado).
        </p>
        <p className="mt-4 text-sm">
          <Link href="/configuracoes/whatsapp" className="font-medium text-emerald-700 underline">
            Testar WhatsApp Meta
          </Link>
        </p>
      </section>
    </DashboardShell>
  );
}
