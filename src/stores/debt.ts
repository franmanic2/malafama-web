import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apiService } from '../services/api.service';

export interface Debt {
  id: string;
  clientName: string;
  phone?: string;
  amount: number;
  reason: string;
  date: string;
  expectedPaymentDate?: string;
  status: 'pending' | 'paid';
}

export const useDebtStore = defineStore('debts', () => {
  const debts = ref<Debt[]>([]);
  const loading = ref(false);

  let unsubscribeDebts: (() => void) | null = null;

  async function fetchDebts() {
    if (unsubscribeDebts) return;
    loading.value = true;
    unsubscribeDebts = apiService.subscribe<Debt>('debts', (data) => {
      debts.value = data;
      loading.value = false;
    });
  }

  async function addDebt(debt: Omit<Debt, 'id' | 'status'>) {
    const existingDebt = debts.value.find(d => 
      d.clientName.toLowerCase() === debt.clientName.toLowerCase() && 
      d.status === 'pending'
    );
    
    if (existingDebt) {
      const updated = await apiService.update<Debt>('debts', existingDebt.id, {
        amount: existingDebt.amount + debt.amount,
        reason: `${existingDebt.reason} + ${debt.reason}`
      });
      const index = debts.value.findIndex(d => d.id === existingDebt.id);
      if (index !== -1 && updated) debts.value[index] = updated;
    } else {
      const newDebt = await apiService.create<Debt>('debts', {
        ...debt,
        id: Date.now().toString(),
        status: 'pending'
      });
      debts.value.push(newDebt);
    }
  }

  async function payDebt(id: string, paymentMethod: 'cash' | 'yape') {
    const debt = debts.value.find(d => d.id === id);
    if (!debt) return;

    await apiService.update('debts', id, { status: 'paid' });
    
    // Add to finance as income
    await apiService.create('finance', {
      id: Date.now().toString(),
      type: 'income',
      category: 'Pago Deuda',
      amount: debt.amount,
      date: new Date().toISOString(),
      paymentMethod,
      description: `Pago deuda de ${debt.clientName}: ${debt.reason}`
    });

    await fetchDebts();
  }

  return {
    debts,
    loading,
    fetchDebts,
    addDebt,
    payDebt
  };
});
