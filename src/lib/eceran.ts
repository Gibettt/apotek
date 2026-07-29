import type { Obat } from "@/types";

export function stockQtyForSale(quantity: number, stockQtyPerUnit = 1) {
  return quantity * stockQtyPerUnit;
}

export function formatMixedStock(
  stock: number,
  isiPerSatuan: number | undefined,
  satuanUtama = "item",
  satuanEceran?: string
) {
  if (!isiPerSatuan || isiPerSatuan <= 1 || !satuanEceran) {
    return `${stock} ${satuanUtama}`;
  }

  const whole = Math.floor(stock);
  const loose = Math.round((stock - whole) * isiPerSatuan);
  const adjustedWhole = loose >= isiPerSatuan ? whole + 1 : whole;
  const adjustedLoose = loose >= isiPerSatuan ? 0 : loose;

  return adjustedLoose
    ? `${adjustedWhole} ${satuanUtama} ${adjustedLoose} ${satuanEceran}`
    : `${adjustedWhole} ${satuanUtama}`;
}

export function stockLabel(item: Obat) {
  return formatMixedStock(
    item.stokTersedia,
    item.eceran?.isiPerSatuan,
    item.satuanNama || "item",
    item.eceran?.satuanNama
  );
}
