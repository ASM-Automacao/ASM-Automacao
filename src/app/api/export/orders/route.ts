import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const querySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

function toCsvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function parseDateOrNull(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsedQuery = querySchema.safeParse({
      from: searchParams.get("from"),
      to: searchParams.get("to"),
    });

    if (!parsedQuery.success) {
      return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 });
    }

    const from = parseDateOrNull(parsedQuery.data.from);
    const to = parseDateOrNull(parsedQuery.data.to);
    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase admin não configurado." }, { status: 503 });
    }

    let query = supabase
      .from("orders")
      .select(
        "date, product_name, quantity, unit, unit_price, status, notes, clients:client_id(contact_name, business_name, phone)"
      )
      .order("date", { ascending: false });

    if (from) query = query.gte("date", from);
    if (to) query = query.lte("date", to);
    if (!from && !to) {
      const today = new Date().toISOString().slice(0, 10);
      query = query.eq("date", today);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: "Falha ao exportar pedidos." }, { status: 500 });
    }

    const header = [
      "data",
      "cliente",
      "estabelecimento",
      "telefone",
      "produto",
      "quantidade",
      "unidade",
      "preco_unitario",
      "status",
      "observacoes",
    ];

    const rows = (data ?? []).map((order) => {
      const client = Array.isArray(order.clients) ? order.clients[0] : order.clients;

      return [
      order.date,
      client?.contact_name ?? "",
      client?.business_name ?? "",
      client?.phone ?? "",
      order.product_name,
      order.quantity,
      order.unit,
      order.unit_price,
      order.status,
      order.notes ?? "",
      ];
    });

    const csv = [header, ...rows].map((row) => row.map(toCsvCell).join(";")).join("\n");
    const filename = `orders-export-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
