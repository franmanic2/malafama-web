<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useFinanceStore } from '../stores/finance';
import { useTableStore } from '../stores/table';
import { useInventoryStore } from '../stores/inventory';
import { useDebtStore } from '../stores/debt';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Dices, 
  Package, 
  AlertTriangle,
  Wallet
} from 'lucide-vue-next';
import { subDays, format, parseISO, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Chart as ChartJS, 
  Title, 
  Tooltip, 
  Legend, 
  BarElement, 
  CategoryScale, 
  LinearScale,
  PointElement,
  LineElement,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'vue-chartjs';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  PointElement,
  LineElement,
  ArcElement
);

const financeStore = useFinanceStore();
const tableStore = useTableStore();
const inventoryStore = useInventoryStore();
const debtStore = useDebtStore();

onMounted(async () => {
  await Promise.all([
    financeStore.fetchTransactions(),
    tableStore.fetchTables(),
    inventoryStore.fetchProducts(),
    debtStore.fetchDebts()
  ]);
});

const stats = computed(() => [
  { 
    name: 'Ingreso Diario', 
    value: `S/ ${financeStore.summary.totalIncome.toFixed(2)}`, 
    icon: TrendingUp, 
    color: 'text-green-400',
    bg: 'bg-green-400/10'
  },
  { 
    name: 'Egresos Hoy', 
    value: `S/ ${financeStore.summary.totalExpenses.toFixed(2)}`, 
    icon: TrendingDown, 
    color: 'text-red-400',
    bg: 'bg-red-400/10'
  },
  { 
    name: 'Ganancia Neta', 
    value: `S/ ${financeStore.summary.netProfit.toFixed(2)}`, 
    icon: DollarSign, 
    color: 'text-accent',
    bg: 'bg-accent/10'
  },
  { 
    name: 'Deudas Pendientes', 
    value: `S/ ${debtStore.debts.filter(d => d.status === 'pending').reduce((sum, d) => sum + d.amount, 0).toFixed(2)}`, 
    icon: Wallet, 
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10'
  }
]);

const tableStats = computed(() => {
  const occupied = tableStore.tables.filter(t => t.status === 'occupied').length;
  const available = tableStore.tables.filter(t => t.status === 'available').length;
  return { occupied, available };
});

const lowStockCount = computed(() => {
  return inventoryStore.products.filter(p => p.stock <= p.minStock).length;
});

// Chart Data
const incomeChartData = computed(() => {
  const labels = [];
  const data = [];
  const now = new Date();
  
  // Last 7 days
  for (let i = 6; i >= 0; i--) {
    const d = subDays(now, i);
    labels.push(format(d, 'EEE', { locale: es }));
    
    // Sum income for that day
    const dayIncome = financeStore.transactions
      .filter(t => t.type === 'income' && isSameDay(parseISO(t.date), d))
      .reduce((sum, t) => sum + t.amount, 0);
      
    data.push(dayIncome);
  }

  return {
    labels,
    datasets: [
      {
        label: 'Ingresos Diarios',
        backgroundColor: '#f97316',
        data,
        borderRadius: 8,
      }
    ]
  };
});

const paymentMethodData = computed(() => ({
  labels: ['Efectivo', 'Yape'],
  datasets: [
    {
      backgroundColor: ['#f97316', '#374151'],
      borderWidth: 0,
      data: [financeStore.summary.cashIncome, financeStore.summary.yapeIncome]
    }
  ]
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    y: {
      grid: {
        color: '#374151',
      },
      ticks: {
        color: '#9ca3af'
      }
    },
    x: {
      grid: {
        display: false
      },
      ticks: {
        color: '#9ca3af'
      }
    }
  }
};
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-white">Dashboard General</h1>
        <p class="text-customText-muted">Bienvenido de nuevo, Administrador.</p>
      </div>
      <div class="flex items-center space-x-2 bg-dark-800 p-2 rounded-xl border border-dark-700">
        <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
        <span class="text-sm font-medium">Sistema en línea</span>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div v-for="stat in stats" :key="stat.name" class="card p-6 flex items-center space-x-4">
        <div :class="['p-3 rounded-xl', stat.bg]">
          <component :is="stat.icon" :class="['w-6 h-6', stat.color]" />
        </div>
        <div>
          <p class="text-sm font-medium text-customText-muted">{{ stat.name }}</p>
          <p class="text-2xl font-bold text-white">{{ stat.value }}</p>
        </div>
      </div>
    </div>

    <!-- Secondary Stats -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Tables Status -->
      <div class="card p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="font-bold text-lg flex items-center">
            <Dices class="w-5 h-5 mr-2 text-accent" />
            Estado de Mesas
          </h3>
        </div>
        <div class="space-y-4">
          <div class="flex justify-between items-center p-3 bg-dark-900/50 rounded-lg">
            <span class="text-sm text-customText-muted">Mesas Ocupadas</span>
            <span class="text-xl font-bold text-orange-400">{{ tableStats.occupied }}</span>
          </div>
          <div class="flex justify-between items-center p-3 bg-dark-900/50 rounded-lg">
            <span class="text-sm text-customText-muted">Mesas Disponibles</span>
            <span class="text-xl font-bold text-green-400">{{ tableStats.available }}</span>
          </div>
        </div>
      </div>

      <!-- Inventory Alert -->
      <div class="card p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="font-bold text-lg flex items-center">
            <Package class="w-5 h-5 mr-2 text-accent" />
            Stock Bajo
          </h3>
        </div>
        <div class="flex flex-col items-center justify-center py-4">
          <div v-if="lowStockCount > 0" class="text-center">
            <AlertTriangle class="w-12 h-12 text-yellow-500 mx-auto mb-2" />
            <p class="text-2xl font-bold text-white">{{ lowStockCount }}</p>
            <p class="text-sm text-customText-muted">Productos requieren atención</p>
          </div>
          <div v-else class="text-center">
            <div class="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <Package class="w-6 h-6 text-green-500" />
            </div>
            <p class="text-sm text-customText-muted">Todo el inventario está al día</p>
          </div>
        </div>
      </div>

      <!-- Quick Summary -->
      <div class="card p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="font-bold text-lg flex items-center">
            <TrendingUp class="w-5 h-5 mr-2 text-accent" />
            Resumen de Hoy
          </h3>
        </div>
        <div class="h-40 relative">
          <Doughnut :data="paymentMethodData" :options="{ ...chartOptions, cutout: '70%' }" />
          <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span class="text-xs text-customText-muted uppercase">Total</span>
            <span class="text-lg font-bold">S/ {{ financeStore.summary.totalIncome }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="card p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="font-bold text-lg">Ingresos Semanales</h3>
          <select class="bg-dark-900 border border-dark-700 text-xs rounded-lg px-2 py-1 outline-none">
            <option>Esta semana</option>
            <option>Semana pasada</option>
          </select>
        </div>
        <div class="h-64">
          <Bar :data="incomeChartData" :options="chartOptions" />
        </div>
      </div>

      <div class="card p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="font-bold text-lg">Últimos Movimientos</h3>
          <router-link to="/finance" class="text-xs text-accent hover:underline">Ver todo</router-link>
        </div>
        <div class="space-y-4">
          <div v-for="t in financeStore.todayTransactions.slice(0, 5)" :key="t.id" class="flex items-center justify-between p-3 border-b border-dark-700 last:border-0">
            <div class="flex items-center space-x-3">
              <div :class="['p-2 rounded-lg', t.type === 'income' ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400']">
                <component :is="t.type === 'income' ? TrendingUp : TrendingDown" class="w-4 h-4" />
              </div>
              <div>
                <p class="text-sm font-medium text-white">{{ t.category }}</p>
                <p class="text-xs text-customText-muted">{{ t.description }}</p>
              </div>
            </div>
            <span :class="['font-bold', t.type === 'income' ? 'text-green-400' : 'text-red-400']">
              {{ t.type === 'income' ? '+' : '-' }} S/ {{ t.amount.toFixed(2) }}
            </span>
          </div>
          <div v-if="financeStore.todayTransactions.length === 0" class="text-center py-8 text-customText-muted italic">
            No hay movimientos registrados hoy.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
