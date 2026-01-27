import { StockItem, CreateStockItemPayload, UpdateStockItemPayload, StockStatus, getStockStatus } from '@/types/stock';
import { stockRepository, IStockRepository } from './stockRepository';

export interface IStockService {
  getAllItems(): Promise<StockItem[]>;
  getItemById(id: string): Promise<StockItem | null>;
  createItem(payload: CreateStockItemPayload): Promise<StockItem>;
  updateItem(payload: UpdateStockItemPayload): Promise<StockItem>;
  incrementQuantity(id: string, amount?: number): Promise<StockItem>;
  decrementQuantity(id: string, amount?: number): Promise<StockItem>;
  deleteItem(id: string): Promise<void>;
  filterByStatus(items: StockItem[], status: StockStatus | null): StockItem[];
  searchItems(items: StockItem[], query: string): StockItem[];
}

class StockService implements IStockService {
  private repository: IStockRepository;

  constructor(repository: IStockRepository) {
    this.repository = repository;
  }

  async getAllItems(): Promise<StockItem[]> {
    console.log('[StockService] Getting all stock items');
    return this.repository.getAll();
  }

  async getItemById(id: string): Promise<StockItem | null> {
    console.log('[StockService] Getting stock item by id:', id);
    return this.repository.getById(id);
  }

  async createItem(payload: CreateStockItemPayload): Promise<StockItem> {
    console.log('[StockService] Creating stock item:', payload.name);
    return this.repository.create(payload);
  }

  async updateItem(payload: UpdateStockItemPayload): Promise<StockItem> {
    console.log('[StockService] Updating stock item:', payload.id);
    return this.repository.update(payload);
  }

  async incrementQuantity(id: string, amount: number = 1): Promise<StockItem> {
    console.log('[StockService] Incrementing stock quantity:', id, 'by', amount);
    const item = await this.repository.getById(id);
    if (!item) {
      throw new Error(`Stock item with id ${id} not found`);
    }
    return this.repository.updateQuantity(id, item.quantity + amount);
  }

  async decrementQuantity(id: string, amount: number = 1): Promise<StockItem> {
    console.log('[StockService] Decrementing stock quantity:', id, 'by', amount);
    const item = await this.repository.getById(id);
    if (!item) {
      throw new Error(`Stock item with id ${id} not found`);
    }
    return this.repository.updateQuantity(id, Math.max(0, item.quantity - amount));
  }

  async deleteItem(id: string): Promise<void> {
    console.log('[StockService] Deleting stock item:', id);
    return this.repository.delete(id);
  }

  filterByStatus(items: StockItem[], status: StockStatus | null): StockItem[] {
    console.log('[StockService] Filtering items by status:', status);
    if (!status) return items;
    return items.filter(item => getStockStatus(item) === status);
  }

  searchItems(items: StockItem[], query: string): StockItem[] {
    console.log('[StockService] Searching items:', query);
    if (!query.trim()) return items;
    const lowerQuery = query.toLowerCase();
    return items.filter(item => 
      item.name.toLowerCase().includes(lowerQuery) ||
      item.category?.toLowerCase().includes(lowerQuery)
    );
  }
}

export const stockService = new StockService(stockRepository);
