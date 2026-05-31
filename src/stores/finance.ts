import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { apiService } from '../services/api.service';
import { isSameDay, parseISO } from 'date-fns';

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  date: string;
  paymentMethod: 'cash' | 'yape' | 'debt';
  description: string;
}

export const useFinanceStore = defineStore('finance', () => {
  const transactions = ref<Transaction[]>([]);
  const loading = ref(false);

  async function fetchTransactions() {
    loading.value = true;
    try {
      transactions.value = await apiService.getAll<Transaction>('finance');
    } finally {
      loading.value = false;
    }
  }

  async function addExpense(expense: Omit<Transaction, 'id' | 'type'>) {
    const newExpense = await apiService.create<Transaction>('finance', {
      ...expense,
      id: Date.now().toString(),
      type: 'expense'
    });
    transactions.value.push(newExpense);
  }

  const todayTransactions = computed(() => {
    const now = new Date();
    return transactions.value.filter(t => isSameDay(parseISO(t.date), now));
  });

  const summary = computed(() => {
    const income = todayTransactions.value
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = todayTransactions.value
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const cashIncome = todayTransactions.value
      .filter(t => t.type === 'income' && t.paymentMethod === 'cash')
      .reduce((sum, t) => sum + t.amount, 0);

    const yapeIncome = todayTransactions.value
      .filter(t => t.type === 'income' && t.paymentMethod === 'yape')
      .reduce((sum, t) => sum + t.amount, 0);

    const cashExpenses = todayTransactions.value
      .filter(t => t.type === 'expense' && t.paymentMethod === 'cash')
      .reduce((sum, t) => sum + t.amount, 0);

    const yapeExpenses = todayTransactions.value
      .filter(t => t.type === 'expense' && t.paymentMethod === 'yape')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalIncome: income,
      totalExpenses: expenses,
      netProfit: income - expenses,
      cashIncome,
      yapeIncome,
      cashExpenses,
      yapeExpenses
    };
  });

  async function deleteTransaction(id: string) {
    console.log('deleteTransaction called in store for ID:', id);
    const backup = [...transactions.value];
    transactions.value = transactions.value.filter(t => t.id !== id);
    try {
      await apiService.delete('finance', id);
      console.log('Firestore delete complete for ID:', id);
    } catch (err) {
      console.error('Firestore delete failed, rolling back UI state:', err);
      transactions.value = backup;
      throw err;
    }
  }

  return {
    transactions,
    loading,
    fetchTransactions,
    addExpense,
    deleteTransaction,
    summary,
    todayTransactions
  };
});
