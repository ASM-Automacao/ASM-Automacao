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
  clientIds: z.array(z.string().uuid()).min(1),
  title: z.string().trim().min(1),
  product: z.string().trim().min(1),
  oldPrice: z.number().positive(),
  currentPrice: z.number().positive(),
  unit: z.string().trim().min(1).default("kg"),
  validity: z.string().trim().min(1).default("válida enquanto durar o estoque"),
  imageUrl: z.string().url().optional(),
});

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function buildPromotionMessage(input: {
  product: string;
  oldPrice: number;
  currentPrice: number;
  unit: string;
  validity: string;
}) {
  return `🔥 Oferta do dia — ${input.product}\n\n${input.product} baixou hoje!\n\nDe ${formatCurrency(
    input.oldPrice
  )}/${input.unit}\nPor ${formatCurrency(input.currentPrice)}/${input.unit}\n\nOferta ${input.validity}.\nPara consultar, responda esta mensagem.`;
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
    const now = new Date().toISOString();

    const { clientIds, title, imageUrl, ...rest } = parsed.data;
    let message = buildPromotionMessage(rest);
    if (imageUrl) {
      message += `\n\nImagem: ${imageUrl}`;
    }

    const { data: clients, error: clientsError } = await supabase
      .from("clients")
      .select("id, phone, status, receives_promotions")
      .in("id", clientIds);

    if (clientsError || !clients) {
      return NextResponse.json({ error: "Falha ao buscar clientes." }, { status: 500 });
    }

    const eligibleClients = clients.filter((client) => client.status === "active" && client.receives_promotions);
    if (eligibleClients.length === 0) {
      return NextResponse.json(
        { error: "Nenhum cliente elegível. Regra: cliente ativo e receives_promotions=true." },
        { status: 400 }
      );
    }

    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .insert({
        type: "promotion",
        title,
        message_preview: message,
        image_url: imageUrl ?? null,
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
