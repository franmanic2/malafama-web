import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { apiService } from '../services/api.service';
import { format } from 'date-fns';
import { useDebtStore } from './debt';

export interface Table {
  id: string;
  name: string;
  type: 'billiard' | 'poker';
  status: 'available' | 'occupied' | 'maintenance';
  currentRentalId: string | null;
}

export interface Rental {
  id: string;
  tableId: string;
  startTime: string;
  endTime: string | null;
  numPeople?: number;
  fixedHours?: number;
  totalAmount: number;
  paymentMethod: 'cash' | 'yape' | 'debt' | null;
  status: 'active' | 'completed';
}

export interface Settings {
  id: string;
  billiardRate: number;
  pokerRate: number;
}

export const useTableStore = defineStore('tables', () => {
  const tables = ref<Table[]>([]);
  const rentals = ref<Rental[]>([]);
  const settings = ref<Settings>({ id: '1', billiardRate: 15, pokerRate: 10 });
  const loading = ref(false);

  async function fetchTables() {
    loading.value = true;
    try {
      const [tData, sData, rData] = await Promise.all([
        apiService.getAll<Table>('tables'),
        apiService.getAll<Settings>('settings'),
        apiService.getAll<Rental>('rentals')
      ]);
      tables.value = tData;
      if (sData && sData[0]) settings.value = sData[0];
      rentals.value = rData;
    } finally {
      loading.value = false;
    }
  }

  async function updateSettings(billiardRate: number, pokerRate: number) {
    const updated = await apiService.update<Settings>('settings', settings.value.id, {
      billiardRate,
      pokerRate
    });
    if (updated) settings.value = updated;
  }

  async function startRental(tableId: string, numPeople?: number, fixedHours?: number) {
    const rental: Rental = {
      id: Date.now().toString(),
      tableId,
      startTime: new Date().toISOString(),
      endTime: null,
      numPeople,
      fixedHours,
      totalAmount: 0,
      paymentMethod: null,
      status: 'active'
    };

    const newRental = await apiService.create<Rental>('rentals', rental);
    rentals.value.push(newRental);

    await apiService.update('tables', tableId, {
      status: 'occupied',
      currentRentalId: newRental.id
    });

    await fetchTables();
  }

  async function finishRental(tableId: string, paymentMethod: 'cash' | 'yape' | 'debt', totalAmount: number, clientName?: string) {
    const table = tables.value.find(t => t.id === tableId);
    if (!table || !table.currentRentalId) return;

    const endTime = new Date().toISOString();
    
    await apiService.update('rentals', table.currentRentalId, {
      endTime,
      paymentMethod,
      totalAmount,
      status: 'completed'
    });

    await apiService.update('tables', tableId, {
      status: 'available',
      currentRentalId: null
    });

    if (paymentMethod === 'debt' && clientName) {
      const debtStore = useDebtStore();
      await debtStore.addDebt({
        clientName,
        amount: totalAmount,
        reason: `Alquiler ${table.name}`,
        date: endTime
      });
    } else {
      await apiService.create('finance', {
        id: Date.now().toString(),
        type: 'income',
        category: table.type === 'billiard' ? 'Alquiler Billar' : 'Alquiler Poker',
        amount: totalAmount,
        date: endTime,
        paymentMethod,
        description: `Alquiler ${table.name}`
      });
    }

    await fetchTables();
  }

  async function addTable(name: string, type: 'billiard' | 'poker') {
    const newTable: Table = {
      id: `${type.charAt(0)}${Date.now()}`,
      name,
      type,
      status: 'available',
      currentRentalId: null
    };
    const created = await apiService.create<Table>('tables', newTable);
    tables.value.push(created);
  }

  async function deleteTable(id: string) {
    await apiService.delete('tables', id);
    tables.value = tables.value.filter(t => t.id !== id);
  }

  return {
    tables,
    rentals,
    settings,
    loading,
    fetchTables,
    updateSettings,
    startRental,
    finishRental,
    addTable,
    deleteTable
  };
});
