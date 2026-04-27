import { NextResponse } from "next/server";
import { z } from "zod";

const parseSchema = z.object({
  rawText: z.string().min(1, "Informe o texto bruto da tabela."),
});

function parsePriceLine(line: string) {
  const sanitized = line.trim();
  if (!sanitized) return null;

  const match = sanitized.match(/^(.*?)(?:\s+)(\d+(?:[.,]\d{1,2})?)(?:\s*\/\s*([a-zA-Z]+))?$/);

  if (!match) {
    return {
      productName: sanitized,
      price: null,
      unit: null,
      valid: false,
      notes: "Não foi possível identificar preço automaticamente.",
    };
  }

  const [, productName, rawPrice, detectedUnit] = match;
  const normalized = rawPrice.replace(".", "").replace(",", ".");
  const numeric = Number(normalized);

  if (Number.isNaN(numeric)) {
    return {
      productName: productName.trim(),
      price: null,
      unit: detectedUnit?.toLowerCase() ?? null,
      valid: false,
      notes: "Preço identificado, mas inválido.",
    };
  }

  return {
    productName: productName.trim(),
    price: Number(numeric.toFixed(2)),
    unit: detectedUnit?.toLowerCase() ?? "kg",
    valid: true,
    notes: null,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = parseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Payload inválido.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const items = parsed.data.rawText
      .split(/\r?\n/)
      .map((line) => parsePriceLine(line))
      .filter((line): line is NonNullable<typeof line> => Boolean(line))
      .map((item, index) => ({ id: index + 1, ...item }));

    return NextResponse.json({
      total: items.length,
      validCount: items.filter((item) => item.valid).length,
      invalidCount: items.filter((item) => !item.valid).length,
      items,
    });
  } catch {
    return NextResponse.json({ error: "Não foi possível processar a tabela." }, { status: 500 });
  }
}
