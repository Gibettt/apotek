"use client";

import { SettingsPage } from "@/components/pages/SettingsPage";
import { getSettingsByGroup } from "@/constants/modules";
import type { PengaturanGroup } from "@/types";

export function PengaturanForm({ group }: { group: PengaturanGroup }) {
  return <SettingsPage group={group} settings={getSettingsByGroup(group)} />;
}
