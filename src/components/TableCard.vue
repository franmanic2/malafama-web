<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useTableStore, type Table } from '../stores/table';
import { Clock, Users, DollarSign, Play, Square, Settings, Trash2 } from 'lucide-vue-next';
import { differenceInSeconds, parseISO } from 'date-fns';

const props = defineProps<{
  table: Table;
}>();

const tableStore = useTableStore();
const showRentalModal = ref(false);
const showFinishModal = ref(false);
const currentTime = ref(new Date());
let timerInterval: any;

const currentRental = computed(() => {
  return tableStore.rentals.find(r => r.id === props.table.currentRentalId);
});

const elapsedSeconds = computed(() => {
  if (!currentRental.value) return 0;
  return differenceInSeconds(currentTime.value, parseISO(currentRental.value.startTime));
});

const formattedTime = computed(() => {
  let secondsToShow = elapsedSeconds.value;
  
  if (currentRental.value?.fixedHours) {
    const totalSeconds = currentRental.value.fixedHours * 3600;
    secondsToShow = Math.max(0, totalSeconds - elapsedSeconds.value);
  }

  const h = Math.floor(secondsToShow / 3600);
  const m = Math.floor((secondsToShow % 3600) / 60);
  const s = secondsToShow % 60;
  
  const prefix = currentRental.value?.fixedHours && secondsToShow === 0 ? '-' : '';
  return `${prefix}${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
});

const calculatedCost = computed(() => {
  const rate = props.table.type === 'billiard' ? tableStore.settings.billiardRate : tableStore.settings.pokerRate;
  
  if (currentRental.value?.fixedHours) {
    if (props.table.type === 'billiard') {
      return currentRental.value.fixedHours * rate;
    } else {
      const people = currentRental.value?.numPeople || 1;
      return currentRental.value.fixedHours * rate * people;
    }
  }

  if (props.table.type === 'billiard') {
    return (elapsedSeconds.value / 3600) * rate;
  } else {
    const people = currentRental.value?.numPeople || 1;
    return (elapsedSeconds.value / 3600) * rate * people;
  }
});

onMounted(() => {
  timerInterval = setInterval(() => {
    currentTime.value = new Date();
  }, 1000);
});

onUnmounted(() => {
  clearInterval(timerInterval);
});

const numPeople = ref(1);
const paymentMethod = ref<'cash' | 'yape' | 'debt'>('cash');
const debtClientName = ref('');
const isFixedTime = ref(false);
const fixedHours = ref(1);

const handleStart = async () => {
  const hours = isFixedTime.value ? fixedHours.value : undefined;
  await tableStore.startRental(props.table.id, props.table.type === 'poker' ? numPeople.value : undefined, hours);
  showRentalModal.value = false;
  isFixedTime.value = false;
  fixedHours.value = 1;
};

const handleFinish = async () => {
  if (paymentMethod.value === 'debt' && !debtClientName.value.trim()) {
    alert('Por favor ingresa el nombre del cliente para registrar la deuda.');
    return;
  }
  await tableStore.finishRental(props.table.id, paymentMethod.value, calculatedCost.value, debtClientName.value);
  showFinishModal.value = false;
  debtClientName.value = '';
};
</script>

<template>
  <div :class="[
    'card group transition-all duration-300 hover:shadow-2xl hover:shadow-accent/5 overflow-hidden',
    table.status === 'occupied' ? 'border-orange-500/50' : 'border-dark-700'
  ]">
    <!-- Header -->
    <div :class="[
      'p-4 flex items-center justify-between',
      table.status === 'occupied' ? 'bg-orange-500/10' : 'bg-dark-700/30'
    ]">
      <div class="flex items-center space-x-3">
        <div :class="[
          'w-3 h-3 rounded-full animate-pulse',
          table.status === 'available' ? 'bg-green-500' : table.status === 'occupied' ? 'bg-orange-500' : 'bg-gray-500'
        ]"></div>
        <h3 class="font-bold text-white uppercase tracking-wider text-sm">{{ table.name }}</h3>
      </div>
      <div class="flex items-center space-x-2">
        <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-dark-900/50 text-customText-muted uppercase">
          {{ table.type }}
        </span>
        <button 
          v-if="table.status === 'available'" 
          @click="tableStore.deleteTable(table.id)"
          class="text-customText-muted hover:text-red-400 transition-colors"
          title="Eliminar Mesa"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Body -->
    <div class="p-6">
      <div v-if="table.status === 'occupied'" class="space-y-6">
        <div class="text-center">
          <p class="text-xs text-customText-muted uppercase mb-1">{{ currentRental?.fixedHours ? 'Tiempo Restante' : 'Tiempo Transcurrido' }}</p>
          <p class="text-4xl font-mono font-bold text-white">{{ formattedTime }}</p>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-dark-900/50 p-3 rounded-xl border border-dark-700/50">
            <div class="flex items-center text-xs text-customText-muted mb-1">
              <DollarSign class="w-3 h-3 mr-1 text-accent" />
              <span>Costo Actual</span>
            </div>
            <p class="font-bold text-white">S/ {{ calculatedCost.toFixed(2) }}</p>
          </div>
          <div v-if="table.type === 'poker'" class="bg-dark-900/50 p-3 rounded-xl border border-dark-700/50">
            <div class="flex items-center text-xs text-customText-muted mb-1">
              <Users class="w-3 h-3 mr-1 text-accent" />
              <span>Personas</span>
            </div>
            <p class="font-bold text-white">{{ currentRental?.numPeople }}</p>
          </div>
          <div v-else class="bg-dark-900/50 p-3 rounded-xl border border-dark-700/50">
            <div class="flex items-center text-xs text-customText-muted mb-1">
              <Clock class="w-3 h-3 mr-1 text-accent" />
              <span>Inicio</span>
            </div>
            <p class="font-bold text-white text-xs">{{ currentRental?.startTime ? new Date(currentRental.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--' }}</p>
          </div>
        </div>

        <button @click="showFinishModal = true" class="w-full btn btn-primary py-3 flex items-center justify-center space-x-2">
          <Square class="w-5 h-5 fill-current" />
          <span>Finalizar Sesión</span>
        </button>
      </div>

      <div v-else class="flex flex-col items-center justify-center py-8 space-y-6">
        <div class="w-20 h-20 rounded-full bg-dark-900 flex items-center justify-center border border-dark-700 group-hover:border-accent/50 transition-colors">
          <Play class="w-8 h-8 text-dark-700 group-hover:text-accent transition-colors ml-1" />
        </div>
        <div class="text-center">
          <p class="text-white font-bold">Mesa Libre</p>
          <p class="text-sm text-customText-muted">Lista para iniciar</p>
        </div>
        <button @click="showRentalModal = true" class="w-full btn btn-secondary flex items-center justify-center space-x-2">
          <Play class="w-4 h-4 fill-current" />
          <span>Iniciar Alquiler</span>
        </button>
      </div>
    </div>

    <!-- Modals (Simplified for brevity) -->
    <div v-if="showRentalModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-dark-900/80 backdrop-blur-sm" @click="showRentalModal = false"></div>
      <div class="relative card max-w-sm w-full p-6 space-y-6">
        <h3 class="text-xl font-bold">Iniciar {{ table.name }}</h3>
        
        <div v-if="table.type === 'poker'">
          <label class="block text-sm font-medium text-customText-muted mb-2">Número de Personas</label>
          <input v-model="numPeople" type="number" min="1" class="input-field" />
        </div>

        <div>
          <label class="block text-sm font-medium text-customText-muted mb-2">Modalidad de Tiempo</label>
          <div class="grid grid-cols-2 gap-2 mb-3">
            <button 
              @click="isFixedTime = false" 
              :class="['p-2 rounded-lg border text-sm font-medium transition-all', !isFixedTime ? 'bg-accent border-accent text-white' : 'bg-dark-900 border-dark-700 text-customText-muted']"
            >Libre</button>
            <button 
              @click="isFixedTime = true" 
              :class="['p-2 rounded-lg border text-sm font-medium transition-all', isFixedTime ? 'bg-accent border-accent text-white' : 'bg-dark-900 border-dark-700 text-customText-muted']"
            >Fijo</button>
          </div>
          
          <div v-if="isFixedTime">
            <label class="block text-sm font-medium text-customText-muted mb-2">Horas</label>
            <input v-model="fixedHours" type="number" min="1" step="0.5" class="input-field" />
          </div>
        </div>
        
        <div class="flex space-x-3">
          <button @click="showRentalModal = false" class="flex-1 btn btn-secondary">Cancelar</button>
          <button @click="handleStart" class="flex-1 btn btn-primary">Empezar</button>
        </div>
      </div>
    </div>

    <div v-if="showFinishModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-dark-900/80 backdrop-blur-sm" @click="showFinishModal = false"></div>
      <div class="relative card max-w-sm w-full p-6 space-y-6">
        <div class="text-center">
          <h3 class="text-xl font-bold">Finalizar Sesión</h3>
          <p class="text-4xl font-bold text-accent mt-4">S/ {{ calculatedCost.toFixed(2) }}</p>
          <p class="text-sm text-customText-muted mt-1">{{ formattedTime }} transcurridos</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-customText-muted mb-2">Método de Pago</label>
          <div class="grid grid-cols-3 gap-2">
            <button 
              @click="paymentMethod = 'cash'" 
              :class="['p-2 rounded-lg border text-sm font-medium', paymentMethod === 'cash' ? 'bg-accent border-accent text-white' : 'bg-dark-900 border-dark-700 text-customText-muted']"
            >Efectivo</button>
            <button 
              @click="paymentMethod = 'yape'" 
              :class="['p-2 rounded-lg border text-sm font-medium', paymentMethod === 'yape' ? 'bg-accent border-accent text-white' : 'bg-dark-900 border-dark-700 text-customText-muted']"
            >Yape</button>
            <button 
              @click="paymentMethod = 'debt'" 
              :class="['p-2 rounded-lg border text-sm font-medium', paymentMethod === 'debt' ? 'bg-accent border-accent text-white' : 'bg-dark-900 border-dark-700 text-customText-muted']"
            >Deuda</button>
          </div>
        </div>

        <div v-if="paymentMethod === 'debt'">
          <label class="block text-sm font-medium text-customText-muted mb-2">Nombre del Cliente</label>
          <input v-model="debtClientName" type="text" class="input-field" placeholder="Ej. Juan Pérez" />
        </div>

        <button @click="handleFinish" class="w-full btn btn-primary py-3">Confirmar Pago</button>
      </div>
    </div>
  </div>
</template>
