import { useAuthStore } from "@/store/authStore";

export function getCurrentUserId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return useAuthStore.getState().user?.id ?? null;
}

export interface ListParams {
  search?: string;
  page?: number;
  perPage?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
}

export function delay<T>(value: T, ms = 0) {
  if (ms <= 0) {
    return Promise.resolve(value);
  }

  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(value), ms);
  });
}

export function paginate<T>(
  rows: T[],
  params: ListParams = {}
): PaginatedResult<T> {
  const page = params.page ?? 1;
  const perPage = params.perPage ?? 10;
  const start = (page - 1) * perPage;

  return {
    data: rows.slice(start, start + perPage),
    total: rows.length,
    page,
    perPage
  };
}

export function matchSearch<T>(
  rows: T[],
  search: string | undefined,
  keys: Array<keyof T>
) {
  if (!search) {
    return rows;
  }

  const normalizedSearch = search.toLowerCase();

  return rows.filter((row) =>
    keys.some((key) =>
      String(row[key] ?? "")
        .toLowerCase()
        .includes(normalizedSearch)
    )
  );
}
