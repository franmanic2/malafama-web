<script setup lang="ts">
// Main entry point for the application
</script>

<template>
  <div class="min-h-screen bg-dark-900 font-sans text-customText antialiased">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<style>
/* Global transitions are in main.css */
</style>
