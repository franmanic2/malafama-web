<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useInventoryStore, type Product } from '../stores/inventory';
import { Package, Plus, Search, Trash2, Edit3, AlertCircle, ShoppingCart, PlusCircle } from 'lucide-vue-next';

const inventoryStore = useInventoryStore();
const searchQuery = ref('');
const showAddModal = ref(false);
const showSaleModal = ref(false);
const showRestockModal = ref(false);
const showEditModal = ref(false);
const selectedProduct = ref<Product | null>(null);
const saleQuantity = ref(1);
const salePaymentMethod = ref<'cash' | 'yape' | 'debt'>('cash');
const saleClientName = ref('');
const restockQuantity = ref(1);

const editForm = ref({
  id: '',
  name: '',
  buyPrice: 0,
  sellPrice: 0
});

const productForm = ref({
  name: '',
  category: 'bebidas',
  stock: 0,
  minStock: 5,
  buyPrice: 0,
  sellPrice: 0,
  provider: ''
});

onMounted(async () => {
  await inventoryStore.fetchProducts();
});

const filteredProducts = computed(() => {
  return inventoryStore.products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const handleAddProduct = async () => {
  await inventoryStore.addProduct(productForm.value);
  showAddModal.value = false;
  // Reset form
  productForm.value = {
    name: '',
    category: 'bebidas',
    stock: 0,
    minStock: 5,
    buyPrice: 0,
    sellPrice: 0,
    provider: ''
  };
};

const handleDelete = async (id: string) => {
  if (confirm('¿Estás seguro de eliminar este producto?')) {
    await inventoryStore.deleteProduct(id);
  }
};

const openSaleModal = (product: Product) => {
  selectedProduct.value = product;
  saleQuantity.value = 1;
  salePaymentMethod.value = 'cash';
  saleClientName.value = '';
  showSaleModal.value = true;
};

const handleSale = async () => {
  if (!selectedProduct.value) return;
  if (salePaymentMethod.value === 'debt' && !saleClientName.value.trim()) {
    alert('Ingresa el nombre del cliente para registrar la deuda.');
    return;
  }
  
  try {
    await inventoryStore.recordSale(selectedProduct.value.id, saleQuantity.value, salePaymentMethod.value, saleClientName.value);
    showSaleModal.value = false;
  } catch (err: any) {
    alert(err.message);
  }
};

const openRestockModal = (product: Product) => {
  selectedProduct.value = product;
  restockQuantity.value = 10; // Default suggestions for restocking
  showRestockModal.value = true;
};

const handleRestock = async () => {
  if (!selectedProduct.value || restockQuantity.value <= 0) return;
  try {
    await inventoryStore.restockProduct(selectedProduct.value.id, restockQuantity.value);
    showRestockModal.value = false;
  } catch (err: any) {
    alert(err.message);
  }
};

const openEditModal = (product: Product) => {
  editForm.value = {
    id: product.id,
    name: product.name,
    buyPrice: product.buyPrice,
    sellPrice: product.sellPrice
  };
  showEditModal.value = true;
};

const handleEditProduct = async () => {
  if (!editForm.value.name.trim()) return;
  try {
    await inventoryStore.updateProduct(editForm.value.id, {
      name: editForm.value.name,
      buyPrice: editForm.value.buyPrice,
      sellPrice: editForm.value.sellPrice
    });
    showEditModal.value = false;
  } catch (err: any) {
    alert(err.message);
  }
};
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-white flex items-center">
          <Package class="w-8 h-8 mr-3 text-accent" />
          Inventario
        </h1>
        <p class="text-customText-muted">Gestión de productos, bebidas y snacks.</p>
      </div>
      <button @click="showAddModal = true" class="btn btn-primary flex items-center space-x-2">
        <Plus class="w-5 h-5" />
        <span>Nuevo Producto</span>
      </button>
    </div>

    <!-- Search & Filters -->
    <div class="flex flex-col md:flex-row gap-4">
      <div class="relative flex-1">
        <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-dark-700">
          <Search class="w-5 h-5" />
        </span>
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Buscar producto o categoría..." 
          class="input-field pl-10"
        />
      </div>
    </div>

    <!-- Table -->
    <div class="card overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-dark-900/50 text-customText-muted text-xs uppercase tracking-wider">
            <th class="px-6 py-4 font-semibold">Producto</th>
            <th class="px-6 py-4 font-semibold">Categoría</th>
            <th class="px-6 py-4 font-semibold">Stock</th>
            <th class="px-6 py-4 font-semibold">Precio Venta</th>
            <th class="px-6 py-4 font-semibold text-right">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-dark-700">
          <tr v-for="product in filteredProducts" :key="product.id" class="hover:bg-dark-700/30 transition-colors">
            <td class="px-6 py-4">
              <div class="font-medium text-white">{{ product.name }}</div>
              <div class="text-xs text-customText-muted">{{ product.provider || 'Sin proveedor' }}</div>
            </td>
            <td class="px-6 py-4">
              <span class="px-2 py-1 rounded-full bg-dark-700 text-[10px] uppercase font-bold text-customText-muted">
                {{ product.category }}
              </span>
            </td>
            <td class="px-6 py-4">
              <div class="flex items-center space-x-2">
                <span :class="['font-bold', product.stock <= product.minStock ? 'text-red-400' : 'text-white']">
                  {{ product.stock }}
                </span>
                <AlertCircle v-if="product.stock <= product.minStock" class="w-4 h-4 text-red-400" />
              </div>
            </td>
            <td class="px-6 py-4 font-medium text-white">
              S/ {{ product.sellPrice.toFixed(2) }}
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end space-x-2">
                <button @click="openSaleModal(product)" class="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white transition-all" title="Registrar Venta">
                  <ShoppingCart class="w-4 h-4" />
                </button>
                <button @click="openRestockModal(product)" class="p-2 rounded-lg bg-accent/10 text-accent hover:bg-accent hover:text-white transition-all" title="Añadir Stock">
                  <PlusCircle class="w-4 h-4" />
                </button>
                <button @click="openEditModal(product)" class="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all" title="Editar Producto">
                  <Edit3 class="w-4 h-4" />
                </button>
                <button @click="handleDelete(product.id)" class="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all" title="Eliminar">
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="filteredProducts.length === 0" class="p-10 text-center text-customText-muted italic">
        No se encontraron productos.
      </div>
    </div>

    <!-- Add Modal -->
    <div v-if="showAddModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-dark-900/80 backdrop-blur-sm" @click="showAddModal = false"></div>
      <div class="relative card max-w-lg w-full p-8 space-y-6">
        <h3 class="text-2xl font-bold text-white">Nuevo Producto</h3>
        
        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2">
            <label class="block text-sm font-medium text-customText-muted mb-2">Nombre del Producto</label>
            <input v-model="productForm.name" type="text" class="input-field" placeholder="Ej. Cerveza Pilsen" />
          </div>
          <div>
            <label class="block text-sm font-medium text-customText-muted mb-2">Categoría</label>
            <select v-model="productForm.category" class="input-field">
              <option value="bebidas">Bebidas</option>
              <option value="snacks">Snacks</option>
              <option value="accesorios">Accesorios</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-customText-muted mb-2">Proveedor</label>
            <input v-model="productForm.provider" type="text" class="input-field" placeholder="Ej. Backus" />
          </div>
          <div>
            <label class="block text-sm font-medium text-customText-muted mb-2">Stock Inicial</label>
            <input v-model.number="productForm.stock" type="number" class="input-field" />
          </div>
          <div>
            <label class="block text-sm font-medium text-customText-muted mb-2">Stock Mínimo</label>
            <input v-model.number="productForm.minStock" type="number" class="input-field" />
          </div>
          <div>
            <label class="block text-sm font-medium text-customText-muted mb-2">Precio Compra</label>
            <input v-model.number="productForm.buyPrice" type="number" step="0.1" class="input-field" />
          </div>
          <div>
            <label class="block text-sm font-medium text-customText-muted mb-2">Precio Venta</label>
            <input v-model.number="productForm.sellPrice" type="number" step="0.1" class="input-field" />
          </div>
        </div>
        
        <div class="flex space-x-3 mt-4">
          <button @click="showAddModal = false" class="flex-1 btn btn-secondary">Cancelar</button>
          <button @click="handleAddProduct" class="flex-1 btn btn-primary">Guardar Producto</button>
        </div>
      </div>
    </div>

    <!-- Sale Modal -->
    <div v-if="showSaleModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-dark-900/80 backdrop-blur-sm" @click="showSaleModal = false"></div>
      <div class="relative card max-w-sm w-full p-6 space-y-6">
        <h3 class="text-xl font-bold">Registrar Venta</h3>
        <p class="text-customText-muted">{{ selectedProduct?.name }}</p>
        
        <div>
          <label class="block text-sm font-medium text-customText-muted mb-2">Cantidad</label>
          <input v-model.number="saleQuantity" type="number" min="1" :max="selectedProduct?.stock" class="input-field" />
        </div>

        <div>
          <label class="block text-sm font-medium text-customText-muted mb-2">Método de Pago</label>
          <div class="grid grid-cols-3 gap-2">
            <button 
              @click="salePaymentMethod = 'cash'" 
              :class="['p-2 rounded-lg border text-sm font-medium', salePaymentMethod === 'cash' ? 'bg-accent border-accent text-white' : 'bg-dark-900 border-dark-700 text-customText-muted']"
            >Efectivo</button>
            <button 
              @click="salePaymentMethod = 'yape'" 
              :class="['p-2 rounded-lg border text-sm font-medium', salePaymentMethod === 'yape' ? 'bg-accent border-accent text-white' : 'bg-dark-900 border-dark-700 text-customText-muted']"
            >Yape</button>
            <button 
              @click="salePaymentMethod = 'debt'" 
              :class="['p-2 rounded-lg border text-sm font-medium', salePaymentMethod === 'debt' ? 'bg-accent border-accent text-white' : 'bg-dark-900 border-dark-700 text-customText-muted']"
            >Deuda</button>
          </div>
        </div>

        <div v-if="salePaymentMethod === 'debt'">
          <label class="block text-sm font-medium text-customText-muted mb-2">Nombre del Cliente</label>
          <input v-model="saleClientName" type="text" class="input-field" placeholder="Ej. Juan Pérez" />
        </div>

        <div class="flex items-center justify-between py-4 border-t border-dark-700">
          <span class="font-medium text-white">Total a Cobrar</span>
          <span class="text-2xl font-bold text-accent">S/ {{ (saleQuantity * (selectedProduct?.sellPrice || 0)).toFixed(2) }}</span>
        </div>

        <button @click="handleSale" class="w-full btn btn-primary py-3">Confirmar Venta</button>
      </div>
    </div>

    <!-- Restock Modal -->
    <div v-if="showRestockModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-dark-900/80 backdrop-blur-sm" @click="showRestockModal = false"></div>
      <div class="relative card max-w-sm w-full p-6 space-y-6">
        <h3 class="text-xl font-bold flex items-center">
          <PlusCircle class="w-5 h-5 mr-2 text-accent" />
          Añadir Stock
        </h3>
        <p class="text-customText-muted">Reponer inventario de <strong class="text-white">{{ selectedProduct?.name }}</strong></p>
        
        <div>
          <label class="block text-sm font-medium text-customText-muted mb-2">Cantidad a ingresar</label>
          <input v-model.number="restockQuantity" type="number" min="1" class="input-field" />
        </div>

        <div class="flex items-center justify-between py-4 border-t border-dark-700">
          <span class="font-medium text-customText-muted">Costo Estimado</span>
          <span class="text-xl font-bold text-red-400">S/ {{ (restockQuantity * (selectedProduct?.buyPrice || 0)).toFixed(2) }}</span>
        </div>
        
        <div class="flex space-x-3">
          <button @click="showRestockModal = false" class="flex-1 btn btn-secondary">Cancelar</button>
          <button @click="handleRestock" class="flex-1 btn btn-primary">Registrar Ingreso</button>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-dark-900/80 backdrop-blur-sm" @click="showEditModal = false"></div>
      <div class="relative card max-w-sm w-full p-6 space-y-6">
        <h3 class="text-xl font-bold flex items-center">
          <Edit3 class="w-5 h-5 mr-2 text-blue-400" />
          Editar Producto
        </h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-customText-muted mb-2">Nombre del Producto</label>
            <input v-model="editForm.name" type="text" class="input-field" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-customText-muted mb-2">Precio Compra</label>
              <input v-model.number="editForm.buyPrice" type="number" step="0.1" class="input-field" />
            </div>
            <div>
              <label class="block text-sm font-medium text-customText-muted mb-2">Precio Venta</label>
              <input v-model.number="editForm.sellPrice" type="number" step="0.1" class="input-field" />
            </div>
          </div>
        </div>
        
        <div class="flex space-x-3 pt-2">
          <button @click="showEditModal = false" class="flex-1 btn btn-secondary">Cancelar</button>
          <button @click="handleEditProduct" class="flex-1 btn btn-primary !bg-blue-600 hover:!bg-blue-700">Guardar Cambios</button>
        </div>
      </div>
    </div>
  </div>
</template>
