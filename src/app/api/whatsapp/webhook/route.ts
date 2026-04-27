import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/env";
import { processMetaWebhookPayload } from "@/lib/whatsapp/process-meta-webhook";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  const expected = serverEnv.WHATSAPP_VERIFY_TOKEN;

  if (!expected) {
    return NextResponse.json({ error: "WHATSAPP_VERIFY_TOKEN não configurado no servidor." }, { status: 503 });
  }

  if (mode === "subscribe" && token && token === expected) {
    return new NextResponse(challenge ?? "ok", { status: 200 });
  }

  return NextResponse.json({ error: "Webhook verify token inválido." }, { status: 403 });
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase admin não configurado." }, { status: 503 });
    }

    const summary = await processMetaWebhookPayload(supabase, body);

    if (summary.deliveryStatusNoDbRow > 0) {
      console.warn(
        "[whatsapp webhook] status recebido(s) sem linha em outbound_messages (wamid não bateu). Verifique se o envio foi gravado com o mesmo provider_message_id.",
        { count: summary.deliveryStatusNoDbRow }
      );
    }

    if (process.env.NODE_ENV === "development") {
      const { statusEvents, ...rest } = summary;
      console.info("[whatsapp webhook]", rest, statusEvents.length ? { statusEvents } : {});
    }

    const payload =
      process.env.NODE_ENV === "development"
        ? { received: true, ...summary }
        : {
            received: true,
            inbound: summary.inbound,
            statuses: summary.statuses,
            deliveryStatusNoDbRow: summary.deliveryStatusNoDbRow,
          };

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ error: "Payload inválido no webhook." }, { status: 400 });
  }
}
