<template>
  <div class="notifications-wrapper">
    <NavBar title="消息中心" :links="navLinks" />
    
    <div class="content-container">
      <div class="max-w-4xl mx-auto py-8 px-4">
        <GlassCard title="系统通知">
          <div v-if="loading" class="flex justify-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
          
          <div v-else-if="notifications.length === 0" class="empty-state">
            <div class="empty-icon">📭</div>
            <h3>暂无通知</h3>
            <p>您的消息中心干干净洁</p>
          </div>
          
          <div v-else class="notification-list">
            <div 
              v-for="notice in notifications" 
              :key="notice.id" 
              class="notification-item"
              :class="{ unread: !notice.isRead }"
              @click="handleRead(notice)"
            >
              <div class="flex justify-between items-start mb-2">
                <div class="flex items-center gap-3">
                  <span class="type-badge" :class="notice.type?.toLowerCase() || 'info'">
                    {{ formatType(notice.type) }}
                  </span>
                  <h4 class="notice-title">{{ notice.title }}</h4>
                </div>
                <span class="notice-time">{{ formatDate(notice.createTime) }}</span>
              </div>
              <p class="notice-content">{{ notice.content }}</p>
              <div v-if="!notice.isRead" class="unread-dot"></div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import NavBar from '../../components/NavBar.vue'
import GlassCard from '../../components/GlassCard.vue'
import request from '../../utils/request'

const navLinks = [
  { name: '返回主页', path: '/student/home' },
  { name: '个人中心', path: '/student/profile' }
]

const notifications = ref([])
const loading = ref(true)

const fetchNotifications = async () => {
  loading.value = true
  try {
    const res = await request.get('/student/notification/my')
    if (res.code === 200) {
      notifications.value = res.data || []
    }
  } catch (e) {
    console.error('Failed to fetch notifications', e)
  } finally {
    loading.value = false
  }
}

const handleRead = async (notice) => {
  if (notice.isRead) return
  try {
    const res = await request.put(`/student/notification/read/${notice.id}`)
    if (res.code === 200) {
      notice.isRead = true
    }
  } catch (e) {
    console.error(e)
  }
}

const formatType = (type) => {
  switch (type) {
    case 'SUCCESS': return '成功'
    case 'ERROR': return '处罚'
    case 'WARNING': return '预警'
    case 'INFO': return '系统'
    default: return '消息'
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

onMounted(() => {
  fetchNotifications()
})
</script>

<style scoped>
.notifications-wrapper {
  min-height: 100vh;
  background: transparent;
}

.content-container {
  padding-top: 20px;
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.notification-item {
  position: relative;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 18px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.notification-item:hover {
  transform: translateY(-2px) scale(1.01);
  background: rgba(255, 255, 255, 0.6);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
}

.notification-item.unread {
  background: rgba(255, 255, 255, 0.8);
  border-left: 4px solid var(--primary);
}

.type-badge {
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.type-badge.success { background: #dcfce7; color: #166534; }
.type-badge.error { background: #fee2e2; color: #991b1b; }
.type-badge.warning { background: #fef9c3; color: #854d0e; }
.type-badge.info { background: #e0f2fe; color: #075985; }

.notice-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
}

.notice-time {
  font-size: 0.8rem;
  color: #94a3b8;
}

.notice-content {
  color: #475569;
  font-size: 0.95rem;
  line-height: 1.5;
}

.unread-dot {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
}

.empty-state {
  text-align: center;
  padding: 60px 0;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.empty-state h3 {
  color: #64748b;
  margin-bottom: 5px;
}

.empty-state p {
  color: #94a3b8;
}
</style>
