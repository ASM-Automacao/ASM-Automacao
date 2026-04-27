"use client";

import { useState } from "react";
import { Pill } from "@/components/ui/pill";

export type InboundRow = {
  id: string;
  phone: string;
  body: string;
  status: string;
  created_at: string;
  campaign_id: string | null;
  clients: { contact_name: string; business_name: string } | { contact_name: string; business_name: string }[] | null;
};

function clientLabel(row: InboundRow): string {
  const c = row.clients;
  if (!c) return "Contato não cadastrado";
  const one = Array.isArray(c) ? c[0] : c;
  if (!one) return "Contato não cadastrado";
  return `${one.contact_name} — ${one.business_name}`;
}

export function InboundList({ items, error }: { items: InboundRow[]; error?: string }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function patchStatus(id: string, status: "replied" | "archived") {
    setBusy(id);
    setMsg(null);
    const res = await fetch(`/api/inbound-messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(null);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setMsg(j.error ?? "Falha ao atualizar.");
      return;
    }
    window.location.reload();
  }

  async function convertOrder(id: string) {
    const product_name = window.prompt("Nome do produto", "Picanha");
    if (!product_name) return;
    const qtyStr = window.prompt("Quantidade", "1");
    const quantity = qtyStr ? Number(qtyStr.replace(",", ".")) : NaN;
    if (!quantity || Number.isNaN(quantity)) {
      setMsg("Quantidade inválida.");
      return;
    }
    const unit = window.prompt("Unidade", "kg") ?? "kg";
    const priceStr = window.prompt("Preço unitário", "0");
    const unit_price = priceStr ? Number(priceStr.replace(",", ".")) : 0;
    if (Number.isNaN(unit_price)) {
      setMsg("Preço inválido.");
      return;
    }

    setBusy(id);
    setMsg(null);
    const res = await fetch(`/api/inbound-messages/${id}/convert-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_name, quantity, unit, unit_price }),
    });
    setBusy(null);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setMsg(j.error ?? "Falha ao gerar pedido.");
      return;
    }
    window.location.reload();
  }

  if (error) {
    return <p className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-800">{error}</p>;
  }

  return (
    <div className="space-y-3">
      {msg ? <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{msg}</p> : null}
      {items.length === 0 ? (
        <p className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-600">Nenhuma resposta registrada ainda.</p>
      ) : (
        items.map((row) => (
          <div key={row.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-medium">{clientLabel(row)}</p>
                <p className="text-xs text-slate-500">{row.phone}</p>
                <p className="mt-2 text-sm text-slate-800">{row.body}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Pill>{new Date(row.created_at).toLocaleString("pt-BR")}</Pill>
                  <Pill tone="blue">{row.status}</Pill>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy === row.id}
                  onClick={() => patchStatus(row.id, "replied")}
                  className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
                >
                  Marcar respondida
                </button>
                <button
                  type="button"
                  disabled={busy === row.id}
                  onClick={() => patchStatus(row.id, "archived")}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 disabled:opacity-50"
                >
                  Arquivar
                </button>
                <button
                  type="button"
                  disabled={busy === row.id || row.status === "converted_to_order"}
                  onClick={() => convertOrder(row.id)}
                  className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
                >
                  Virar pedido
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
