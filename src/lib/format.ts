export function formatCurrency(value: string) {
  if (!value) return "R$ --";
  const number = Number(String(value).replace("R$", "").replace(".", "").replace(",", "."));
  if (Number.isNaN(number)) return `R$ ${value}`;
  return number.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
