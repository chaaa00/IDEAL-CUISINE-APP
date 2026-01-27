export type StockStatus = 'available' | 'low_stock' | 'out_of_stock';

export interface StockItem {
  id: string;
  name: string;
  quantity: number;
  minQuantity: number;
  unit: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStockItemPayload {
  name: string;
  quantity: number;
  minQuantity: number;
  unit: string;
  category?: string;
}

export interface UpdateStockItemPayload {
  id: string;
  name?: string;
  quantity?: number;
  minQuantity?: number;
  unit?: string;
  category?: string;
}

export const getStockStatus = (item: StockItem): StockStatus => {
  if (item.quantity === 0) return 'out_of_stock';
  if (item.quantity <= item.minQuantity) return 'low_stock';
  return 'available';
};

export const STOCK_STATUS_COLORS: Record<StockStatus, string> = {
  available: '#22C55E',
  low_stock: '#EAB308',
  out_of_stock: '#EF4444',
};

export const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  available: 'Available',
  low_stock: 'Low Stock',
  out_of_stock: 'Out of Stock',
};
