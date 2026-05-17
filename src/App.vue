<script setup lang="ts">
import { useAuthStore } from './stores/auth';
const authStore = useAuthStore();
</script>

<template>
  <div class="min-h-screen bg-dark-900 font-sans text-customText antialiased">
    <div v-if="authStore.loadingSession" class="min-h-screen flex items-center justify-center">
      <div class="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
    </div>
    <router-view v-else v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<style>
/* Global transitions are in main.css */
</style>
