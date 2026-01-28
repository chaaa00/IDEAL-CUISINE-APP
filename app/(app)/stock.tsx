import { useState, useCallback, useMemo, useRef, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Minus, Package, X } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { stockService } from '@/services/stockService';
import { StockItem, StockStatus, getStockStatus, STOCK_STATUS_COLORS, CreateStockItemPayload } from '@/types/stock';
import { debounce, throttle } from '@/utils/performance';
import { getOptimizedFlatListProps, LARGE_LIST_CONFIG } from '@/utils/optimizedList';

type FilterType = StockStatus | null;

export default function StockScreen() {
  const { hasPermission } = useAuth();
  const { t, isRTL } = useLanguage();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>(null);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newItem, setNewItem] = useState<CreateStockItemPayload>({
    name: '',
    quantity: 0,
    minQuantity: 10,
    unit: 'pieces',
    category: '',
  });
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const mutationLockRef = useRef<Set<string>>(new Set());

  const canAddStock = hasPermission('add_stock');
  const canAdjustQuantity = hasPermission('adjust_stock_quantity');
  const canDeleteStock = hasPermission('delete_stock');

  const { data: stockItems = [], isLoading, refetch } = useQuery({
    queryKey: ['stock'],
    queryFn: () => stockService.getAllItems(),
  });

  const incrementMutation = useMutation({
    mutationFn: (id: string) => stockService.incrementQuantity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
    },
  });

  const decrementMutation = useMutation({
    mutationFn: (id: string) => stockService.decrementQuantity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
    },
  });

  const debouncedSearch = useMemo(
    () => debounce((query: string) => setSearchQuery(query), 300),
    []
  );

  const handleSearchChange = useCallback((text: string) => {
    setLocalSearchQuery(text);
    debouncedSearch(text);
  }, [debouncedSearch]);

  const throttledQuantityChange = useMemo(
    () => throttle((id: string, isIncrement: boolean) => {
      const lockKey = `qty_${id}`;
      if (mutationLockRef.current.has(lockKey)) return;
      mutationLockRef.current.add(lockKey);
      
      const mutation = isIncrement ? incrementMutation : decrementMutation;
      mutation.mutate(id, {
        onSettled: () => {
          setTimeout(() => mutationLockRef.current.delete(lockKey), 500);
        }
      });
    }, 300),
    [incrementMutation, decrementMutation]
  );

  const createMutation = useMutation({
    mutationFn: (payload: CreateStockItemPayload) => stockService.createItem(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      setIsAddModalVisible(false);
      resetNewItem();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => stockService.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
    },
  });

  const resetNewItem = () => {
    setNewItem({
      name: '',
      quantity: 0,
      minQuantity: 10,
      unit: 'pieces',
      category: '',
    });
  };

  const filteredItems = useMemo(() => {
    let items = stockItems;
    items = stockService.filterByStatus(items, activeFilter);
    items = stockService.searchItems(items, searchQuery);
    return items;
  }, [stockItems, activeFilter, searchQuery]);

  const statusCounts = useMemo(() => {
    return {
      available: stockItems.filter(item => getStockStatus(item) === 'available').length,
      low_stock: stockItems.filter(item => getStockStatus(item) === 'low_stock').length,
      out_of_stock: stockItems.filter(item => getStockStatus(item) === 'out_of_stock').length,
    };
  }, [stockItems]);

  const handleFilterPress = useCallback((filter: StockStatus) => {
    setActiveFilter(prev => prev === filter ? null : filter);
  }, []);

  const handleIncrement = useCallback((id: string) => {
    console.log('[StockScreen] Incrementing quantity for:', id);
    throttledQuantityChange(id, true);
  }, [throttledQuantityChange]);

  const handleDecrement = useCallback((id: string) => {
    console.log('[StockScreen] Decrementing quantity for:', id);
    throttledQuantityChange(id, false);
  }, [throttledQuantityChange]);

  const handleAddItem = useCallback(() => {
    if (!newItem.name.trim()) {
      Alert.alert(t('common.error'), t('stock.productName') + ' ' + t('common.required'));
      return;
    }
    console.log('[StockScreen] Adding new item:', newItem);
    createMutation.mutate(newItem);
  }, [newItem, createMutation, t]);

  const handleDeleteItem = useCallback((item: StockItem) => {
    Alert.alert(
      t('stock.deleteProduct'),
      t('stock.confirmDelete'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => deleteMutation.mutate(item.id),
        },
      ]
    );
  }, [deleteMutation, t]);

  const renderStockCard = useCallback((item: StockItem) => {
    const status = getStockStatus(item);
    const statusColor = STOCK_STATUS_COLORS[status];
    const isUpdating = incrementMutation.isPending || decrementMutation.isPending;

    return (
      <View key={item.id} style={styles.stockCard}>
        <View style={[styles.cardContent, isRTL && styles.rowRTL]}>
          <View style={[styles.cardLeft, isRTL && styles.rowRTL]}>
            <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
            <View style={[styles.productInfo, isRTL && styles.productInfoRTL]}>
              <Text style={[styles.productName, isRTL && styles.textRTL]}>{item.name}</Text>
              {item.category && (
                <Text style={[styles.productCategory, isRTL && styles.textRTL]}>{item.category}</Text>
              )}
            </View>
          </View>
          
          <View style={[styles.cardRight, isRTL && styles.rowRTL]}>
            <View style={[styles.quantityContainer, isRTL && styles.rowRTL]}>
              {canAdjustQuantity && (
                <TouchableOpacity
                  style={[styles.quantityButton, styles.decrementButton]}
                  onPress={() => handleDecrement(item.id)}
                  disabled={isUpdating || item.quantity === 0}
                  activeOpacity={0.7}
                >
                  <Minus size={16} color="#fff" />
                </TouchableOpacity>
              )}
              
              <View style={styles.quantityDisplay}>
                <Text style={styles.quantityText}>{item.quantity}</Text>
                <Text style={styles.unitText}>{item.unit}</Text>
              </View>
              
              {canAdjustQuantity && (
                <TouchableOpacity
                  style={[styles.quantityButton, styles.incrementButton]}
                  onPress={() => handleIncrement(item.id)}
                  disabled={isUpdating}
                  activeOpacity={0.7}
                >
                  <Plus size={16} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
            
            {canDeleteStock && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteItem(item)}
                activeOpacity={0.7}
              >
                <X size={16} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }, [canAdjustQuantity, canDeleteStock, handleIncrement, handleDecrement, handleDeleteItem, incrementMutation.isPending, decrementMutation.isPending, isRTL]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={[styles.loadingText, isRTL && styles.textRTL]}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.searchContainer, isRTL && styles.rowRTL]}>
          <Search size={20} color="#9CA3AF" style={isRTL ? styles.searchIconRTL : styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, isRTL && styles.inputRTL]}
            placeholder={t('stock.searchProducts')}
            placeholderTextColor="#9CA3AF"
            value={localSearchQuery}
            onChangeText={handleSearchChange}
            textAlign={isRTL ? 'right' : 'left'}
          />
        </View>

        <View style={[styles.filterContainer, isRTL && styles.rowRTL]}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              { backgroundColor: STOCK_STATUS_COLORS.available },
              activeFilter === 'available' && styles.filterButtonActive,
            ]}
            onPress={() => handleFilterPress('available')}
            activeOpacity={0.8}
          >
            <Text style={styles.filterText}>{statusCounts.available}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              { backgroundColor: STOCK_STATUS_COLORS.low_stock },
              activeFilter === 'low_stock' && styles.filterButtonActive,
            ]}
            onPress={() => handleFilterPress('low_stock')}
            activeOpacity={0.8}
          >
            <Text style={styles.filterText}>{statusCounts.low_stock}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              { backgroundColor: STOCK_STATUS_COLORS.out_of_stock },
              activeFilter === 'out_of_stock' && styles.filterButtonActive,
            ]}
            onPress={() => handleFilterPress('out_of_stock')}
            activeOpacity={0.8}
          >
            <Text style={styles.filterText}>{statusCounts.out_of_stock}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Package size={48} color="#D1D5DB" />
            <Text style={[styles.emptyText, isRTL && styles.textRTL]}>{t('stock.noProducts')}</Text>
            <Text style={[styles.emptySubtext, isRTL && styles.textRTL]}>
              {searchQuery || activeFilter 
                ? t('projects.adjustSearch')
                : t('stock.addFirstProduct')
              }
            </Text>
          </View>
        ) : (
          filteredItems.map(renderStockCard)
        )}
      </ScrollView>

      {canAddStock && (
        <TouchableOpacity
          style={[styles.fab, isRTL && styles.fabRTL]}
          onPress={() => setIsAddModalVisible(true)}
          activeOpacity={0.8}
        >
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      )}

      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalHeader, isRTL && styles.rowRTL]}>
              <Text style={[styles.modalTitle, isRTL && styles.textRTL]}>{t('stock.addProduct')}</Text>
              <TouchableOpacity
                onPress={() => {
                  setIsAddModalVisible(false);
                  resetNewItem();
                }}
                activeOpacity={0.7}
              >
                <X size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, isRTL && styles.textRTL]}>{t('stock.productName')} *</Text>
              <TextInput
                style={[styles.formInput, isRTL && styles.inputRTL]}
                placeholder={t('stock.productName')}
                placeholderTextColor="#9CA3AF"
                value={newItem.name}
                onChangeText={(text) => setNewItem(prev => ({ ...prev, name: text }))}
                textAlign={isRTL ? 'right' : 'left'}
              />
            </View>

            <View style={[styles.formRow, isRTL && styles.rowRTL]}>
              <View style={[styles.formGroup, { flex: 1, marginRight: isRTL ? 0 : 8, marginLeft: isRTL ? 8 : 0 }]}>
                <Text style={[styles.formLabel, isRTL && styles.textRTL]}>{t('stock.quantity')}</Text>
                <TextInput
                  style={[styles.formInput, isRTL && styles.inputRTL]}
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={newItem.quantity.toString()}
                  onChangeText={(text) => setNewItem(prev => ({ ...prev, quantity: parseInt(text) || 0 }))}
                  textAlign={isRTL ? 'right' : 'left'}
                />
              </View>
              
              <View style={[styles.formGroup, { flex: 1, marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 }]}>
                <Text style={[styles.formLabel, isRTL && styles.textRTL]}>{t('stock.minQuantity')}</Text>
                <TextInput
                  style={[styles.formInput, isRTL && styles.inputRTL]}
                  placeholder="10"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={newItem.minQuantity.toString()}
                  onChangeText={(text) => setNewItem(prev => ({ ...prev, minQuantity: parseInt(text) || 0 }))}
                  textAlign={isRTL ? 'right' : 'left'}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, createMutation.isPending && styles.submitButtonDisabled]}
              onPress={handleAddItem}
              disabled={createMutation.isPending}
              activeOpacity={0.8}
            >
              {createMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>{t('stock.addProduct')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchIconRTL: {
    marginLeft: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#111827',
  },
  inputRTL: {
    textAlign: 'right' as const,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    borderWidth: 3,
    borderColor: '#000',
  },
  filterText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  stockCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIndicator: {
    width: 8,
    height: 40,
    borderRadius: 4,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productInfoRTL: {
    alignItems: 'flex-end',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
  },
  productCategory: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decrementButton: {
    backgroundColor: '#EF4444',
  },
  incrementButton: {
    backgroundColor: '#22C55E',
  },
  quantityDisplay: {
    alignItems: 'center',
    minWidth: 50,
    paddingHorizontal: 8,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#111827',
  },
  unitText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 1,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#374151',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center' as const,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabRTL: {
    right: undefined,
    left: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#111827',
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#374151',
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  formRow: {
    flexDirection: 'row',
  },
  submitButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  textRTL: {
    textAlign: 'right' as const,
  },
  rowRTL: {
    flexDirection: 'row-reverse' as const,
  },
});
