import { obat, stokBatches, stokMutasi } from "@/lib/mock-data";
import { delay, matchSearch, paginate, type ListParams } from "./serviceUtils";

export const stokService = {
  async list(params: ListParams = {}) {
    return delay(
      paginate(
        matchSearch(stokBatches, params.search, [
          "namaObat",
          "batchNumber",
          "lokasi"
        ]),
        params
      )
    );
  },

  async lowStock() {
    return delay(obat.filter((item) => item.stokTersedia < item.stokMinimum));
  },

  async expiredSoon(days = 60) {
    const limit = new Date("2026-07-07T00:00:00+07:00");
    limit.setDate(limit.getDate() + days);

    return delay(
      stokBatches.filter((item) => new Date(item.tanggalExpired) <= limit)
    );
  },

  async mutations(params: ListParams = {}) {
    return delay(
      paginate(
        matchSearch(stokMutasi, params.search, ["namaObat", "keterangan"]),
        params
      )
    );
  }
};
