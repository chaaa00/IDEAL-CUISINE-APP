import { StockItem, CreateStockItemPayload, UpdateStockItemPayload } from '@/types/stock';

export interface IStockRepository {
  getAll(): Promise<StockItem[]>;
  getById(id: string): Promise<StockItem | null>;
  create(payload: CreateStockItemPayload): Promise<StockItem>;
  update(payload: UpdateStockItemPayload): Promise<StockItem>;
  updateQuantity(id: string, quantity: number): Promise<StockItem>;
  delete(id: string): Promise<void>;
  getByCategory(category: string): Promise<StockItem[]>;
  getLowStockItems(): Promise<StockItem[]>;
  getOutOfStockItems(): Promise<StockItem[]>;
}

export class StockRepository implements IStockRepository {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  async getAll(): Promise<StockItem[]> {
    console.log('[StockRepository] Fetching all stock items');

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/stock`, {
      //   headers: { 'Authorization': `Bearer ${token}` },
      // });
      // return await response.json();

      throw new Error('API not configured. Connect to external database.');
    } catch (error) {
      console.error('[StockRepository] Get all stock items error:', error);
      throw error;
    }
  }

  async getById(id: string): Promise<StockItem | null> {
    console.log('[StockRepository] Fetching stock item by id:', id);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/stock/${id}`, {
      //   headers: { 'Authorization': `Bearer ${token}` },
      // });
      // if (response.status === 404) return null;
      // return await response.json();

      throw new Error('API not configured. Connect to external database.');
    } catch (error) {
      console.error('[StockRepository] Get stock item by id error:', error);
      throw error;
    }
  }

  async create(payload: CreateStockItemPayload): Promise<StockItem> {
    console.log('[StockRepository] Creating stock item:', payload.name);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/stock`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`,
      //   },
      //   body: JSON.stringify(payload),
      // });
      // return await response.json();

      throw new Error('API not configured. Connect to external database.');
    } catch (error) {
      console.error('[StockRepository] Create stock item error:', error);
      throw error;
    }
  }

  async update(payload: UpdateStockItemPayload): Promise<StockItem> {
    console.log('[StockRepository] Updating stock item:', payload.id);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/stock/${payload.id}`, {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`,
      //   },
      //   body: JSON.stringify(payload),
      // });
      // return await response.json();

      throw new Error('API not configured. Connect to external database.');
    } catch (error) {
      console.error('[StockRepository] Update stock item error:', error);
      throw error;
    }
  }

  async updateQuantity(id: string, quantity: number): Promise<StockItem> {
    console.log('[StockRepository] Updating stock quantity:', id, quantity);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/stock/${id}/quantity`, {
      //   method: 'PATCH',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`,
      //   },
      //   body: JSON.stringify({ quantity }),
      // });
      // return await response.json();

      throw new Error('API not configured. Connect to external database.');
    } catch (error) {
      console.error('[StockRepository] Update stock quantity error:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    console.log('[StockRepository] Deleting stock item:', id);

    try {
      // TODO: Replace with actual API call
      // await fetch(`${this.baseUrl}/stock/${id}`, {
      //   method: 'DELETE',
      //   headers: { 'Authorization': `Bearer ${token}` },
      // });

      throw new Error('API not configured. Connect to external database.');
    } catch (error) {
      console.error('[StockRepository] Delete stock item error:', error);
      throw error;
    }
  }

  async getByCategory(category: string): Promise<StockItem[]> {
    console.log('[StockRepository] Fetching stock items by category:', category);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/stock?category=${encodeURIComponent(category)}`, {
      //   headers: { 'Authorization': `Bearer ${token}` },
      // });
      // return await response.json();

      throw new Error('API not configured. Connect to external database.');
    } catch (error) {
      console.error('[StockRepository] Get stock by category error:', error);
      throw error;
    }
  }

  async getLowStockItems(): Promise<StockItem[]> {
    console.log('[StockRepository] Fetching low stock items');

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/stock?status=low_stock`, {
      //   headers: { 'Authorization': `Bearer ${token}` },
      // });
      // return await response.json();

      throw new Error('API not configured. Connect to external database.');
    } catch (error) {
      console.error('[StockRepository] Get low stock items error:', error);
      throw error;
    }
  }

  async getOutOfStockItems(): Promise<StockItem[]> {
    console.log('[StockRepository] Fetching out of stock items');

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${this.baseUrl}/stock?status=out_of_stock`, {
      //   headers: { 'Authorization': `Bearer ${token}` },
      // });
      // return await response.json();

      throw new Error('API not configured. Connect to external database.');
    } catch (error) {
      console.error('[StockRepository] Get out of stock items error:', error);
      throw error;
    }
  }
}

export const stockRepository = new StockRepository();
