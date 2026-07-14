"use client";

import { SettingsPage } from "@/components/pages/SettingsPage";
import { getSettingsByGroup } from "@/constants/modules";
import type { SettingGroup } from "@/types";

export function PengaturanForm({ group }: { group: SettingGroup }) {
  return <SettingsPage group={group} settings={getSettingsByGroup(group)} />;
}
