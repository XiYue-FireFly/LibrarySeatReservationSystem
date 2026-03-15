<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <div id="app-container">
    <RouterView v-slot="{ Component, route }">
      <transition name="page-transition" mode="out-in">
        <component :is="Component" :key="route.path" />
      </transition>
    </RouterView>
  </div>
</template>

<style>
/* Seamless glassmorphism transition */
.page-transition-enter-active,
.page-transition-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.page-transition-enter-from {
  opacity: 0;
  transform: translateY(15px) scale(0.98);
  filter: blur(8px);
}

.page-transition-leave-to {
  opacity: 0;
  transform: translateY(-15px) scale(0.98);
  filter: blur(8px);
}

#app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
