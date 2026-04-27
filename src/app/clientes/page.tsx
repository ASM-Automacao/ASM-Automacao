import { Plus, Search } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Pill } from "@/components/ui/pill";
import { createAdminClient } from "@/lib/supabase/admin";
import { typeOptions } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
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

  const { data: clients, error } = await supabase
    .from("clients")
    .select(
      "id, contact_name, business_name, phone, type, neighborhood, status, receives_price_table, receives_promotions, send_monday, send_tuesday, send_wednesday, send_thursday, send_friday, send_saturday, send_sunday"
    )
    .order("created_at", { ascending: false });

  const rows = clients ?? [];

  const dayLabel = (c: (typeof rows)[number]) => {
    const days: string[] = [];
    if (c.send_monday) days.push("Seg");
    if (c.send_tuesday) days.push("Ter");
    if (c.send_wednesday) days.push("Qua");
    if (c.send_thursday) days.push("Qui");
    if (c.send_friday) days.push("Sex");
    if (c.send_saturday) days.push("Sáb");
    if (c.send_sunday) days.push("Dom");
    return days.join(", ") || "—";
  };

  return (
    <DashboardShell>
      <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Clientes</h2>
            <p className="text-sm text-slate-500">Dados do Supabase. CRUD completo pela UI virá no próximo bloco.</p>
          </div>
          <button
            type="button"
            disabled
            title="Em desenvolvimento"
            className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-2xl bg-slate-200 px-4 py-2 text-sm font-medium text-slate-500"
          >
            <Plus size={16} />
            Novo cliente
          </button>
        </div>

        {error ? (
          <p className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-800">{error.message}</p>
        ) : (
          <>
            <div className="mt-4 flex flex-col gap-3 md:flex-row">
              <div className="relative flex-1 opacity-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  disabled
                  className="w-full rounded-2xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none"
                  placeholder="Filtros em breve"
                />
              </div>
              <select disabled className="rounded-2xl border border-slate-200 px-3 py-2.5 text-sm opacity-60">
                {typeOptions.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="mt-4 space-y-3 md:hidden">
              {rows.map((client) => (
                <div key={client.id} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{client.business_name}</p>
                      <p className="text-xs text-slate-500">{client.contact_name}</p>
                    </div>
                    <Pill tone={client.status === "active" ? "green" : "slate"}>{client.status}</Pill>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{client.phone}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Pill>{client.type}</Pill>
                    <Pill>{client.neighborhood ?? "—"}</Pill>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Envio: {dayLabel(client)}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 hidden overflow-hidden rounded-2xl border border-slate-100 md:block">
              <div className="grid grid-cols-12 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <div className="col-span-4">Cliente</div>
                <div className="col-span-2">Tipo</div>
                <div className="col-span-2">Telefone</div>
                <div className="col-span-3">Dias</div>
                <div className="col-span-1 text-right">Status</div>
              </div>
              {rows.map((client) => (
                <div key={client.id} className="grid grid-cols-12 items-center border-t border-slate-100 px-4 py-3 text-sm">
                  <div className="col-span-4">
                    <p className="font-medium text-slate-900">{client.business_name}</p>
                    <p className="text-xs text-slate-500">
                      {client.contact_name} • {client.neighborhood ?? "—"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <Pill>{client.type}</Pill>
                  </div>
                  <div className="col-span-2 font-mono text-xs text-slate-600">{client.phone}</div>
                  <div className="col-span-3 text-xs text-slate-500">{dayLabel(client)}</div>
                  <div className="col-span-1 text-right">
                    <Pill tone={client.status === "active" ? "green" : "slate"}>{client.status}</Pill>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </DashboardShell>
  );
}
