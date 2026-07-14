import { notifikasi } from "@/lib/mock-data";
import { delay, matchSearch, paginate, type ListParams } from "./serviceUtils";

export const notifikasiService = {
  async list(params: ListParams = {}) {
    return delay(
      paginate(
        matchSearch(notifikasi, params.search, ["judul", "pesan", "tipe"]),
        params
      )
    );
  },

  async unreadCount() {
    return delay(notifikasi.filter((item) => !item.isRead).length);
  }
};
