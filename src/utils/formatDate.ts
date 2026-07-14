import { format } from "date-fns";
import { id } from "date-fns/locale";

export function formatDate(value: string | Date, pattern = "dd MMM yyyy") {
  return format(new Date(value), pattern, { locale: id });
}

export function formatDateTime(value: string | Date) {
  return formatDate(value, "dd MMM yyyy HH:mm");
}
