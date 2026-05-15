<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useFinanceStore } from '../stores/finance';
import { useTableStore } from '../stores/table';
import { useInventoryStore } from '../stores/inventory';
import { BarChart3, Download, Calendar, Filter, TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-vue-next';
import { format, subDays, isWithinInterval, parseISO, startOfDay, endOfDay, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import * as XLSX from 'xlsx';

const financeStore = useFinanceStore();
const tableStore = useTableStore();
const inventoryStore = useInventoryStore();

const dateRange = ref('7'); // Default last 7 days

onMounted(async () => {
  await Promise.all([
    financeStore.fetchTransactions(),
    tableStore.fetchTables(),
    inventoryStore.fetchProducts()
  ]);
});

const reportData = computed(() => {
  const now = new Date();
  const days = parseInt(dateRange.value);
  
  // Current Period
  const startCurrent = days === 0 ? startOfDay(now) : startOfDay(subDays(now, days));
  const endCurrent = endOfDay(now);
  
  // Previous Period
  const intervalDays = days === 0 ? 1 : days;
  const startPrevious = startOfDay(subDays(startCurrent, intervalDays));
  const endPrevious = endOfDay(subDays(startCurrent, 1));

  const currentFiltered = financeStore.transactions.filter(t => {
    const tDate = parseISO(t.date);
    return isWithinInterval(tDate, { start: startCurrent, end: endCurrent });
  });

  const previousFiltered = financeStore.transactions.filter(t => {
    const tDate = parseISO(t.date);
    return isWithinInterval(tDate, { start: startPrevious, end: endPrevious });
  });

  const income = currentFiltered.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expenses = currentFiltered.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  
  const prevIncome = previousFiltered.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const prevExpenses = previousFiltered.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  const incomeChange = prevIncome === 0 ? (income > 0 ? 100 : 0) : ((income - prevIncome) / prevIncome) * 100;
  const expensesChange = prevExpenses === 0 ? (expenses > 0 ? 100 : 0) : ((expenses - prevExpenses) / prevExpenses) * 100;

  return {
    income,
    expenses,
    profit: income - expenses,
    count: currentFiltered.length,
    incomeChange,
    expensesChange,
    startCurrent
  };
});

const filteredTransactions = computed(() => {
  const now = new Date();
  const days = parseInt(dateRange.value);
  const start = days === 0 ? startOfDay(now) : startOfDay(subDays(now, days));
  return financeStore.transactions.filter(t => {
    return isWithinInterval(parseISO(t.date), { start, end: endOfDay(now) });
  });
});

const topProducts = computed(() => {
  const productSales = new Map<string, number>();
  
  filteredTransactions.value.filter(t => t.category === 'Venta Productos').forEach(t => {
    // Description format: Venta: Nombre del Producto xCantidad
    const match = t.description.match(/Venta: (.+) x(\d+)/);
    if (match && match[1] && match[2]) {
      const name = match[1];
      const qty = parseInt(match[2], 10);
      productSales.set(name, (productSales.get(name) || 0) + qty);
    }
  });

  return Array.from(productSales.entries())
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);
});

const tableUsage = computed(() => {
  const filtered = filteredTransactions.value;
  const billiardIncome = filtered.filter(t => t.category === 'Alquiler Billar').reduce((sum, t) => sum + t.amount, 0);
  const pokerIncome = filtered.filter(t => t.category === 'Alquiler Poker').reduce((sum, t) => sum + t.amount, 0);
  
  const bRate = tableStore.settings?.billiardRate || 15;
  const pRate = tableStore.settings?.pokerRate || 10;
  
  const billiardHours = billiardIncome / bRate;
  
  // Poker income is dependent on people, but we can estimate total "table-hours" if we assume 1 person for simplicity, 
  // or we can just show the total income / base rate as an abstract "usage metric".
  // Actually, since we don't have the exact number of people in the finance record, we'll estimate based on average 2 people.
  const pokerHours = pokerIncome / (pRate * 2); 
  
  const totalSessions = filtered.filter(t => t.category.includes('Alquiler')).length;
  const avgSession = totalSessions > 0 ? ((billiardHours + pokerHours) / totalSessions) : 0;

  return {
    billiardHours: billiardHours.toFixed(1),
    pokerHours: pokerHours.toFixed(1),
    avgSession: avgSession.toFixed(1)
  };
});

const exportExcel = () => {
  const dataToExport = filteredTransactions.value.map(t => ({
    'ID': t.id,
    'Fecha': format(parseISO(t.date), 'dd/MM/yyyy HH:mm'),
    'Tipo': t.type === 'income' ? 'Ingreso' : 'Egreso',
    'Categoría': t.category,
    'Descripción': t.description,
    'Monto (S/)': t.amount.toFixed(2),
    'Método de Pago': t.paymentMethod ? t.paymentMethod.toUpperCase() : 'N/A'
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transacciones');
  
  // Generar y descargar
  XLSX.writeFile(workbook, `Malafama_Reporte_${dateRange.value}_Dias.xlsx`);
};

const exportPDF = () => {
  alert('Exportando a PDF... (Funcionalidad mock)');
};
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-white flex items-center">
          <BarChart3 class="w-8 h-8 mr-3 text-accent" />
          Reportes y Análisis
        </h1>
        <p class="text-customText-muted">Visualiza el rendimiento del negocio en el tiempo.</p>
      </div>
      <div class="flex items-center space-x-2">
        <button @click="exportExcel" class="btn btn-secondary flex items-center space-x-2">
          <Download class="w-4 h-4" />
          <span>Excel</span>
        </button>
        <button @click="exportPDF" class="btn btn-primary flex items-center space-x-2">
          <Download class="w-4 h-4" />
          <span>PDF</span>
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="card p-4 flex flex-col md:flex-row items-center gap-6">
      <div class="flex items-center space-x-3 text-customText-muted">
        <Filter class="w-5 h-5" />
        <span class="font-medium">Filtrar por periodo:</span>
      </div>
      <div class="flex flex-1 items-center space-x-2 bg-dark-900 p-1 rounded-xl border border-dark-700 w-full md:w-auto">
        <button 
          v-for="range in [{l:'Hoy', v:'0'}, {l:'7 Días', v:'7'}, {l:'30 Días', v:'30'}, {l:'Este Mes', v:'31'}]" 
          :key="range.v"
          @click="dateRange = range.v"
          :class="['flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all', dateRange === range.v ? 'bg-accent text-white' : 'text-customText-muted hover:text-white']"
        >{{ range.l }}</button>
      </div>
      <div class="flex items-center space-x-2 text-customText-muted italic text-sm">
        <Calendar class="w-4 h-4" />
        <span>Desde {{ format(reportData.startCurrent, "d 'de' MMMM", { locale: es }) }}</span>
      </div>
    </div>

    <!-- Stats Summary -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="card p-8 text-center space-y-2">
        <p class="text-customText-muted uppercase text-xs font-bold tracking-widest">Ingresos Totales</p>
        <p class="text-4xl font-extrabold text-white">S/ {{ reportData.income.toFixed(2) }}</p>
        <div :class="['flex items-center justify-center text-sm', reportData.incomeChange >= 0 ? 'text-green-400' : 'text-red-400']">
          <TrendingUp v-if="reportData.incomeChange >= 0" class="w-4 h-4 mr-1" />
          <TrendingDown v-else class="w-4 h-4 mr-1" />
          <span>{{ reportData.incomeChange > 0 ? '+' : '' }}{{ reportData.incomeChange.toFixed(1) }}% vs periodo ant.</span>
        </div>
      </div>
      <div class="card p-8 text-center space-y-2">
        <p class="text-customText-muted uppercase text-xs font-bold tracking-widest">Egresos Totales</p>
        <p class="text-4xl font-extrabold text-white">S/ {{ reportData.expenses.toFixed(2) }}</p>
        <div :class="['flex items-center justify-center text-sm', reportData.expensesChange <= 0 ? 'text-green-400' : 'text-red-400']">
          <TrendingDown v-if="reportData.expensesChange <= 0" class="w-4 h-4 mr-1" />
          <TrendingUp v-else class="w-4 h-4 mr-1" />
          <span>{{ reportData.expensesChange > 0 ? '+' : '' }}{{ reportData.expensesChange.toFixed(1) }}% vs periodo ant.</span>
        </div>
      </div>
      <div class="card p-8 text-center space-y-2 border-accent/30 bg-accent/5">
        <p class="text-customText-muted uppercase text-xs font-bold tracking-widest">Utilidad Neta</p>
        <p class="text-4xl font-extrabold text-accent">S/ {{ reportData.profit.toFixed(2) }}</p>
        <div class="flex items-center justify-center text-accent text-sm font-bold">
          <Sparkles class="w-4 h-4 mr-1" />
          <span>Rendimiento Óptimo</span>
        </div>
      </div>
    </div>

    <!-- More Details -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="card p-6">
        <h3 class="font-bold text-lg mb-6">Productos Más Vendidos</h3>
        <div class="space-y-4">
          <div v-for="(product, i) in topProducts" :key="product.name" class="flex items-center justify-between p-3 bg-dark-900/30 rounded-xl border border-dark-700/50">
            <div class="flex items-center space-x-3">
              <span class="w-6 h-6 rounded-full bg-dark-700 flex items-center justify-center text-xs font-bold text-accent">{{ i + 1 }}</span>
              <span class="text-white font-medium">{{ product.name }}</span>
            </div>
            <span class="text-customText-muted text-sm font-bold">{{ product.quantity }} Unidades</span>
          </div>
          <div v-if="topProducts.length === 0" class="text-center py-4 text-customText-muted italic">
            No hay ventas registradas en este periodo.
          </div>
        </div>
      </div>

      <div class="card p-6">
        <h3 class="font-bold text-lg mb-6">Uso de Mesas (Estimado)</h3>
        <div class="space-y-4">
          <div class="flex items-center justify-between p-3 bg-dark-900/30 rounded-xl border border-dark-700/50">
            <span class="text-white font-medium">Mesas de Billar (Total Horas)</span>
            <span class="text-accent font-bold">{{ tableUsage.billiardHours }} hrs</span>
          </div>
          <div class="flex items-center justify-between p-3 bg-dark-900/30 rounded-xl border border-dark-700/50">
            <span class="text-white font-medium">Mesas de Poker (Total Horas)</span>
            <span class="text-accent font-bold">{{ tableUsage.pokerHours }} hrs</span>
          </div>
          <div class="flex items-center justify-between p-3 bg-dark-900/30 rounded-xl border border-dark-700/50">
            <span class="text-white font-medium">Promedio por Sesión</span>
            <span class="text-customText-muted font-bold">{{ tableUsage.avgSession }} hrs</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
