<script setup>
import { RouterView } from 'vue-router'
import DynamicBackground from './components/DynamicBackground.vue'
</script>

<template>
  <div id="app-container">
    <!-- Global Dynamic Background -->
    <DynamicBackground />

    <main class="main-content">
      <RouterView v-slot="{ Component, route }">
        <transition name="page-transition" mode="out-in">
          <component :is="Component" :key="route.path" />
        </transition>
      </RouterView>
    </main>
    <!-- Refined Glassmorphism Footer -->
    <footer class="global-footer">
      <div class="footer-content">
        <div class="footer-links">
          <a href="https://beian.miit.gov.cn/" target="_blank" class="icp-link">
            滇ICP备2026003920号-1
          </a>
          <a href="https://www.beian.gov.cn/portal/registerSystemInfo?recordcode=53232302532330" target="_blank" class="police-link">
            <img src="/logo01.6189a29f.png" class="police-icon" >
            滇公网安备53232302532330号
          </a>
        </div>
        <div class="footer-copyright">
          © 2026 图书馆座位预约系统 • 沐雪聆曦保留所有权利 ✨
        </div>
      </div>
    </footer>
  </div>
</template>

<style>
/* Seamless glassmorphism transition */
.page-transition-enter-active,
.page-transition-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-transition-enter-from {
  opacity: 0;
  transform: scale(0.98);
}

.page-transition-leave-to {
  opacity: 0;
  transform: scale(1.02);
}

#app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  position: relative;
  z-index: 1;
}

.global-footer {
  position: relative;
  z-index: 1;
  padding: 30px 0;
  text-align: center;
  background: rgba(2, 6, 23, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.footer-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.footer-links {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.icp-link, .police-link {
  color: #818cf8;
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
  opacity: 0.8;
}

.icp-link:hover, .police-link:hover {
  opacity: 1;
  color: #c7d2fe;
  text-shadow: 0 0 10px rgba(129, 140, 248, 0.5);
}

.police-icon {
  width: 16px;
  height: 16px;
  margin-right: 6px;
}

.footer-copyright {
  color: #94a3b8;
  font-size: 12px;
  letter-spacing: 0.5px;
}
</style>
