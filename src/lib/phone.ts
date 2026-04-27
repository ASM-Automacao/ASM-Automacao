/**
 * Normaliza telefone para envio WhatsApp (E.164 sem +), Brasil padrão 55.
 * Remove prefixo internacional 00, corrige números nacionais com zero à esquerda (ex.: 022…).
 */
export function normalizeBrazilPhone(input: string): string {
  let digits = input.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("55")) return digits;
  while (digits.startsWith("0") && digits.length > 1) digits = digits.slice(1);
  return `55${digits}`;
}
