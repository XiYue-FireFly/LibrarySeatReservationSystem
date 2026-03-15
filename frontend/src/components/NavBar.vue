<template>
  <nav class="glass-panel navbar">
    <div class="navbar-brand">
      <h2>{{ title }}</h2>
    </div>
    <div class="navbar-menu">
      <router-link v-for="link in links" :key="link.path" :to="link.path" class="nav-link">
        {{ link.name }}
      </router-link>
    </div>
    <div class="navbar-user">
      <div v-if="user" class="user-info">
        <img v-if="user.avatar" :src="user.avatar" class="avatar" alt="avatar" />
        <div v-else class="avatar-placeholder">{{ user.userName?.charAt(0) || 'U' }}</div>
        <span class="username">{{ user.userName || user.name }}</span>
        <button @click="logout" class="glass-button danger" style="padding: 6px 12px; font-size: 0.85rem; margin-left: 15px;">
          登出
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  title: {
    type: String,
    default: '实验室预约系统'
  },
  links: {
    type: Array,
    default: () => []
  }
})

const router = useRouter()

const user = computed(() => {
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
})

const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  const isStudent = user.value?.role === 'STUDENT'
  router.push(isStudent ? '/student/login' : '/admin/login')
}
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 30px;
  margin: 15px;
  position: sticky;
  top: 15px;
  z-index: 100;
  border-radius: 20px;
}

.navbar-brand h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary);
  text-shadow: 0 2px 4px rgba(255,255,255,0.5);
}

.navbar-menu {
  display: flex;
  gap: 20px;
}

.nav-link {
  text-decoration: none;
  color: var(--text-main);
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.3s;
}

.nav-link:hover, .nav-link.router-link-active {
  background: rgba(255, 255, 255, 0.4);
  color: var(--primary);
}

.navbar-user {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--glass-border);
}

.avatar-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
  border: 2px solid var(--glass-border);
}

.username {
  font-weight: 600;
}
</style>
