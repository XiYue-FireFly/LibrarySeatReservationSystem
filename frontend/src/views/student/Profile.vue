<template>
  <div>
    <NavBar title="学生端 - 实验室预约系统" :links="navLinks" />
    
    <div class="profile-container">
      <div class="profile-sidebar">
        <GlassCard title="个人信息">
            <div class="user-profile">
              <img :src="user.avatar || 'https://via.placeholder.com/100'" class="profile-avatar" />
              
              <div class="form-group mt-4">
                <label>姓名</label>
                <input type="text" :value="user.name" class="glass-input" disabled />
              </div>
              <div class="form-group mt-4">
                <label>学号</label>
                <input type="text" :value="user.account" class="glass-input" disabled />
              </div>
              <div class="form-group mt-4">
                <label>用户名 (可修改)</label>
                <input v-model="editUserName" type="text" class="glass-input" />
              </div>

              <!-- Avatar Selection -->
              <div class="form-group mt-4">
                <label>修改头像</label>
                <div class="avatar-selector">
                  <div v-for="a in presets" :key="a" 
                    class="avatar-item" 
                    :class="{ active: editAvatar === a }"
                    @click="selectAvatar(a)">
                    <img :src="a" />
                  </div>
                  <div class="avatar-item upload-box" 
                    :class="{ uploading: uploading }"
                    @click="triggerFileUpload">
                    <span v-if="!uploading">📤</span>
                    <span v-else class="upload-spinner"></span>
                  </div>
                  <input type="file" ref="fileInput" @change="handleFileUpload" accept="image/*" style="display: none;" />
                  
                  <div class="avatar-item custom-trigger" 
                    :class="{ active: showCustomUrl }"
                    @click="toggleCustomUrl">
                    <span>🔗</span>
                  </div>
                </div>
                
                <div v-if="showCustomUrl" class="custom-url-box mt-2">
                  <input v-model="customUrl" @input="debouncedCustomAvatar" type="text" class="glass-input sm" placeholder="输入头像 URL" />
                </div>
              </div>

              <button @click="updateProfile" class="glass-button w-full mt-6">保存修改</button>
            </div>
        </GlassCard>
      </div>

      <div class="profile-main">
        <GlassCard title="我的预约记录">
          <template #header>
            <div class="flex justify-between items-center">
              <h3 class="card-title">我的预约记录</h3>
              <div class="flex" style="gap: 10px;">
                <button class="glass-button danger" @click="openCancelModal(selectedBooks)" :disabled="!hasCancellableSelectedBooks">
                  批量取消
                </button>
                <select v-model="timeFilter" class="glass-input" style="width: auto; padding: 6px 12px;">
                  <option value="ALL">全部时间</option>
                  <option value="7D">近7天</option>
                  <option value="30D">近30天</option>
                </select>
              </div>
            </div>
          </template>

          <!-- Status Filter Tabs -->
          <div class="status-tabs">
            <button
              v-for="tab in statusTabs"
              :key="tab.value"
              :class="['status-tab', { active: statusFilter === tab.value }]"
              @click="statusFilter = tab.value"
            >
              {{ tab.label }}
              <span class="tab-count">{{ getTabCount(tab.value) }}</span>
            </button>
          </div>

          <div v-if="loadingBooks" class="loading">加载中...</div>
          <div v-if="!loadingBooks && filteredBooks.length === 0" class="empty-state">
            暂无{{ statusFilter === 'ALL' ? '' : formatStatus(statusFilter) + '的' }}预约记录
          </div>
          
          <div class="books-grid" v-if="!loadingBooks && filteredBooks.length > 0">
            <div v-for="book in filteredBooks" :key="book.id" class="book-card glass-panel flex-col">
              <div class="book-header flex justify-between">
                <label>
                  <input type="checkbox" :value="book.id" v-model="selectedBooks" />
                  <strong class="ml-2">实验室 {{ book.labId }} / 座位 {{ book.seatId }}</strong>
                </label>
                <span class="status-badge" :class="(book.status || '').toLowerCase()">
                  {{ formatStatus(book.status) }}
                </span>
              </div>
              <div class="book-body mt-2">
                <p><strong>预约人:</strong> {{ user.name }} ({{ user.account }})</p>
                <p><strong>开始:</strong> {{ book.bookStartTime }}</p>
                <p><strong>结束:</strong> {{ book.bookEndTime }}</p>
              </div>
              <div class="book-footer mt-4 flex justify-between">
                <button v-if="book.status === 'FINISHED'" class="glass-button" style="padding: 4px 8px; font-size: 0.8rem;" @click="openFeedback(book)">
                  座位反馈
                </button>
                <button 
                  class="glass-button danger" 
                  style="padding: 4px 8px; font-size: 0.8rem;"
                  v-if="book.status === 'PENDING'"
                  @click="openCancelModal([book.id])"
                >
                  取消预约
                </button>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
    
    <!-- Cancel Confirm Modal -->
    <div v-if="showCancelModal" class="modal-overlay" @click.self="showCancelModal = false">
      <div class="profile-modal">
        <h3>&#x2757; 确认取消预约</h3>
        <p class="mt-2">确定要取消选中的 <strong>{{ cancelTarget.length }}</strong> 个预约吗？</p>
        <p class="mt-1" style="color: #64748b; font-size: 0.9rem;">取消后座位将自动释放，不可撤销。</p>
        <div class="flex justify-between mt-6">
          <button class="glass-button" style="background:var(--text-muted);" @click="showCancelModal = false">返回</button>
          <button class="glass-button danger" @click="confirmCancel()">确定取消</button>
        </div>
      </div>
    </div>

    <!-- Feedback Modal -->
    <div v-if="showFeedbackModal" class="modal-overlay" @click.self="showFeedbackModal = false">
      <div class="profile-modal">
        <h3>&#x1F4DD; 座位反馈</h3>
        <div class="form-group mt-4">
          <label>实验室 ID</label>
          <input type="text" :value="feedbackForm.labId" class="glass-input mt-1" disabled />
        </div>
        <div class="form-group mt-2">
          <label>座位 ID</label>
          <input type="text" :value="feedbackForm.seatId" class="glass-input mt-1" disabled />
        </div>
        <div class="form-group mt-4">
          <label>反馈类型</label>
          <select v-model="feedbackForm.type" class="glass-input mt-1">
            <option value="BROKEN">座位故障</option>
            <option value="LOST">遗失物品</option>
            <option value="OTHER">其他</option>
          </select>
        </div>
        <div class="form-group mt-4">
          <label>问题描述 (≥10字) <small style="color: #94a3b8">已输入 {{ feedbackForm.description.length }} 字</small></label>
          <textarea v-model="feedbackForm.description" class="glass-input mt-1" rows="4" placeholder="请详细描述问题..."></textarea>
        </div>
        <div class="flex justify-between mt-4">
          <button class="glass-button" style="background: var(--text-muted);" @click="showFeedbackModal = false">取消</button>
          <button class="glass-button" @click="submitFeedback">提交反馈</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import NavBar from '../../components/NavBar.vue'
import GlassCard from '../../components/GlassCard.vue'
import request from '../../utils/request'

const navLinks = [
  { name: '预约座位', path: '/student/home' },
  { name: '个人中心', path: '/student/profile' }
]

const user = ref(JSON.parse(localStorage.getItem('user') || '{}'))
const editUserName = ref(user.value.userName)
const editAvatar = ref(user.value.avatar)

const presets = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Max',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Buddy',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Lilly',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jasper'
]

const showCustomUrl = ref(false)
const customUrl = ref('')

const selectAvatar = (url) => {
  editAvatar.value = url
  showCustomUrl.value = false
}

const fileInput = ref(null)
const uploading = ref(false)

const triggerFileUpload = () => {
  if (uploading.value) return
  fileInput.value.click()
}

const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  if (file.size > 2 * 1024 * 1024) {
    alert('文件大小不能超过 2MB')
    return
  }

  const formData = new FormData()
  formData.append('file', file)
  
  uploading.value = true
  try {
    const res = await request.post('/common/upload/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    if (res.code === 200) {
      editAvatar.value = res.data
      showCustomUrl.value = false
    } else {
      alert(res.msg || '上传失败')
    }
  } catch (e) {
    console.error(e)
    alert('上传失败，请检查网络')
  } finally {
    uploading.value = false
  }
}

const toggleCustomUrl = () => {
  showCustomUrl.value = !showCustomUrl.value
}

const debouncedCustomAvatar = () => {
  if (customUrl.value.startsWith('http')) {
    editAvatar.value = customUrl.value
  }
}

const updateProfile = async () => {
  if (editUserName.value.length < 2 || editUserName.value.length > 10) {
    alert('用户名长度需介于2-10之间')
    return
  }
  try {
    const res = await request.put('/student/user/info/update', { 
      userName: editUserName.value,
      avatar: editAvatar.value
    })
    if (res.code === 200) {
      alert('修改成功')
      user.value.userName = editUserName.value
      user.value.avatar = editAvatar.value
      localStorage.setItem('user', JSON.stringify(user.value))
    }
  } catch (e) {
    alert(e.message)
  }
}

// Booking Management
const books = ref([])
const loadingBooks = ref(false)
const selectedBooks = ref([])
const timeFilter = ref('ALL')
const statusFilter = ref('ALL')

const statusTabs = [
  { label: '全部', value: 'ALL' },
  { label: '预约中', value: 'PENDING' },
  { label: '进行中', value: 'CHECKED_IN' },
  { label: '已完成', value: 'FINISHED' },
  { label: '已取消', value: 'CANCELLED' },
]

const getTabCount = (status) => {
  if (status === 'ALL') return books.value.length
  return books.value.filter(b => b.status === status).length
}

const filteredBooks = computed(() => {
  if (statusFilter.value === 'ALL') return books.value
  return books.value.filter(b => b.status === statusFilter.value)
})

const fetchBooks = async () => {
  loadingBooks.value = true
  try {
    const res = await request.get('/student/book/my')
    if (res.code === 200) {
      books.value = res.data || []
      
      // Since backend doesn't support timeRange filter directly at this endpoint
      if (timeFilter.value !== 'ALL') {
        const days = timeFilter.value === '7D' ? 7 : 30
        const limitDate = new Date()
        limitDate.setDate(limitDate.getDate() - days)
        books.value = books.value.filter(b => new Date(b.createTime || b.bookStartTime) >= limitDate)
      }
    }
  } catch (e) {
    console.error(e)
  } finally {
    loadingBooks.value = false
  }
}

watch(timeFilter, () => {
  fetchBooks()
})

const formatStatus = (s) => {
  const map = {
    'PENDING': '待签到',
    'CHECKED_IN': '已签到',
    'FINISHED': '已结束',
    'CANCELLED': '已取消'
  }
  return map[s] || s
}

const hasCancellableSelectedBooks = computed(() => {
  return selectedBooks.value.some(id => {
    const book = books.value.find(b => b.id === id);
    return book && book.status === 'PENDING';
  });
});

// Cancel booking - Vue modal (avoids window.confirm blocking)
const showCancelModal = ref(false)
const cancelTarget = ref([])

const openCancelModal = (bookIds) => {
  const cancellableBookIds = bookIds.filter(id => {
    const book = books.value.find(b => b.id === id);
    return book && book.status === 'PENDING';
  });

  if (cancellableBookIds.length === 0) {
    if (bookIds.length > 0) {
      alert('选中的预约已处于进行中或已完成状态，无法取消。')
    } else {
      alert('请先勾选要取消的预约')
    }
    return
  }
  cancelTarget.value = cancellableBookIds
  showCancelModal.value = true
}

const confirmCancel = async () => {
  try {
    const res = await request.post('/student/book/cancel', cancelTarget.value)
    if (res.code === 200) {
      alert(res.msg || '取消成功！座位已释放。')
      showCancelModal.value = false
      selectedBooks.value = []
      fetchBooks()
    } else {
      alert(res.msg || '取消失败')
    }
  } catch (e) {
    alert(e.message || '系统错误')
  }
}

// Feedback Modal
const showFeedbackModal = ref(false)
const feedbackForm = ref({
  bookId: null,
  labId: null,
  seatId: null,
  type: 'BROKEN',
  description: ''
})

const openFeedback = (book) => {
  feedbackForm.value = {
    bookId: book.id,       // BookRecord uses 'id' not 'bookId'
    labId: book.labId,
    seatId: book.seatId,
    type: 'BROKEN',
    description: ''
  }
  showFeedbackModal.value = true
}

const submitFeedback = async () => {
  if (feedbackForm.value.description.length < 10) {
    alert('描述至少填写10个字')
    return
  }
  try {
    const res = await request.post('/student/feedback/submit', {
      bookId: feedbackForm.value.bookId,
      labId: feedbackForm.value.labId,
      seatId: feedbackForm.value.seatId,
      type: feedbackForm.value.type,
      description: feedbackForm.value.description
    })
    if (res.code === 200) {
      alert('反馈提交成功！')
      showFeedbackModal.value = false
    }
  } catch (e) {
    alert(e.message)
  }
}

onMounted(() => {
  fetchBooks()
})
</script>

<style scoped>
.profile-container {
  display: flex;
  gap: 20px;
  padding: 0 30px;
  max-width: 1400px;
  margin: 0 auto;
}

.profile-sidebar {
  width: 350px;
}

.profile-main {
  flex: 1;
}

.user-profile {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.profile-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid var(--glass-border);
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

.w-full {
  width: 100%;
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.book-card {
  padding: 15px;
  display: flex;
  flex-direction: column;
}

.flex-col {
  display: flex;
  flex-direction: column;
}

.ml-2 {
  margin-left: 8px;
}

.status-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
}
.status-badge.pending { background: var(--warning); color: #000; }
.status-badge.checked_in { background: var(--success); color: #fff; }
.status-badge.finished { background: var(--text-muted); color: #fff; }
.status-badge.cancelled { background: var(--danger); color: #fff; }

/* Status Filter Tabs */
.status-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin: 12px 0 16px;
}

.status-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border-radius: 20px;
  border: 2px solid var(--glass-border);
  background: transparent;
  color: var(--text-main);
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.status-tab:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.status-tab.active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
  box-shadow: 0 4px 12px rgba(79,70,229,0.3);
}

.tab-count {
  background: rgba(255,255,255,0.25);
  border-radius: 10px;
  padding: 1px 7px;
  font-size: 0.78rem;
  font-weight: 700;
}

.status-tab.active .tab-count {
  background: rgba(255,255,255,0.3);
}

.book-body p {
  margin: 5px 0;
  font-size: 0.95rem;
  color: var(--text-main);
}

.modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0,0,0,0.45);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.profile-modal {
  background: #fff;
  border-radius: 18px;
  padding: 30px 32px;
  min-width: 380px;
  max-width: 500px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}

.profile-modal h3 {
  font-size: 1.2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
}

/* Avatar Selector Styles */
.avatar-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
}

.avatar-item {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.1);
}

.avatar-item.active {
  border-color: var(--primary);
  transform: scale(1.1);
  box-shadow: 0 0 10px rgba(79,70,229,0.3);
}

.avatar-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-item.upload-box {
  background: rgba(79, 70, 229, 0.05);
  border: 1px dashed var(--primary);
}

.avatar-item.custom-trigger {
  background: rgba(255,255,255,0.2);
  font-size: 1.1rem;
}

.upload-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
