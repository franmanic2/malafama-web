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

    return {
      totalIncome: income,
      totalExpenses: expenses,
      netProfit: income - expenses,
      cashIncome,
      yapeIncome
    };
  });

  return {
    transactions,
    loading,
    fetchTransactions,
    addExpense,
    summary,
    todayTransactions
  };
});
