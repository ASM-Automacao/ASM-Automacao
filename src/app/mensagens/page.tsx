import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Pill } from "@/components/ui/pill";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function MensagensPage() {
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
    .from("outbound_messages")
    .select(
      "id, phone, body, provider, status, provider_message_id, error_message, created_at, sent_at, clients:client_id (contact_name, business_name)"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <DashboardShell>
      <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Mensagens enviadas</h2>
        <p className="text-sm text-slate-500">Histórico registrado no banco (Meta ou mock técnico).</p>
        <p className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-700 leading-relaxed">
          <strong>meta_sent</strong> = a Meta aceitou o envio na API (como no JSON com <code className="rounded bg-white px-1">accepted</code>). Isso{" "}
          <em>não</em> garante que o WhatsApp do celular já mostrou — a bolha aparece na conversa com o <strong>número de teste da empresa</strong> (+1 555… no painel Meta), não em outro chat.
          <br />
          <strong>sent</strong> / <strong>delivered</strong> / <strong>read</strong> / <strong>failed</strong> vêm do <strong>webhook</strong> (URL pública + campo{" "}
          <strong>messages</strong>). Se ficar sempre em <strong>meta_sent</strong>, o webhook não está atualizando (URL/token na Meta) ou a Meta ainda não enviou o evento.
        </p>

        {error ? (
          <p className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-800">{error.message}</p>
        ) : (data ?? []).length === 0 ? (
          <p className="mt-4 rounded-2xl bg-slate-50 p-6 text-sm text-slate-600">Nenhuma mensagem enviada ainda.</p>
        ) : (
          <div className="mt-4 space-y-3 md:hidden">
            {(data ?? []).map((row) => {
              const c = row.clients;
              const one = Array.isArray(c) ? c[0] : c;
              const who = one ? `${one.contact_name} — ${one.business_name}` : "—";
              return (
                <div key={row.id} className="rounded-2xl border border-slate-100 p-4">
                  <p className="text-xs text-slate-500">{new Date(row.created_at).toLocaleString("pt-BR")}</p>
                  <p className="font-medium">{row.phone}</p>
                  <p className="text-xs text-slate-600">{who}</p>
                  <p className="mt-2 text-sm text-slate-800 whitespace-pre-wrap">{row.body}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Pill>{row.provider}</Pill>
                    <Pill tone="blue">{row.status}</Pill>
                  </div>
                  {row.provider_message_id ? (
                    <p className="mt-1 font-mono text-[10px] text-slate-500 break-all">id: {row.provider_message_id}</p>
                  ) : null}
                  {row.error_message ? <p className="mt-2 text-xs text-red-700">{row.error_message}</p> : null}
                </div>
              );
            })}
          </div>
        )}

        {!error && (data ?? []).length > 0 ? (
          <div className="mt-4 hidden overflow-hidden rounded-2xl border border-slate-100 md:block">
            <div className="grid grid-cols-12 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <div className="col-span-2">Data</div>
              <div className="col-span-2">Telefone</div>
              <div className="col-span-2">Cliente</div>
              <div className="col-span-2">Mensagem</div>
              <div className="col-span-1">Prov.</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2">wamid / erro</div>
            </div>
            {(data ?? []).map((row) => {
              const c = row.clients;
              const one = Array.isArray(c) ? c[0] : c;
              const who = one ? `${one.contact_name}` : "—";
              return (
                <div key={row.id} className="grid grid-cols-12 border-t border-slate-100 px-4 py-3 text-sm">
                  <div className="col-span-2 text-xs text-slate-500">{new Date(row.created_at).toLocaleString("pt-BR")}</div>
                  <div className="col-span-2 font-mono text-xs">{row.phone}</div>
                  <div className="col-span-2 text-xs">{who}</div>
                  <div className="col-span-2 line-clamp-3 text-xs text-slate-700">{row.body}</div>
                  <div className="col-span-1 text-xs">{row.provider}</div>
                  <div className="col-span-1 text-xs">
                    <Pill tone="blue">{row.status}</Pill>
                  </div>
                  <div className="col-span-2 text-[10px] text-slate-600 break-all">
                    {row.provider_message_id ? <span className="font-mono">{row.provider_message_id}</span> : "—"}
                    {row.error_message ? <p className="mt-1 text-red-600">{row.error_message}</p> : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </section>
    </DashboardShell>
  );
}
