import { NextResponse } from "next/server";
import { z } from "zod";
import { serverEnv } from "@/lib/env";
import { normalizeBrazilPhone } from "@/lib/phone";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractMetaErrorMessage } from "@/lib/whatsapp/meta-error";
import { createWhatsAppProvider } from "@/lib/whatsapp/provider";
import { recordOutboundMessage } from "@/lib/whatsapp/record-outbound";
import { isOutboundSendSuccess } from "@/lib/whatsapp/send-success";

const requestSchema = z.object({
  tableId: z.string().uuid(),
  clientIds: z.array(z.string().uuid()).min(1),
  title: z.string().trim().min(1).default("Bom dia + tabela do dia"),
});

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function buildTableMessage(items: Array<{ product_name: string; price: number; unit: string | null }>) {
  const lines = items.map((item) => `- ${item.product_name}: ${formatCurrency(item.price)}/${item.unit ?? "kg"}`);
  return `Bom dia! Segue a tabela de hoje da Cruzeiro do Sul:\n\n${lines.join(
    "\n"
  )}\n\nValores e disponibilidade sujeitos à confirmação.\nPara consultar ou reservar, responda esta mensagem.`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Payload inválido.", details: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase admin não configurado." }, { status: 503 });
    }

    const provider = createWhatsAppProvider();
    const { tableId, clientIds, title } = parsed.data;

    const { data: tableItems, error: tableError } = await supabase
      .from("daily_price_table_items")
      .select("product_name, price, unit")
      .eq("table_id", tableId);

    if (tableError || !tableItems || tableItems.length === 0) {
      return NextResponse.json({ error: "Tabela não encontrada ou sem itens." }, { status: 404 });
    }

    const { data: clients, error: clientsError } = await supabase
      .from("clients")
      .select("id, phone, status, receives_price_table")
      .in("id", clientIds);

    if (clientsError || !clients) {
      return NextResponse.json({ error: "Falha ao buscar clientes." }, { status: 500 });
    }

    const eligibleClients = clients.filter((client) => client.status === "active" && client.receives_price_table);

    if (eligibleClients.length === 0) {
      return NextResponse.json(
        { error: "Nenhum cliente elegível. Regra: cliente ativo e receives_price_table=true." },
        { status: 400 }
      );
    }

    const message = buildTableMessage(tableItems);
    const now = new Date().toISOString();

    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .insert({
        type: "table",
        title,
        message_preview: message,
        status: "sending",
        audience_type: "manual",
      })
      .select("id")
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: "Falha ao criar campanha." }, { status: 500 });
    }

    await supabase.from("campaign_recipients").insert(
      eligibleClients.map((client) => ({
        campaign_id: campaign.id,
        client_id: client.id,
        status: "queued",
      }))
    );

    let sentCount = 0;
    let failedCount = 0;
    const providerTag = serverEnv.WHATSAPP_MODE === "meta" ? "meta" : "mock";

    for (const client of eligibleClients) {
      const to = normalizeBrazilPhone(client.phone);
      const result = await provider.sendTextMessage({
        to,
        body: message,
        campaignId: campaign.id,
        clientId: client.id,
      });

      const ok = isOutboundSendSuccess(result.status);
      const outboundStatus = ok ? (serverEnv.WHATSAPP_MODE === "meta" ? "meta_sent" : "simulated_sent") : "failed";

      try {
        await recordOutboundMessage(supabase, {
          phone: to,
          body: message,
          clientId: client.id,
          campaignId: campaign.id,
          provider: providerTag,
          providerMessageId: result.providerMessageId ?? null,
          status: outboundStatus,
          errorMessage: ok ? null : extractMetaErrorMessage(result.raw) ?? result.status,
          rawResponse: result.raw ?? null,
        });
      } catch {
        failedCount += 1;
        await supabase
          .from("campaign_recipients")
          .update({ status: "failed", sent_at: null })
          .eq("campaign_id", campaign.id)
          .eq("client_id", client.id);
        continue;
      }

      const recipientStatus = ok ? "sent" : "failed";
      if (recipientStatus === "sent") sentCount += 1;
      if (recipientStatus === "failed") failedCount += 1;

      await supabase
        .from("campaign_recipients")
        .update({
          status: recipientStatus,
          sent_at: recipientStatus === "sent" ? now : null,
        })
        .eq("campaign_id", campaign.id)
        .eq("client_id", client.id);
    }

    await supabase
      .from("campaigns")
      .update({
        status: failedCount > 0 ? "failed" : "sent",
        sent_at: now,
      })
      .eq("id", campaign.id);

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      sentCount,
      failedCount,
      totalRecipients: eligibleClients.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
