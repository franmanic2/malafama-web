<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useDebtStore, type Debt } from '../stores/debt';
import { UsersRound, Plus, Phone, Wallet, CheckCircle, Clock, Search } from 'lucide-vue-next';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const debtStore = useDebtStore();
const searchQuery = ref('');
const showAddModal = ref(false);
const showPaymentModal = ref(false);
const selectedDebt = ref<Debt | null>(null);
const paymentMethod = ref<'cash' | 'yape'>('cash');

const debtForm = ref({
  clientName: '',
  phone: '',
  amount: 0,
  reason: '',
  date: new Date().toISOString(),
  expectedPaymentDate: ''
});

onMounted(async () => {
  await debtStore.fetchDebts();
});

const filteredDebts = computed(() => {
  return debtStore.debts.filter(d => 
    d.clientName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    d.reason.toLowerCase().includes(searchQuery.value.toLowerCase())
  ).sort((a, b) => b.status === 'pending' ? 1 : -1);
});

const handleAddDebt = async () => {
  await debtStore.addDebt(debtForm.value);
  showAddModal.value = false;
  debtForm.value = {
    clientName: '',
    phone: '',
    amount: 0,
    reason: '',
    date: new Date().toISOString(),
    expectedPaymentDate: ''
  };
};

const openPaymentModal = (debt: Debt) => {
  selectedDebt.value = debt;
  showPaymentModal.value = true;
};

const handlePayment = async () => {
  if (!selectedDebt.value) return;
  await debtStore.payDebt(selectedDebt.value.id, paymentMethod.value);
  showPaymentModal.value = false;
};
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-white flex items-center">
          <UsersRound class="w-8 h-8 mr-3 text-accent" />
          Deudas Pendientes
        </h1>
        <p class="text-customText-muted">Seguimiento de clientes con saldos por pagar.</p>
      </div>
      <button @click="showAddModal = true" class="btn btn-primary flex items-center space-x-2">
        <Plus class="w-5 h-5" />
        <span>Nueva Deuda</span>
      </button>
    </div>

    <!-- Search -->
    <div class="relative">
      <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-dark-700">
        <Search class="w-5 h-5" />
      </span>
      <input 
        v-model="searchQuery"
        type="text" 
        placeholder="Buscar cliente o motivo..." 
        class="input-field pl-10"
      />
    </div>

    <!-- Debt Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="debt in filteredDebts" :key="debt.id" :class="['card p-6 flex flex-col justify-between transition-all', debt.status === 'paid' ? 'opacity-60 grayscale' : 'border-l-4 border-l-yellow-500 shadow-yellow-500/5']">
        <div>
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-white text-lg">{{ debt.clientName }}</h3>
            <span :class="['px-2 py-1 rounded text-[10px] font-bold uppercase', debt.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-green-500/10 text-green-500']">
              {{ debt.status === 'pending' ? 'Pendiente' : 'Pagado' }}
            </span>
          </div>
          
          <div class="space-y-3 mb-6">
            <div class="flex items-center text-sm text-customText-muted">
              <Wallet class="w-4 h-4 mr-2 text-accent" />
              <span>S/ {{ debt.amount.toFixed(2) }}</span>
            </div>
            <div class="flex items-center text-sm text-customText-muted">
              <Clock class="w-4 h-4 mr-2 text-accent" />
              <span>{{ format(parseISO(debt.date), "d 'de' MMM, yyyy", { locale: es }) }}</span>
            </div>
            <div v-if="debt.phone" class="flex items-center text-sm text-customText-muted">
              <Phone class="w-4 h-4 mr-2 text-accent" />
              <span>{{ debt.phone }}</span>
            </div>
            <p class="text-sm bg-dark-900/50 p-3 rounded-lg border border-dark-700 text-white italic">
              "{{ debt.reason }}"
            </p>
          </div>
        </div>

        <button 
          v-if="debt.status === 'pending'"
          @click="openPaymentModal(debt)"
          class="w-full btn btn-secondary hover:bg-green-500/10 hover:text-green-400 hover:border-green-500/50 flex items-center justify-center space-x-2"
        >
          <CheckCircle class="w-4 h-4" />
          <span>Marcar como Pagado</span>
        </button>
      </div>
    </div>

    <div v-if="filteredDebts.length === 0" class="py-20 text-center text-customText-muted">
      <UsersRound class="w-12 h-12 mx-auto mb-4 opacity-20" />
      <p class="italic">No hay deudas registradas.</p>
    </div>

    <!-- Add Modal -->
    <div v-if="showAddModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-dark-900/80 backdrop-blur-sm" @click="showAddModal = false"></div>
      <div class="relative card max-w-lg w-full p-8 space-y-6">
        <h3 class="text-2xl font-bold text-white">Nueva Deuda</h3>
        
        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2">
            <label class="block text-sm font-medium text-customText-muted mb-2">Nombre del Cliente</label>
            <input v-model="debtForm.clientName" type="text" class="input-field" placeholder="Nombre completo" />
          </div>
          <div>
            <label class="block text-sm font-medium text-customText-muted mb-2">Monto Adeudado (S/)</label>
            <input v-model.number="debtForm.amount" type="number" step="0.1" class="input-field" />
          </div>
          <div>
            <label class="block text-sm font-medium text-customText-muted mb-2">Teléfono (Opcional)</label>
            <input v-model="debtForm.phone" type="text" class="input-field" placeholder="987..." />
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-medium text-customText-muted mb-2">Motivo de la Deuda</label>
            <input v-model="debtForm.reason" type="text" class="input-field" placeholder="Ej. Alquiler Mesa 2 + 3 Cervezas" />
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-medium text-customText-muted mb-2">Fecha Estimada de Pago</label>
            <input v-model="debtForm.expectedPaymentDate" type="date" class="input-field" />
          </div>
        </div>
        
        <div class="flex space-x-3 pt-4">
          <button @click="showAddModal = false" class="flex-1 btn btn-secondary">Cancelar</button>
          <button @click="handleAddDebt" class="flex-1 btn btn-primary">Registrar Deuda</button>
        </div>
      </div>
    </div>

    <!-- Payment Modal -->
    <div v-if="showPaymentModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-dark-900/80 backdrop-blur-sm" @click="showPaymentModal = false"></div>
      <div class="relative card max-w-sm w-full p-6 space-y-6">
        <h3 class="text-xl font-bold">Cobrar Deuda</h3>
        <p class="text-customText-muted">Cliente: <span class="text-white font-bold">{{ selectedDebt?.clientName }}</span></p>
        
        <div class="text-center py-4">
          <p class="text-sm text-customText-muted uppercase">Total a Pagar</p>
          <p class="text-4xl font-bold text-green-400">S/ {{ selectedDebt?.amount.toFixed(2) }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-customText-muted mb-2">Método de Pago</label>
          <div class="grid grid-cols-2 gap-2">
            <button @click="paymentMethod = 'cash'" :class="['p-2 rounded-lg border text-sm font-medium transition-all', paymentMethod === 'cash' ? 'bg-accent border-accent text-white' : 'bg-dark-900 border-dark-700 text-customText-muted']">Efectivo</button>
            <button @click="paymentMethod = 'yape'" :class="['p-2 rounded-lg border text-sm font-medium transition-all', paymentMethod === 'yape' ? 'bg-accent border-accent text-white' : 'bg-dark-900 border-dark-700 text-customText-muted']">Yape</button>
          </div>
        </div>

        <button @click="handlePayment" class="w-full btn btn-primary py-3">Confirmar Pago</button>
      </div>
    </div>
  </div>
</template>
