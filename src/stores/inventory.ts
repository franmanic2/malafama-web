import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apiService } from '../services/api.service';
import { useDebtStore } from './debt';

export interface Product {
  id: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  buyPrice: number;
  sellPrice: number;
  provider?: string;
}

export const useInventoryStore = defineStore('inventory', () => {
  const products = ref<Product[]>([]);
  const loading = ref(false);

  async function fetchProducts() {
    loading.value = true;
    try {
      products.value = await apiService.getAll<Product>('inventory');
    } finally {
      loading.value = false;
    }
  }

  async function addProduct(product: Omit<Product, 'id'>) {
    const newProduct = await apiService.create<Product>('inventory', {
      ...product,
      id: Date.now().toString()
    });
    products.value.push(newProduct);
  }

  async function updateProduct(id: string, product: Partial<Product>) {
    const updated = await apiService.update<Product>('inventory', id, product);
    const index = products.value.findIndex(p => p.id === id);
    if (index !== -1) products.value[index] = updated;
  }

  async function deleteProduct(id: string) {
    await apiService.delete('inventory', id);
    products.value = products.value.filter(p => p.id !== id);
  }

  async function recordSale(productId: string, quantity: number, paymentMethod: 'cash' | 'yape' | 'debt', clientName?: string) {
    const product = products.value.find(p => p.id === productId);
    if (!product || product.stock < quantity) throw new Error('Stock insuficiente');

    const newStock = product.stock - quantity;
    await updateProduct(productId, { stock: newStock });

    const total = product.sellPrice * quantity;
    
    if (paymentMethod === 'debt' && clientName) {
      const debtStore = useDebtStore();
      await debtStore.addDebt({
        clientName,
        amount: total,
        reason: `Venta: ${product.name} x${quantity}`,
        date: new Date().toISOString()
      });
    } else {
      await apiService.create('finance', {
        id: Date.now().toString(),
        type: 'income',
        category: 'Venta Productos',
        amount: total,
        date: new Date().toISOString(),
        paymentMethod,
        description: `Venta: ${product.name} x${quantity}`
      });
    }
  }

  async function restockProduct(productId: string, quantity: number) {
    const product = products.value.find(p => p.id === productId);
    if (!product) throw new Error('Producto no encontrado');

    const newStock = product.stock + quantity;
    await updateProduct(productId, { stock: newStock });

    const cost = product.buyPrice * quantity;
    await apiService.create('finance', {
      id: Date.now().toString(),
      type: 'expense',
      category: 'Compra Inventario',
      amount: cost,
      date: new Date().toISOString(),
      paymentMethod: 'cash', // Assuming cash/transfer out of standard expenses
      description: `Reposición: ${product.name} x${quantity}`
    });
  }

  return {
    products,
    loading,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    recordSale,
    restockProduct
  };
});
