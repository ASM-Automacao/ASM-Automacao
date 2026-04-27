export function extractMetaErrorMessage(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  const err = (raw as { error?: { message?: string } }).error?.message;
  return err ?? null;
}
