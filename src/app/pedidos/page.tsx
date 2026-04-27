import { AlertCircle, FileDown } from "lucide-react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Pill } from "@/components/ui/pill";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function PedidosPage() {
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

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      "id, date, product_name, quantity, unit, unit_price, status, notes, clients:client_id (contact_name, business_name, phone)"
    )
    .order("date", { ascending: false })
    .limit(100);

  const rows = orders ?? [];

  return (
    <DashboardShell>
      <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Pedidos</h2>
            <p className="text-sm text-slate-500">Últimos pedidos registrados no Supabase.</p>
          </div>
          <Link
            href="/api/export/orders"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
          >
            <FileDown size={16} />
            Exportar CSV (hoje)
          </Link>
        </div>

        {error ? (
          <p className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-800">{error.message}</p>
        ) : rows.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-slate-50 p-6 text-sm text-slate-600">Nenhum pedido ainda.</p>
        ) : (
          <>
            <div className="mt-4 space-y-3 md:hidden">
              {rows.map((order) => {
                const c = order.clients;
                const one = Array.isArray(c) ? c[0] : c;
                const who = one ? `${one.contact_name} — ${one.business_name}` : "—";
                return (
                  <div key={order.id} className="rounded-2xl border border-slate-100 p-4">
                    <p className="text-xs text-slate-500">{order.date}</p>
                    <p className="font-medium">{who}</p>
                    <p className="text-sm text-slate-600">
                      {order.product_name} • {order.quantity} {order.unit} @ {Number(order.unit_price).toFixed(2)}
                    </p>
                    <div className="mt-2">
                      <Pill tone="amber">{order.status}</Pill>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 hidden overflow-hidden rounded-2xl border border-slate-100 md:block">
              <div className="grid grid-cols-12 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <div className="col-span-2">Data</div>
                <div className="col-span-3">Cliente</div>
                <div className="col-span-2">Produto</div>
                <div className="col-span-2">Qtd</div>
                <div className="col-span-3">Status</div>
              </div>
              {rows.map((order) => {
                const c = order.clients;
                const one = Array.isArray(c) ? c[0] : c;
                const who = one ? `${one.contact_name}` : "—";
                return (
                  <div key={order.id} className="grid grid-cols-12 items-center border-t border-slate-100 px-4 py-3 text-sm">
                    <div className="col-span-2 text-slate-500">{order.date}</div>
                    <div className="col-span-3 font-medium">{who}</div>
                    <div className="col-span-2">{order.product_name}</div>
                    <div className="col-span-2">
                      {order.quantity} {order.unit}
                    </div>
                    <div className="col-span-3">
                      <Pill tone="amber">{order.status}</Pill>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="mt-4 flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-amber-900">
          <AlertCircle className="mt-0.5 shrink-0" size={18} />
          <p className="text-sm">O sistema não confirma estoque automaticamente. Use os status operacionais para acompanhar cada pedido.</p>
        </div>
      </section>
    </DashboardShell>
  );
}
