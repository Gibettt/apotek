import { format } from "date-fns";
import { id } from "date-fns/locale";

export function formatDate(value: string | Date, pattern = "dd MMM yyyy") {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return format(date, pattern, { locale: id });
}

export function formatDateTime(value: string | Date) {
  return formatDate(value, "dd MMM yyyy HH:mm");
}

export function localDateKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return format(date, "yyyy-MM-dd");
}
