import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({
  product_name: z.string().trim().min(1),
  quantity: z.number().positive(),
  unit: z.string().trim().min(1),
  unit_price: z.number().nonnegative(),
  notes: z.string().max(2000).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id: inboundId } = await context.params;
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload inválido.", details: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase admin não configurado." }, { status: 503 });
    }

    const { data: inbound, error: inboundError } = await supabase
      .from("inbound_messages")
      .select("id, client_id, campaign_id, body, phone")
      .eq("id", inboundId)
      .single();

    if (inboundError || !inbound) {
      return NextResponse.json({ error: "Mensagem não encontrada." }, { status: 404 });
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        client_id: inbound.client_id,
        product_id: null,
        product_name: parsed.data.product_name,
        quantity: parsed.data.quantity,
        unit: parsed.data.unit,
        unit_price: parsed.data.unit_price,
        status: "verificar_estoque",
        notes: parsed.data.notes ?? inbound.body,
        campaign_id: inbound.campaign_id,
        inbound_message_id: inbound.id,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Não foi possível criar o pedido." }, { status: 500 });
    }

    await supabase.from("inbound_messages").update({ status: "converted_to_order" }).eq("id", inboundId);

    return NextResponse.json({ success: true, orderId: order.id });
  } catch {
    return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
  }
}
