<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useFinanceStore, type Transaction } from '../stores/finance';
import { CircleDollarSign, Plus, ArrowUpRight, ArrowDownRight, Search, Calendar, Filter, Trash2 } from 'lucide-vue-next';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const financeStore = useFinanceStore();
const searchQuery = ref('');
const filterType = ref<'all' | 'income' | 'expense'>('all');
const showExpenseModal = ref(false);

const expenseForm = ref({
  category: '',
  amount: 0,
  description: '',
  paymentMethod: 'cash' as 'cash' | 'yape',
  date: new Date().toISOString()
});

onMounted(async () => {
  await financeStore.fetchTransactions();
});

const filteredTransactions = computed(() => {
  return financeStore.transactions
    .filter(t => {
      const matchesSearch = t.category.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                           t.description.toLowerCase().includes(searchQuery.value.toLowerCase());
      const matchesType = filterType.value === 'all' || t.type === filterType.value;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
});

const handleAddExpense = async () => {
  await financeStore.addExpense(expenseForm.value);
  showExpenseModal.value = false;
  expenseForm.value = {
    category: '',
    amount: 0,
    description: '',
    paymentMethod: 'cash',
    date: new Date().toISOString()
  };
};

const handleDelete = async (id: string) => {
  console.log('handleDelete called in view for ID:', id);
  if (!id) {
    alert('Error: El ID de la transacción no es válido o es inexistente.');
    return;
  }
  if (confirm('¿Estás seguro de que deseas eliminar esta transacción? Esta acción no se puede deshacer.')) {
    try {
      await financeStore.deleteTransaction(id);
      console.log('Deletion confirmed and finished.');
    } catch (e: any) {
      console.error('Error in handleDelete:', e);
      alert('No se pudo eliminar la transacción: ' + e.message);
    }
  }
};
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-white flex items-center">
          <CircleDollarSign class="w-8 h-8 mr-3 text-accent" />
          Finanzas
        </h1>
        <p class="text-customText-muted">Registro de ingresos y egresos del local.</p>
      </div>
      <button @click="showExpenseModal = true" class="btn btn-secondary border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white flex items-center space-x-2">
        <Plus class="w-5 h-5" />
        <span>Registrar Egreso</span>
      </button>
    </div>

    <!-- Summary -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Ingresos Hoy -->
      <div class="card p-6 border-green-500/20 bg-green-500/5 flex flex-col justify-between">
        <div>
          <p class="text-sm font-medium text-green-400 uppercase tracking-wider mb-1">Ingresos Hoy</p>
          <p class="text-3xl font-bold text-white">S/ {{ financeStore.summary.totalIncome.toFixed(2) }}</p>
        </div>
        <div class="mt-4 pt-3 border-t border-green-500/10 flex items-center justify-between text-xs text-customText-muted">
          <span class="flex items-center">
            <span class="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5"></span>
            Efectivo: <strong class="text-white ml-1">S/ {{ financeStore.summary.cashIncome.toFixed(2) }}</strong>
          </span>
          <span class="flex items-center">
            <span class="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5"></span>
            Yape: <strong class="text-white ml-1">S/ {{ financeStore.summary.yapeIncome.toFixed(2) }}</strong>
          </span>
        </div>
      </div>

      <!-- Egresos Hoy -->
      <div class="card p-6 border-red-500/20 bg-red-500/5 flex flex-col justify-between">
        <div>
          <p class="text-sm font-medium text-red-400 uppercase tracking-wider mb-1">Egresos Hoy</p>
          <p class="text-3xl font-bold text-white">S/ {{ financeStore.summary.totalExpenses.toFixed(2) }}</p>
        </div>
        <div class="mt-4 pt-3 border-t border-red-500/10 flex items-center justify-between text-xs text-customText-muted">
          <span class="flex items-center">
            <span class="w-1.5 h-1.5 rounded-full bg-red-400 mr-1.5"></span>
            Efectivo: <strong class="text-white ml-1">S/ {{ financeStore.summary.cashExpenses.toFixed(2) }}</strong>
          </span>
          <span class="flex items-center">
            <span class="w-1.5 h-1.5 rounded-full bg-red-400 mr-1.5"></span>
            Yape: <strong class="text-white ml-1">S/ {{ financeStore.summary.yapeExpenses.toFixed(2) }}</strong>
          </span>
        </div>
      </div>

      <!-- Balance Hoy -->
      <div class="card p-6 border-accent/20 bg-accent/5 flex flex-col justify-between">
        <div>
          <p class="text-sm font-medium text-accent uppercase tracking-wider mb-1">Balance Hoy</p>
          <p class="text-3xl font-bold text-white">S/ {{ financeStore.summary.netProfit.toFixed(2) }}</p>
        </div>
        <div class="mt-4 pt-3 border-t border-accent/10 flex items-center justify-between text-xs text-customText-muted">
          <span class="flex items-center">
            <span class="w-1.5 h-1.5 rounded-full bg-accent mr-1.5"></span>
            Efectivo: <strong class="text-white ml-1">S/ {{ (financeStore.summary.cashIncome - financeStore.summary.cashExpenses).toFixed(2) }}</strong>
          </span>
          <span class="flex items-center">
            <span class="w-1.5 h-1.5 rounded-full bg-accent mr-1.5"></span>
            Yape: <strong class="text-white ml-1">S/ {{ (financeStore.summary.yapeIncome - financeStore.summary.yapeExpenses).toFixed(2) }}</strong>
          </span>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-col md:flex-row gap-4 items-center">
      <div class="relative flex-1 w-full">
        <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-dark-700">
          <Search class="w-5 h-5" />
        </span>
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Buscar transacción..." 
          class="input-field pl-10"
        />
      </div>
      <div class="flex items-center space-x-2 bg-dark-800 p-1 rounded-xl border border-dark-700 w-full md:w-auto">
        <button 
          @click="filterType = 'all'"
          :class="['px-4 py-2 rounded-lg text-sm font-medium transition-all', filterType === 'all' ? 'bg-dark-700 text-white' : 'text-customText-muted hover:text-white']"
        >Todos</button>
        <button 
          @click="filterType = 'income'"
          :class="['px-4 py-2 rounded-lg text-sm font-medium transition-all', filterType === 'income' ? 'bg-green-500/20 text-green-400' : 'text-customText-muted hover:text-white']"
        >Ingresos</button>
        <button 
          @click="filterType = 'expense'"
          :class="['px-4 py-2 rounded-lg text-sm font-medium transition-all', filterType === 'expense' ? 'bg-red-500/20 text-red-400' : 'text-customText-muted hover:text-white']"
        >Egresos</button>
      </div>
    </div>

    <!-- Transaction List -->
    <div class="space-y-4">
      <div v-for="t in filteredTransactions" :key="t.id" class="card p-4 hover:bg-dark-700/20 transition-all">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <div :class="['w-12 h-12 rounded-2xl flex items-center justify-center', t.type === 'income' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400']">
              <component :is="t.type === 'income' ? ArrowUpRight : ArrowDownRight" class="w-6 h-6" />
            </div>
            <div>
              <p class="font-bold text-white">{{ t.category }}</p>
              <div class="flex items-center space-x-3 text-xs text-customText-muted mt-0.5">
                <span class="flex items-center"><Calendar class="w-3 h-3 mr-1" /> {{ format(parseISO(t.date), "d 'de' MMMM, HH:mm", { locale: es }) }}</span>
                <span class="px-1.5 py-0.5 bg-dark-700 rounded uppercase font-bold text-[10px]">{{ t.paymentMethod }}</span>
              </div>
            </div>
          </div>
          <div class="flex items-center space-x-4">
            <div class="text-right">
              <p :class="['text-xl font-bold', t.type === 'income' ? 'text-green-400' : 'text-red-400']">
                {{ t.type === 'income' ? '+' : '-' }} S/ {{ t.amount.toFixed(2) }}
              </p>
              <p class="text-xs text-customText-muted mt-1">{{ t.description }}</p>
            </div>
            <button 
              @click="handleDelete(t.id)"
              class="text-customText-muted hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-all"
              title="Eliminar Transacción"
            >
              <Trash2 class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      <div v-if="filteredTransactions.length === 0" class="py-20 text-center text-customText-muted">
        <Search class="w-12 h-12 mx-auto mb-4 opacity-20" />
        <p class="italic">No se encontraron transacciones con los filtros aplicados.</p>
      </div>
    </div>

    <!-- Expense Modal -->
    <div v-if="showExpenseModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-dark-900/80 backdrop-blur-sm" @click="showExpenseModal = false"></div>
      <div class="relative card max-w-lg w-full p-8 space-y-6">
        <h3 class="text-2xl font-bold text-white">Registrar Egreso</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-customText-muted mb-2">Concepto / Categoría</label>
            <input v-model="expenseForm.category" type="text" class="input-field" placeholder="Ej. Pago Personal, Luz, Mantenimiento" />
          </div>
          <div>
            <label class="block text-sm font-medium text-customText-muted mb-2">Monto (S/)</label>
            <input v-model.number="expenseForm.amount" type="number" step="0.1" class="input-field" />
          </div>
          <div>
            <label class="block text-sm font-medium text-customText-muted mb-2">Descripción Detallada</label>
            <textarea v-model="expenseForm.description" class="input-field h-24 resize-none" placeholder="Opcional..."></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-customText-muted mb-2">Método de Pago</label>
            <div class="grid grid-cols-2 gap-2">
              <button @click="expenseForm.paymentMethod = 'cash'" :class="['p-2 rounded-lg border text-sm font-medium transition-all', expenseForm.paymentMethod === 'cash' ? 'bg-accent border-accent text-white' : 'bg-dark-900 border-dark-700 text-customText-muted']">Efectivo</button>
              <button @click="expenseForm.paymentMethod = 'yape'" :class="['p-2 rounded-lg border text-sm font-medium transition-all', expenseForm.paymentMethod === 'yape' ? 'bg-accent border-accent text-white' : 'bg-dark-900 border-dark-700 text-customText-muted']">Yape</button>
            </div>
          </div>
        </div>
        
        <div class="flex space-x-3 pt-4">
          <button @click="showExpenseModal = false" class="flex-1 btn btn-secondary">Cancelar</button>
          <button @click="handleAddExpense" class="flex-1 btn bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20">Guardar Egreso</button>
        </div>
      </div>
    </div>
  </div>
</template>
