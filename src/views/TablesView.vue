<script setup lang="ts">
import { onMounted, computed, ref } from 'vue';
import { useTableStore } from '../stores/table';
import { useAuthStore } from '../stores/auth';
import TableCard from '../components/TableCard.vue';
import { Dices, Sparkles, Plus, Settings } from 'lucide-vue-next';

const tableStore = useTableStore();
const authStore = useAuthStore();

onMounted(async () => {
  await tableStore.fetchTables();
});

const billiardTables = computed(() => tableStore.tables.filter(t => t.type === 'billiard'));
const pokerTables = computed(() => tableStore.tables.filter(t => t.type === 'poker'));

const showAddModal = ref(false);
const newTable = ref({
  name: '',
  type: 'billiard' as 'billiard' | 'poker'
});

const handleAddTable = async () => {
  if (!newTable.value.name.trim()) return;
  await tableStore.addTable(newTable.value.name, newTable.value.type);
  showAddModal.value = false;
  newTable.value.name = '';
};

const showSettingsModal = ref(false);
const settingsForm = ref({
  billiardRate: 15,
  pokerRate: 10
});

const openSettings = () => {
  settingsForm.value.billiardRate = tableStore.settings?.billiardRate || 15;
  settingsForm.value.pokerRate = tableStore.settings?.pokerRate || 10;
  showSettingsModal.value = true;
};

const handleSaveSettings = async () => {
  await tableStore.updateSettings(settingsForm.value.billiardRate, settingsForm.value.pokerRate);
  showSettingsModal.value = false;
};
</script>

<template>
  <div class="space-y-10">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-white flex items-center">
          <Dices class="w-8 h-8 mr-3 text-accent" />
          Gestión de Mesas
        </h1>
        <p class="text-customText-muted">Control en tiempo real de billar y poker.</p>
      </div>
      <div class="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <div class="flex items-center space-x-2 px-4 py-2 bg-dark-800 rounded-xl border border-dark-700">
          <span class="w-2 h-2 rounded-full bg-green-500"></span>
          <span class="text-sm font-medium">S/ {{ tableStore.settings?.billiardRate?.toFixed(2) }} / hora Billar</span>
        </div>
        <div class="flex items-center space-x-2 px-4 py-2 bg-dark-800 rounded-xl border border-dark-700">
          <span class="w-2 h-2 rounded-full bg-blue-500"></span>
          <span class="text-sm font-medium">S/ {{ tableStore.settings?.pokerRate?.toFixed(2) }} / pers. / hora Poker</span>
        </div>
        <button v-if="authStore.user?.role === 'admin'" @click="openSettings" class="btn btn-secondary flex items-center space-x-2" title="Configurar Precios">
          <Settings class="w-5 h-5" />
        </button>
        <button v-if="authStore.user?.role === 'admin'" @click="showAddModal = true" class="btn btn-primary flex items-center space-x-2 w-full sm:w-auto">
          <Plus class="w-5 h-5" />
          <span>Nueva Mesa</span>
        </button>
      </div>
    </div>

    <!-- Billar Section -->
    <section class="space-y-6">
      <div class="flex items-center space-x-2">
        <Sparkles class="w-5 h-5 text-accent" />
        <h2 class="text-xl font-bold text-white">Mesas de Billar</h2>
        <div class="h-px flex-1 bg-dark-700 ml-4"></div>
      </div>
      
      <div v-if="tableStore.loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
        <div v-for="i in 4" :key="i" class="h-64 bg-dark-800 rounded-xl border border-dark-700"></div>
      </div>
      
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <TableCard v-for="table in billiardTables" :key="table.id" :table="table" />
      </div>
    </section>

    <!-- Poker Section -->
    <section class="space-y-6">
      <div class="flex items-center space-x-2">
        <Sparkles class="w-5 h-5 text-accent" />
        <h2 class="text-xl font-bold text-white">Mesas de Poker</h2>
        <div class="h-px flex-1 bg-dark-700 ml-4"></div>
      </div>

      <div v-if="tableStore.loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        <div v-for="i in 3" :key="i" class="h-64 bg-dark-800 rounded-xl border border-dark-700"></div>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <TableCard v-for="table in pokerTables" :key="table.id" :table="table" />
      </div>
    </section>

    <!-- Add Table Modal -->
    <div v-if="showAddModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-dark-900/80 backdrop-blur-sm" @click="showAddModal = false"></div>
      <div class="relative card max-w-sm w-full p-6 space-y-6">
        <h3 class="text-xl font-bold">Añadir Nueva Mesa</h3>
        
        <div>
          <label class="block text-sm font-medium text-customText-muted mb-2">Nombre de la Mesa</label>
          <input v-model="newTable.name" type="text" class="input-field" placeholder="Ej. Mesa Billar 5" />
        </div>

        <div>
          <label class="block text-sm font-medium text-customText-muted mb-2">Tipo de Mesa</label>
          <div class="grid grid-cols-2 gap-2">
            <button 
              @click="newTable.type = 'billiard'" 
              :class="['p-2 rounded-lg border text-sm font-medium transition-all', newTable.type === 'billiard' ? 'bg-accent border-accent text-white' : 'bg-dark-900 border-dark-700 text-customText-muted']"
            >Billar</button>
            <button 
              @click="newTable.type = 'poker'" 
              :class="['p-2 rounded-lg border text-sm font-medium transition-all', newTable.type === 'poker' ? 'bg-accent border-accent text-white' : 'bg-dark-900 border-dark-700 text-customText-muted']"
            >Poker</button>
          </div>
        </div>
        
        <div class="flex space-x-3 pt-2">
          <button @click="showAddModal = false" class="flex-1 btn btn-secondary">Cancelar</button>
          <button @click="handleAddTable" class="flex-1 btn btn-primary">Crear Mesa</button>
        </div>
      </div>
    </div>

    <!-- Settings Modal -->
    <div v-if="showSettingsModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-dark-900/80 backdrop-blur-sm" @click="showSettingsModal = false"></div>
      <div class="relative card max-w-sm w-full p-6 space-y-6">
        <h3 class="text-xl font-bold flex items-center">
          <Settings class="w-5 h-5 mr-2 text-accent" />
          Configurar Precios
        </h3>
        
        <div>
          <label class="block text-sm font-medium text-customText-muted mb-2">Costo Billar (S/ por hora)</label>
          <input v-model.number="settingsForm.billiardRate" type="number" step="0.5" class="input-field" />
        </div>

        <div>
          <label class="block text-sm font-medium text-customText-muted mb-2">Costo Poker (S/ por pers/hora)</label>
          <input v-model.number="settingsForm.pokerRate" type="number" step="0.5" class="input-field" />
        </div>
        
        <div class="flex space-x-3 pt-2">
          <button @click="showSettingsModal = false" class="flex-1 btn btn-secondary">Cancelar</button>
          <button @click="handleSaveSettings" class="flex-1 btn btn-primary">Guardar</button>
        </div>
      </div>
    </div>
  </div>
</template>
