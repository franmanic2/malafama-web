<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { LogIn, Lock, User } from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();

const username = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

const handleLogin = async () => {
  error.value = '';
  loading.value = true;
  try {
    await authStore.login(username.value, password.value);
    router.push('/');
  } catch (err: any) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-dark-900 flex items-center justify-center p-4">
    <div class="max-w-md w-full">
      <!-- Logo Area -->
      <div class="text-center mb-10">
        <div class="inline-flex items-center justify-center w-20 h-20 bg-accent rounded-3xl shadow-2xl shadow-accent/40 mb-6 animate-pulse">
          <span class="text-white text-4xl font-bold">M</span>
        </div>
        <h1 class="text-4xl font-extrabold text-white tracking-tight mb-2">MALAFAMA</h1>
        <p class="text-customText-muted">Panel Administrativo</p>
      </div>

      <!-- Login Card -->
      <div class="card p-8 backdrop-blur-xl bg-dark-800/80 border-dark-700/50">
        <form @submit.prevent="handleLogin" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-customText-muted mb-2">Usuario</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-dark-700">
                <User class="w-5 h-5" />
              </span>
              <input 
                v-model="username"
                type="text" 
                required
                class="input-field pl-10"
                placeholder="admin"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-customText-muted mb-2">Contraseña</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-dark-700">
                <Lock class="w-5 h-5" />
              </span>
              <input 
                v-model="password"
                type="password" 
                required
                class="input-field pl-10"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div v-if="error" class="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm flex items-center justify-center">
            {{ error }}
          </div>

          <button 
            type="submit" 
            :disabled="loading"
            class="w-full btn btn-primary py-3 flex items-center justify-center space-x-2"
          >
            <LogIn v-if="!loading" class="w-5 h-5" />
            <span v-else class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            <span>{{ loading ? 'Iniciando sesión...' : 'Ingresar' }}</span>
          </button>
        </form>
      </div>

      <!-- Footer -->
      <p class="mt-8 text-center text-sm text-customText-muted">
        © 2024 MALAFAMA Billar & Poker
      </p>
    </div>
  </div>
</template>
