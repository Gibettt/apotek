export function generateAutoKode(
  nama: string,
  opts?: { prefix?: string; unique?: boolean }
) {
  const trimmed = nama.trim();

  if (!trimmed) {
    return "";
  }

  const prefix =
    opts?.prefix ??
    (trimmed.replace(/[^a-zA-Z0-9]/g, "").slice(0, 3).toUpperCase() || "BRG");

  if (opts?.unique) {
    const suffix = `${Date.now().toString(36)}${Math.floor(
      Math.random() * 1000
    )}`.toUpperCase();
    return `${prefix}-${suffix}`;
  }

  const normalized = trimmed
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24);

  return normalized ? `${prefix}_${normalized}` : "";
}
