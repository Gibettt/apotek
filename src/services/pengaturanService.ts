import { settings } from "@/lib/mock-data";
import type { SettingGroup } from "@/types";
import { delay } from "./serviceUtils";

export const pengaturanService = {
  async all() {
    return delay(settings);
  },

  async byGroup(group: SettingGroup) {
    return delay(settings.filter((item) => item.group === group));
  }
};
