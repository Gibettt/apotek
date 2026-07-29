export const LOW_STOCK_THRESHOLD = 30;

export function isLowStock(stock: number) {
  return stock <= LOW_STOCK_THRESHOLD;
}
