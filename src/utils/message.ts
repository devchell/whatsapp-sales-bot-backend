export function normalizeMessage(content: string): string {
  return content.trim().replace(/\s+/g, " ");
}

export function sanitizeText(content: string): string {
  return normalizeMessage(content).slice(0, 1000);
}
