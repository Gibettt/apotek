import { describe, expect, it } from "vitest";
import { matchSearch, paginate } from "./serviceUtils";

describe("service utils", () => {
  const rows = [
    { id: 1, name: "Paracetamol", category: "Analgesik" },
    { id: 2, name: "Amoxicillin", category: "Antibiotik" }
  ];

  it("filters rows by configured keys", () => {
    expect(matchSearch(rows, "anti", ["category"])).toEqual([rows[1]]);
  });

  it("paginates rows", () => {
    expect(paginate(rows, { page: 2, perPage: 1 })).toEqual({
      data: [rows[1]],
      total: 2,
      page: 2,
      perPage: 1
    });
  });
});
