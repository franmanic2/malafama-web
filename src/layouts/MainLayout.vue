<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { 
  LayoutDashboard, 
  Dices, 
  Package, 
  CircleDollarSign, 
  UsersRound, 
  BarChart3, 
  LogOut,
  Menu,
  X
} from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const isSidebarOpen = ref(true);

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Mesas', href: '/tables', icon: Dices },
  { name: 'Inventario', href: '/inventory', icon: Package },
  { name: 'Finanzas', href: '/finance', icon: CircleDollarSign },
  { name: 'Deudas', href: '/debts', icon: UsersRound },
  { name: 'Reportes', href: '/reports', icon: BarChart3 },
];

const logout = () => {
  authStore.logout();
};

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};
</script>

<template>
  <div class="min-h-screen bg-dark-900 flex">
    <!-- Sidebar -->
    <aside 
      :class="[
        'fixed inset-y-0 left-0 z-50 w-64 bg-dark-800 border-r border-dark-700 transition-transform duration-300 transform lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:flex-shrink-0',
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      ]"
    >
      <div class="h-full flex flex-col">
        <!-- Logo -->
        <div class="p-6 flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20">
              <span class="text-white font-bold text-xl">M</span>
            </div>
            <span class="text-2xl font-bold tracking-wider text-white">MALAFAMA</span>
          </div>
          <button @click="toggleSidebar" class="lg:hidden text-customText-muted hover:text-white">
            <X class="w-6 h-6" />
          </button>
        </div>

        <!-- Nav -->
        <nav class="flex-1 overflow-y-auto px-4 space-y-2 mt-4">
          <router-link 
            v-for="item in navigation" 
            :key="item.name" 
            :to="item.href"
            :class="[
              'flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group',
              route.path === item.href 
                ? 'bg-accent text-white shadow-lg shadow-accent/20' 
                : 'text-customText-muted hover:bg-dark-700 hover:text-white'
            ]"
          >
            <component :is="item.icon" class="w-5 h-5" />
            <span class="font-medium">{{ item.name }}</span>
          </router-link>
        </nav>

        <!-- User & Logout -->
        <div class="p-4 border-t border-dark-700">
          <div class="flex items-center p-3 rounded-xl bg-dark-900/50 mb-4">
            <div class="w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center text-accent font-bold">
              {{ authStore.user?.name.charAt(0) }}
            </div>
            <div class="ml-3 overflow-hidden">
              <p class="text-sm font-medium text-white truncate">{{ authStore.user?.name }}</p>
              <p class="text-xs text-customText-muted truncate">Admin</p>
            </div>
          </div>
          <button 
            @click="logout"
            class="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors duration-200"
          >
            <LogOut class="w-5 h-5" />
            <span class="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Topbar (Mobile) -->
      <header class="lg:hidden bg-dark-800 border-b border-dark-700 p-4 flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <span class="text-white font-bold">M</span>
          </div>
          <span class="font-bold text-white">MALAFAMA</span>
        </div>
        <button @click="toggleSidebar" class="text-customText-muted hover:text-white">
          <Menu class="w-6 h-6" />
        </button>
      </header>

      <main class="flex-1 overflow-y-auto p-4 lg:p-8">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<style scoped>
.router-link-active {
  /* Handled by script class binding */
}
</style>
