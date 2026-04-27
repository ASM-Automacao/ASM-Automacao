import { NextResponse } from "next/server";
import { z } from "zod";
import { serverEnv } from "@/lib/env";
import { normalizeBrazilPhone } from "@/lib/phone";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractMetaErrorMessage } from "@/lib/whatsapp/meta-error";
import { createWhatsAppProvider } from "@/lib/whatsapp/provider";
import { recordOutboundMessage } from "@/lib/whatsapp/record-outbound";
import { isOutboundSendSuccess } from "@/lib/whatsapp/send-success";

const bodySchema = z.object({
  to: z.string().min(8).max(32),
  body: z.string().trim().min(1).max(4096),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload inválido.", details: parsed.error.flatten() }, { status: 400 });
    }

    const to = normalizeBrazilPhone(parsed.data.to);
    const provider = createWhatsAppProvider();
    const result = await provider.sendTextMessage({
      to,
      body: parsed.data.body,
    });

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Supabase admin não configurado." }, { status: 503 });
    }

    const ok = isOutboundSendSuccess(result.status);
    const providerTag = serverEnv.WHATSAPP_MODE === "meta" ? "meta" : "mock";
    const outboundStatus = ok ? (serverEnv.WHATSAPP_MODE === "meta" ? "meta_sent" : "simulated_sent") : "failed";

    await recordOutboundMessage(supabase, {
      phone: to,
      body: parsed.data.body,
      clientId: null,
      campaignId: null,
      provider: providerTag,
      providerMessageId: result.providerMessageId ?? null,
      status: outboundStatus,
      errorMessage: ok ? null : extractMetaErrorMessage(result.raw) ?? result.status,
      rawResponse: result.raw ?? null,
    });

    if (!ok) {
      return NextResponse.json(
        {
          success: false,
          error: extractMetaErrorMessage(result.raw) ?? "Falha ao enviar texto.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      providerMessageId: result.providerMessageId,
      status: outboundStatus,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
