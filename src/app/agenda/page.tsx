import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Pill } from "@/components/ui/pill";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const weekdays = [
  { key: "send_monday", label: "Seg" },
  { key: "send_tuesday", label: "Ter" },
  { key: "send_wednesday", label: "Qua" },
  { key: "send_thursday", label: "Qui" },
  { key: "send_friday", label: "Sex" },
  { key: "send_saturday", label: "Sáb" },
  { key: "send_sunday", label: "Dom" },
] as const;

export default async function AgendaPage() {
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
      "business_name, type, phone, send_monday, send_tuesday, send_wednesday, send_thursday, send_friday, send_saturday, send_sunday"
    )
    .eq("status", "active")
    .order("business_name");

  const rows = clients ?? [];

  return (
    <DashboardShell>
      <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Agenda de envio</h2>
        <p className="text-sm text-slate-500">
          Dias configurados por cliente (campos <span className="font-mono text-xs">send_*</span> no Supabase). Edição guiada em breve.
        </p>

        {error ? (
          <p className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-800">{error.message}</p>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {rows.map((client) => (
              <div key={client.phone} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{client.business_name}</p>
                    <p className="text-xs text-slate-500">
                      {client.type} • {client.phone}
                    </p>
                  </div>
                  <Pill tone="green">Ativo</Pill>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {weekdays.map((d) => (
                    <span
                      key={d.key}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        client[d.key] ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {d.label}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </DashboardShell>
  );
}
