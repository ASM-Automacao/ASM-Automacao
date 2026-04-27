"use client";

import { useEffect, useState } from "react";

type Config = {
  whatsappMode: string;
  apiVersion: string;
  hasAccessToken: boolean;
  hasPhoneNumberId: boolean;
  hasVerifyToken: boolean;
  appUrl: string | null;
  webhookCallbackUrl: string | null;
};

export function MetaWhatsAppPanel() {
  const [cfg, setCfg] = useState<Config | null>(null);
  const [to, setTo] = useState("");
  const [textBody, setTextBody] = useState("Mensagem de teste — Central Comercial ASM");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/whatsapp/config-status")
      .then((r) => r.json())
      .then(setCfg)
      .catch(() => setCfg(null));
  }, []);

  async function sendTemplate() {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/whatsapp/test-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Falha ao enviar template.");
      setResult(`Template enviado. id: ${j.providerMessageId ?? "—"}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  async function sendText() {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/whatsapp/test-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, body: textBody }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Falha ao enviar texto.");
      setResult(`Texto enviado. id: ${j.providerMessageId ?? "—"}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Status da integração</h2>
        {!cfg ? (
          <p className="mt-2 text-sm text-slate-500">Carregando…</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>
              <span className="text-slate-500">WHATSAPP_MODE:</span> {cfg.whatsappMode}
            </li>
            <li>
              <span className="text-slate-500">WHATSAPP_ACCESS_TOKEN:</span> {cfg.hasAccessToken ? "configurado" : "ausente"}
            </li>
            <li>
              <span className="text-slate-500">WHATSAPP_PHONE_NUMBER_ID:</span> {cfg.hasPhoneNumberId ? "configurado" : "ausente"}
            </li>
            <li>
              <span className="text-slate-500">WHATSAPP_VERIFY_TOKEN:</span> {cfg.hasVerifyToken ? "configurado" : "ausente"}
            </li>
            <li>
              <span className="text-slate-500">WHATSAPP_API_VERSION:</span> {cfg.apiVersion}
            </li>
            <li>
              <span className="text-slate-500">Webhook sugerido:</span>{" "}
              <span className="font-mono text-xs break-all">{cfg.webhookCallbackUrl ?? "defina NEXT_PUBLIC_APP_URL"}</span>
            </li>
          </ul>
        )}
      </section>

      <section className="rounded-3xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-950">
        Enquanto estiver usando o número de teste da Meta, o destinatário precisa estar autorizado no painel Meta Developers.
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <h3 className="font-semibold">Teste real (Cloud API)</h3>
        <p className="mt-1 text-sm text-slate-500">O primeiro envio deve ser o template oficial hello_world.</p>

        <label className="mt-4 block text-sm font-medium text-slate-800">
          Telefone destino (apenas números, com DDD)
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
            placeholder="5522999999999"
          />
        </label>

        <button
          type="button"
          disabled={loading || !to.trim()}
          onClick={sendTemplate}
          className="mt-4 w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading ? "Enviando…" : "Enviar hello_world"}
        </button>

        <label className="mt-6 block text-sm font-medium text-slate-800">
          Mensagem livre (pode falhar fora da janela de atendimento)
          <textarea
            value={textBody}
            onChange={(e) => setTextBody(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
          />
        </label>

        <button
          type="button"
          disabled={loading || !to.trim() || !textBody.trim()}
          onClick={sendText}
          className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Enviando…" : "Enviar texto livre"}
        </button>

        {result ? <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{result}</p> : null}
        {error ? <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
      </section>
    </div>
  );
}
