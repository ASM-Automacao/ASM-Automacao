/**
 * Evita vazar tokens ou headers em mensagens de erro expostas à UI/logs públicos.
 */
export function sanitizeMetaErrorMessage(message: string): string {
  let out = message;
  const patterns = [/Bearer\s+[\w.-]+/gi, /access_token["']?\s*[:=]\s*["']?[\w.-]+/gi];
  for (const re of patterns) {
    out = out.replace(re, "[redacted]");
  }
  if (out.length > 2000) out = `${out.slice(0, 2000)}…`;
  return out;
}
