import { settings as localSettings } from "@/lib/mock-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Pengaturan, PengaturanGroup } from "@/types";
import { delay } from "./serviceUtils";

interface PengaturanRow {
  id: string;
  cabang_id: string | null;
  key: string;
  value: string | null;
  group: PengaturanGroup;
  label: string | null;
}

function toPengaturan(row: PengaturanRow): Pengaturan {
  return {
    id: row.id,
    cabangId: row.cabang_id ?? undefined,
    key: row.key,
    value: row.value ?? "",
    group: row.group,
    label: row.label ?? row.key
  };
}

export const pengaturanService = {
  async all() {
    if (!isSupabaseConfigured || !supabase) {
      return delay(localSettings);
    }

    const { data, error } = await supabase
      .from("pengaturan")
      .select("id,cabang_id,key,value,group,label")
      .order("group", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map(toPengaturan);
  },

  async byGroup(group: PengaturanGroup) {
    if (!isSupabaseConfigured || !supabase) {
      return delay(localSettings.filter((item) => item.group === group));
    }

    const { data, error } = await supabase
      .from("pengaturan")
      .select("id,cabang_id,key,value,group,label")
      .eq("group", group);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map(toPengaturan);
  },

  async update(key: string, value: string): Promise<Pengaturan | null> {
    if (!isSupabaseConfigured || !supabase) {
      const index = localSettings.findIndex((item) => item.key === key);
      if (index >= 0) {
        localSettings[index] = { ...localSettings[index], value };
      }

      return delay(localSettings.find((item) => item.key === key) ?? null);
    }

    const { data, error } = await supabase
      .from("pengaturan")
      .update({ value, updated_at: new Date().toISOString() })
      .eq("key", key)
      .select("id,cabang_id,key,value,group,label")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data ? toPengaturan(data) : null;
  }
};
