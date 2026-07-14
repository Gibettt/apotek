import { users } from "@/lib/mock-data";
import { delay, matchSearch, paginate, type ListParams } from "./serviceUtils";

export const userService = {
  async list(params: ListParams = {}) {
    return delay(
      paginate(matchSearch(users, params.search, ["name", "email", "role"]), params)
    );
  },

  async getById(id: string) {
    return delay(users.find((item) => item.id === id) ?? null);
  }
};
