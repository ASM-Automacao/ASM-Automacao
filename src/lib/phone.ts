/**
 * Normaliza telefone para envio WhatsApp (E.164 sem +), Brasil padrão 55.
 */
export function normalizeBrazilPhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("55")) return digits;
  return `55${digits}`;
}
