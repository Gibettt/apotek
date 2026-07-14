export function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.startsWith("62")) {
    return `+${digits}`;
  }

  if (digits.startsWith("0")) {
    return `+62${digits.slice(1)}`;
  }

  return digits ? `+62${digits}` : "";
}
