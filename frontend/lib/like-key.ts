/** Keep existing title-derived keys so historical project likes are preserved. */
export function likeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120);
}
