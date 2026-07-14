"use client";

import { useMemo, useState } from "react";

export function usePagination(total: number, perPage = 10) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return useMemo(
    () => ({
      page,
      perPage,
      totalPages,
      setPage: (nextPage: number) =>
        setPage(Math.max(1, Math.min(nextPage, totalPages)))
    }),
    [page, perPage, totalPages]
  );
}
