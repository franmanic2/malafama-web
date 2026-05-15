import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

export const useAuthStore = defineStore('auth', () => {
  const getUserFromStorage = () => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error('Error parsing user from localStorage', e);
      return null;
    }
  };
  const user = ref(getUserFromStorage());
  const router = useRouter();

  const isAuthenticated = computed(() => !!user.value);

  async function login(username: string, password: string) {
    // In a real app, we would call the API. Here we mock it.
    if (username === 'admin' && password === 'admin123') {
      const mockUser = { id: '1', username: 'admin', name: 'Administrador' };
      user.value = mockUser;
      localStorage.setItem('user', JSON.stringify(mockUser));
      return true;
    }
    throw new Error('Credenciales incorrectas');
  }

  function logout() {
    user.value = null;
    localStorage.removeItem('user');
    router.push('/login');
  }

  return {
    user,
    isAuthenticated,
    login,
    logout,
  };
});
