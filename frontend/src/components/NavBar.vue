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
      <!-- Notification Bell -->
      <div v-if="user && user.role === 'STUDENT'" class="notification-bell" @click="router.push('/student/notifications')">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="bell-icon">
          <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.37 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.64 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z" fill="currentColor"/>
        </svg>
        <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
      </div>

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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '../utils/request'

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

const unreadCount = ref(0)
let timer = null

const fetchUnreadCount = async () => {
  if (!user.value || user.value.role !== 'STUDENT') return
  try {
    const res = await request.get('/student/notification/my')
    if (res.code === 200) {
      unreadCount.value = (res.data || []).filter(n => !n.isRead).length
    }
  } catch (e) {}
}

const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  const isStudent = user.value?.role === 'STUDENT'
  router.push(isStudent ? '/student/login' : '/admin/login')
}

onMounted(() => {
  fetchUnreadCount()
  timer = setInterval(fetchUnreadCount, 30000) // Polling every 30s
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
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

.notification-bell {
  position: relative;
  margin-right: 20px;
  cursor: pointer;
  color: #64748b;
  padding: 5px;
  border-radius: 50%;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-bell:hover {
  background: rgba(255, 255, 255, 0.4);
  color: var(--primary);
  transform: scale(1.1);
}

.bell-icon {
  width: 24px;
  height: 24px;
}

.badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background: #ef4444;
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
  border: 1px solid white;
}
</style>
