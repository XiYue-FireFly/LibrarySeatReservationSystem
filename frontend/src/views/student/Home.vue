<template>
  <div>
    <NavBar title="学生端 - 实验室预约系统" :links="navLinks" />
    
    <div class="content-container">
      <div class="sidebar">
        <GlassCard title="实验室列表">
          <div v-if="loadingLabs" class="loading">加载中...</div>
          <ul v-else class="lab-list">
             <li 
               v-for="lab in labs" 
               :key="lab.id"
               :class="{ active: selectedLab?.id === lab.id, disabled: lab.status === 'UNAVAILABLE' }"
               @click="selectLab(lab)"
             >
                <div class="flex items-center gap-3">
                  <div class="lab-thumbnail" v-if="lab.labImageUrl">
                    <img :src="lab.labImageUrl" alt="lab" />
                  </div>
                  <div class="lab-thumbnail-placeholder" v-else>🏢</div>
                  <div class="flex flex-col">
                    <div class="lab-name">{{ lab.name }}</div>
                    <div class="lab-meta">
                      座位: {{ lab.availableSeats }} / {{ lab.totalSeats }}
                    </div>
                  </div>
                </div>
                <div v-if="lab.status === 'UNAVAILABLE'" class="lab-error">
                  维护中: {{ lab.offlineReason }}
                </div>
              </li>
          </ul>
        </GlassCard>
      </div>

      <div class="main-content">
        <GlassCard :title="selectedLab ? `${selectedLab.name} - 座位图` : '请选择实验室'">
          <div v-if="!selectedLab" class="empty-state">
            暂未选择实验室
          </div>
          <div v-else>
            <!-- Optimized Booking Settings -->
            <div class="booking-settings-v2 bg-white/40 backdrop-blur-md rounded-2xl p-6 border border-white/20 mb-6 shadow-sm">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Date Picker -->
                <div class="flex flex-col gap-2">
                  <label class="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <span class="w-1 h-3 bg-indigo-500 rounded-full"></span> 选择日期
                  </label>
                  <input type="date" v-model="selectedDate" :min="minDateStr" :max="maxDateStr" class="glass-input-new" />
                </div>

                <!-- Start Time Picker -->
                <div class="flex flex-col gap-2">
                  <label class="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <span class="w-1 h-3 bg-indigo-500 rounded-full"></span> 开始时间
                  </label>
                  <select v-model="selectedStartTime" class="glass-select-new">
                    <option v-for="t in availableTimes" :key="t" :value="t">{{ t }}</option>
                    <option v-if="availableTimes.length === 0" disabled>已闭馆</option>
                  </select>
                </div>

                <!-- Duration Picker -->
                <div class="flex flex-col gap-2">
                  <label class="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <span class="w-1 h-3 bg-indigo-500 rounded-full"></span> 预约时长
                  </label>
                  <div class="flex gap-2">
                    <button 
                      v-for="d in [30, 60, 90, 120]" 
                      :key="d" 
                      @click="selectedDuration = d"
                      class="duration-chip"
                      :class="{ active: selectedDuration === d }"
                    >
                      {{ d >= 60 ? (d/60) + 'h' : d + 'm' }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Calculation Status -->
              <div class="mt-6 flex items-center justify-between p-4 rounded-xl bg-slate-50/80 border border-slate-200/50">
                <div class="flex items-center gap-4">
                  <div class="status-icon" :class="{ warning: isCappedAtClosing }">
                    <svg v-if="!isCappedAtClosing" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                    </svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">自动计算结束时间</span>
                    <span class="font-mono font-bold text-slate-700">
                      {{ selectedStartTime || '--:--' }} &rarr; <span :class="{ 'text-amber-600': isCappedAtClosing }">{{ calculatedEndTime || '--:--' }}</span>
                    </span>
                  </div>
                </div>
                <div v-if="isCappedAtClosing" class="text-right">
                  <span class="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded-full">闭馆截断</span>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-between mb-4">
              <div class="seats-legend">
                <div class="legend-item"><span class="seat-cube free"></span> 空闲</div>
                <div class="legend-item"><span class="seat-cube booked"></span> 预约中/使用中</div>
                <div class="legend-item"><span class="seat-cube maintenance"></span> 维护故障</div>
                <div class="legend-item"><span class="seat-cube selected"></span> 已选</div>
              </div>
              <div class="flex gap-2">
                <button class="glass-button secondary-btn" @click="showManagerModal = true">📞 联系负责人</button>
                <button class="glass-button" @click="toggleBatchMode">{{ isBatchMode ? '退出批量' : '批量预约' }}</button>
              </div>
            </div>

            <div v-if="loadingSeats" class="loading mt-4">座位加载中...</div>
            <div v-else class="seat-grid-container mt-4" :style="selectedLab?.labImageUrl ? `background-image: linear-gradient(rgba(241, 245, 249, 0.94), rgba(241, 245, 249, 0.94)), url(${selectedLab.labImageUrl}); background-size: cover; background-position: center;` : ''">
              <div v-if="selectedLab?.labImageUrl" class="lab-bg-image" :style="`background-image: url(${selectedLab.labImageUrl})`"></div>
              
              <!-- Case 1: Custom Row-by-Row Layout -->
              <div v-if="labLayoutConfig" class="custom-rows-wrapper">
                <div v-for="(rowSeats, ri) in computedRowSeats" :key="ri" class="custom-seat-row"
                  :style="`grid-template-columns: repeat(${rowSeats.length}, 1fr);`"
                >
                  <div 
                    v-for="seat in rowSeats" 
                    :key="seat.id"
                    class="seat"
                    :class="[
                      getSeatStatusClass(seat), 
                      { selected: selectedSeats.includes(seat.id) }
                    ]"
                    @click="toggleSeatSelection(seat)"
                    :title="seat.maintenanceReason || `座位号: ${seat.seatNo}`"
                  >
                    <div class="seat-no">{{ seat.seatNo }}</div>
                    <img v-if="seat.userAvatar" :src="seat.userAvatar" class="seat-avatar" />
                    <div v-if="seat.status === 'BOOKED' && !seat.userAvatar" class="seat-avatar-placeholder">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="#a0aec0"/></svg>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Case 2: Uniform Grid Layout -->
              <div v-else class="seat-grid" :style="`grid-template-columns: repeat(${labCols}, 1fr);`">
                <div 
                  v-for="seat in seats" 
                  :key="seat.id"
                  class="seat"
                  :class="[
                    getSeatStatusClass(seat), 
                    { selected: selectedSeats.includes(seat.id) }
                  ]"
                  @click="toggleSeatSelection(seat)"
                  :title="seat.maintenanceReason || `座位号: ${seat.seatNo}`"
                >
                  <div class="seat-no">{{ seat.seatNo }}</div>
                  <img v-if="seat.userAvatar" :src="seat.userAvatar" class="seat-avatar" />
                  
                  <!-- Fallback abstract avatar icon if a user booked it but has no avatar -->
                  <div v-if="seat.status === 'BOOKED' && !seat.userAvatar" class="seat-avatar-placeholder">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="#a0aec0"/></svg>
                    </div>
                </div>
              </div>
            </div>
            
            <div class="booking-action" v-if="selectedSeats.length > 0">
              <div class="selected-info">
                已选择 {{ selectedSeats.length }} 个座位
              </div>
              <button class="glass-button" @click="openBookingModal()">确认预约</button>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>

    <!-- 预约确认弹窗 -->
    <div v-if="showBookingModal" class="booking-modal-overlay" @click.self="showBookingModal = false">
      <div class="booking-modal">
        <h3 class="modal-title">📋 确认预约信息</h3>
        <div class="modal-body">
          <div class="modal-row">
            <span class="modal-label">实验室</span>
            <span class="modal-value">{{ selectedLab?.name }}</span>
          </div>
          <div class="modal-row">
            <span class="modal-label">座位数量</span>
            <span class="modal-value">{{ selectedSeats.length }} 个</span>
          </div>
          <div class="modal-row">
            <span class="modal-label">开始时间</span>
            <span class="modal-value">{{ bookStartTime.replace('T', ' ') }}</span>
          </div>
          <div class="modal-row">
            <span class="modal-label">结束时间</span>
            <span class="modal-value">{{ bookEndTime.replace('T', ' ') }}</span>
          </div>
          <div class="modal-row">
            <span class="modal-label">预约人</span>
            <span class="modal-value">{{ modalUser?.name }} ({{ modalUser?.account }})</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="glass-button" style="background: var(--text-muted);" @click="showBookingModal = false">取消</button>
          <button class="glass-button" :disabled="bookingLoading" @click="confirmBooking()">
            {{ bookingLoading ? '提交中...' : '✅ 确认预约' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 占用者信息弹窗 -->
    <div v-if="showOccupantModal" class="occupant-modal-overlay" @click.self="showOccupantModal = false">
      <div class="occupant-modal glass-card">
        <div class="occupant-avatar-wrapper">
          <img :src="occupantInfo.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=occupant'" />
        </div>
        <h4 class="occupant-name">{{ occupantInfo.name }}</h4>
        <div class="occupant-details mt-4">
          <div class="detail-item">
            <span class="label">用户名:</span>
            <span class="value">{{ occupantInfo.username }}</span>
          </div>
          <div class="detail-item">
            <span class="label">学号:</span>
            <span class="value">{{ occupantInfo.account }}</span>
          </div>
          <div class="detail-item">
            <span class="label">时间段:</span>
            <span class="value highlight">{{ occupantInfo.timeRange }}</span>
          </div>
        </div>
        <button class="occupant-close mt-6" @click="showOccupantModal = false">关闭</button>
      </div>
    </div>
    <!-- 实验室负责人弹窗 -->
    <div v-if="showManagerModal" class="booking-modal-overlay" @click.self="showManagerModal = false">
      <div class="booking-modal manager-modal">
        <h3 class="modal-title">👨‍💼 实验室负责人</h3>
        <div class="modal-body text-center">
          <div class="manager-avatar-large">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="#6c63ff"/>
            </svg>
          </div>
          <h2 class="mt-4">{{ selectedLab?.managerName || '未设置' }}</h2>
          <div class="mt-2 text-muted flex items-center justify-center gap-2">
            <svg style="width:16px; height:16px;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill="currentColor"/>
            </svg>
            {{ selectedLab?.managerEmail || '未设置' }}
          </div>
        </div>
        <div class="modal-footer justify-center">
          <button class="glass-button" @click="showManagerModal = false">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import NavBar from '../../components/NavBar.vue'
import GlassCard from '../../components/GlassCard.vue'
import request from '../../utils/request'

const router = useRouter()
const navLinks = [
  { name: '预约座位', path: '/student/home' },
  { name: '个人中心', path: '/student/profile' }
]

const labs = ref([])
const selectedLab = ref(null)
const loadingLabs = ref(false)

const seats = ref([])
const loadingSeats = ref(false)
const selectedSeats = ref([])
const labCols = ref(5)
const labLayoutConfig = ref(null)

const isBatchMode = ref(false)

// --- New Time Selection Logic ---
const formatDate = (date) => {
  const pad = n => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const formatTime = (h, m) => {
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

const bookStartTime = ref('')
const bookEndTime = ref('')

const selectedDate = ref(formatDate(new Date()))
const selectedStartTime = ref('')
const selectedDuration = ref(120) // Default 2 hours

const minDateStr = ref(formatDate(new Date()))
const maxDateStr = ref('')
onMounted(() => {
  const maxD = new Date()
  maxD.setDate(maxD.getDate() + 7) // 7 days ahead
  maxDateStr.value = formatDate(maxD)
})

const availableTimes = computed(() => {
  const times = []
  const now = new Date()
  const isToday = selectedDate.value === formatDate(now)
  
  for (let h = 8; h <= 19; h++) {
    for (let m of [0, 30]) {
      if (h === 19 && m > 30) continue // 19:30 is last start
      if (isToday) {
        if (h < now.getHours() || (h === now.getHours() && m <= now.getMinutes())) continue
      }
      times.push(formatTime(h, m))
    }
  }
  return times
})

watch(availableTimes, (newTimes) => {
  if (newTimes.length > 0 && (!selectedStartTime.value || !newTimes.includes(selectedStartTime.value))) {
    selectedStartTime.value = newTimes[0]
  }
}, { immediate: true })

const calculatedEndTime = computed(() => {
  if (!selectedStartTime.value) return ''
  const [h, m] = selectedStartTime.value.split(':').map(Number)
  let endM = m + selectedDuration.value
  let endH = h + Math.floor(endM / 60)
  endM = endM % 60
  if (endH >= 20) return '20:00'
  return formatTime(endH, endM)
})

const isCappedAtClosing = computed(() => {
  if (!selectedStartTime.value) return false
  const [h, m] = selectedStartTime.value.split(':').map(Number)
  return (h * 60 + m + selectedDuration.value) > 20 * 60
})

const fetchLabs = async () => {
  loadingLabs.value = true
  try {
    const res = await request.get('/student/lab/list')
    if (res.code === 200) {
      labs.value = Array.isArray(res.data) ? res.data : (res.data.list || [])
    }
  } catch (e) {
    console.error(e)
  } finally {
    loadingLabs.value = false
  }
}

const selectLab = async (lab) => {
  if (lab.status === 'UNAVAILABLE') {
    alert(`该实验室暂不可预约，原因: ${lab.offlineReason}`)
    return
  }
  selectedLab.value = lab
  selectedSeats.value = []
  await fetchSeats(lab.id)
}

const fetchSeats = async (labId) => {
  if (!labId || !selectedStartTime.value) return
  loadingSeats.value = true
  try {
    const startStr = `${selectedDate.value} ${selectedStartTime.value}:00`
    const endStr = `${selectedDate.value} ${calculatedEndTime.value}:00`
    const res = await request.get(`/student/seat/list?labId=${labId}&startTime=${startStr}&endTime=${endStr}`)
    if (res.code === 200) {
      seats.value = res.data.seats || []
      labCols.value = res.data.cols || 5
      labLayoutConfig.value = res.data.layoutConfig || null
    }
  } catch (e) {
    console.error(e)
  } finally {
    loadingSeats.value = false
  }
}

watch([selectedDate, selectedStartTime, selectedDuration], () => {
  if (selectedLab.value) {
    fetchSeats(selectedLab.value.id)
    selectedSeats.value = []
  }
})

const getSeatStatusClass = (seat) => {
  if (seat.status === 'FREE') return 'free'
  if (seat.status === 'BOOKED' || seat.status === 'IN_USE') return 'booked'
  if (seat.status === 'MAINTENANCE') return 'maintenance'
  return ''
}

const toggleBatchMode = () => {
  isBatchMode.value = !isBatchMode.value
  selectedSeats.value = []
}

const showOccupantModal = ref(false)
const occupantInfo = ref({ name: '', avatar: '' })

const toggleSeatSelection = (seat) => {
  if (seat.status !== 'FREE') {
    if (seat.status === 'BOOKED' || seat.status === 'IN_USE') {
      occupantInfo.value = {
        name: seat.bookerName || '匿名用户',
        avatar: seat.userAvatar,
        username: seat.bookerUserName || '未设置',
        account: seat.bookerAccount || '********',
        timeRange: seat.bookStartTime && seat.bookEndTime ? `${seat.bookStartTime} - ${seat.bookEndTime}` : '未知时间'
      }
      showOccupantModal.value = true
    }
    return
  }
  
  if (!isBatchMode.value) {
    selectedSeats.value = [seat.id]
  } else {
    const idx = selectedSeats.value.indexOf(seat.id)
    if (idx > -1) {
      selectedSeats.value.splice(idx, 1)
    } else {
      if (selectedSeats.value.length >= 3) {
        alert('最多只能批量预约3个座位')
        return
      }
      selectedSeats.value.push(seat.id)
    }
  }
}

const showBookingModal = ref(false)
const showManagerModal = ref(false)
const bookingLoading = ref(false)
const modalUser = ref(null)

const openBookingModal = () => {
  const startStr = `${selectedDate.value} ${selectedStartTime.value}:00`
  const endStr = `${selectedDate.value} ${calculatedEndTime.value}:00`
  const startObj = new Date(startStr.replace(/-/g, '/'))
  const endObj = new Date(endStr.replace(/-/g, '/'))
  
  if (startObj >= endObj) {
    alert('结束时间必须在开始时间之后')
    return
  }
  if (selectedDuration.value > 120) {
    alert('单次预约时长最多不能超过2小时')
    return
  }
  if (startObj < new Date(Date.now() - 5 * 60000)) {
    alert('不能预约过去的时间')
    return
  }
  
  bookStartTime.value = startStr
  bookEndTime.value = endStr
  modalUser.value = JSON.parse(localStorage.getItem('user'))
  showBookingModal.value = true
}

const confirmBooking = async () => {
  bookingLoading.value = true
  try {
    const startStr = `${selectedDate.value} ${selectedStartTime.value}:00`
    const endStr = `${selectedDate.value} ${calculatedEndTime.value}:00`

    const bookRecords = selectedSeats.value.map(seatId => ({
      labId: selectedLab.value.id,
      seatId: seatId,
      bookStartTime: startStr,
      bookEndTime: endStr
    }))
    
    const res = await request.post('/student/book/create', bookRecords)
    
    if (res.code === 200) {
      showBookingModal.value = false
      alert('🎉 预约成功！')
      selectedSeats.value = []
      fetchSeats(selectedLab.value.id)
    } else {
      alert(res.msg || '预约失败，请重试')
    }
  } catch (e) {
    alert(e.message || '系统错误，请检查网络')
  } finally {
    bookingLoading.value = false
  }
}

onMounted(() => {
  fetchLabs()
})

// Auto refresh seats every 30s if a lab is selected
setInterval(() => {
  if (selectedLab.value) {
    fetchSeats(selectedLab.value.id)
  }
}, 30000)

</script>

<style scoped>
/* ============ Seat Legend Cubes ============ */
.seats-legend {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  padding: 10px 0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.88rem;
  color: var(--text-main);
  font-weight: 500;
}

.seat-cube {
  display: inline-block;
  width: 22px;
  height: 22px;
  border-radius: 5px;
  border: 1px solid rgba(0,0,0,0.1);
  flex-shrink: 0;
}

.seat-cube.free {
  background: linear-gradient(145deg, #ffffff, #f0fdf4);
  border-color: #86efac;
  box-shadow: -2px 2px 0 #86efac;
}

.seat-cube.booked {
  background: #f8fafc;
  border-color: #cbd5e1;
  box-shadow: -2px 2px 0 #94a3b8;
  position: relative;
}

.seat-cube.booked::after {
  content: '';
  position: absolute;
  top: 2px; left: 50%;
  transform: translateX(-50%);
  width: 12px; height: 12px;
  border-radius: 50%;
  background: #a0aec0;
}

.seat-cube.maintenance {
  background: #fef2f2;
  border-color: #fca5a5;
  box-shadow: -2px 2px 0 #f87171;
}

.seat-cube.selected {
  background: #eef2ff;
  border-color: #818cf8;
  box-shadow: -2px 2px 0 #6366f1;
}

.content-container {
  display: flex;
  gap: 20px;
  padding: 0 30px;
  height: calc(100vh - 100px);
}

@media (max-width: 1024px) {
  .content-container {
    height: auto;
    padding: 0 15px;
  }
}

@media (max-width: 768px) {
  .content-container {
    flex-direction: column;
    padding: 0 15px;
  }
  .sidebar {
    width: 100% !important;
  }
  .booking-settings {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  .time-input {
    width: 100%;
  }
  .seat-grid-container {
    padding: 15px;
  }
  .seat {
    width: 60px;
    height: 60px;
    font-size: 0.8rem;
  }
}

.sidebar {
  width: 300px;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.lab-list {
  list-style: none;
  padding: 0;
  margin: 0 auto;
}

.lab-list li {
  padding: 15px;
  border-bottom: 1px solid var(--glass-border);
  cursor: pointer;
  transition: all 0.2s;
}

.lab-list li:hover {
  background: rgba(255, 255, 255, 0.3);
}

.lab-list li.active {
  background: rgba(79, 70, 229, 0.1);
  border-left: 4px solid var(--primary);
}

.lab-list li.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  filter: grayscale(1);
}

.lab-name {
  font-weight: 600;
  font-size: 1.1rem;
}

.lab-meta {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-top: 5px;
}

.lab-error {
  font-size: 0.85rem;
  color: var(--danger);
  margin-top: 5px;
}

.booking-settings {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--glass-border);
}

/* Optimized Time Selection Styles */
.booking-settings-v2 {
  transition: all 0.3s ease;
}

.glass-input-new, .glass-select-new {
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(79, 70, 229, 0.2);
  border-radius: 12px;
  padding: 10px 15px;
  font-weight: 700;
  color: #4f46e5;
  transition: all 0.2s;
  outline: none;
  width: 100%;
}

.glass-input-new:focus, .glass-select-new:focus {
  background: white;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  border-color: #4f46e5;
}

.duration-chip {
  flex: 1;
  padding: 8px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(0, 0, 0, 0.05);
  font-size: 11px;
  font-weight: 800;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.duration-chip:hover {
  background: rgba(255, 255, 255, 0.8);
}

.duration-chip.active {
  background: #4f46e5;
  color: white;
  border-color: #4f46e5;
  box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3);
}

.status-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgba(79, 70, 229, 0.1);
}

.status-icon.warning {
  background: rgba(245, 158, 11, 0.1);
}

.time-input {
  width: 180px;
  display: inline-block;
  padding: 6px 12px;
}

.seats-legend {
  display: flex;
  gap: 20px;
  margin-top: 20px;
  font-size: 0.9rem;
}

.lab-thumbnail {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--glass-border);
  flex-shrink: 0;
}

.lab-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.lab-thumbnail-placeholder {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.lab-bg-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.08;
  pointer-events: none;
  background-size: cover;
  background-position: center;
  z-index: 0;
  border-radius: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.seat-cube {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.seat-grid-container {
  padding: 30px;
  background: #f1f5f9;
  border-radius: 16px;
  overflow-y: auto; /* Changed to auto for vertical scrolling */
  max-height: 600px; /* Added max-height to enable scrolling */
  box-shadow: inset 0 2px 10px rgba(0,0,0,0.02);
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.lab-manager-info-box {
  position: absolute;
  bottom: 25px;
  left: 25px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  padding: 16px;
  min-width: 220px;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
  z-index: 50;
  transition: all 0.3s ease;
}

.lab-manager-info-box:hover {
  transform: translateY(-5px);
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 0 12px 40px rgba(31, 38, 135, 0.15);
}

.info-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
  margin-bottom: 8px;
}

.info-icon {
  width: 14px;
  height: 14px;
}

.info-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.manager-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
}

.manager-email {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: #475569;
}

.email-icon {
  width: 14px;
  height: 14px;
  color: #94a3b8;
}

/* Transitions */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.9);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.9);
}

.seat-grid {
  display: grid;
  gap: 30px;
  padding: 30px;
  width: 100%;
  justify-content: center;
}

.custom-rows-wrapper {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 30px;
  width: 100%;
}

.custom-seat-row {
  display: grid;
  gap: 15px;
  justify-content: center;
}

.seat {
  width: 80px;
  height: 80px;
  background: #ffffff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 6px 15px rgba(0,0,0,0.06);
  position: relative;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #e2e8f0;
}

.seat:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 12px 25px -4px rgba(0,0,0,0.12);
  border-color: var(--primary);
}

.seat-no {
  font-weight: 700;
  font-size: 1rem;
  color: #475569;
  z-index: 2;
  transform: translateZ(5px);
}

.seat-avatar, .seat-avatar-placeholder {
  position: absolute;
  top: -15px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid #fff;
  background: #f1f5f9;
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  z-index: 10;
  object-fit: cover;
  transition: all 0.2s ease;
}

.seat:hover .seat-avatar, .seat:hover .seat-avatar-placeholder {
  transform: translateX(-50%) translateY(-5px) scale(1.1);
}

.seat-avatar-placeholder svg {
  width: 100%;
  height: 100%;
}

.seat.free {
  background: linear-gradient(145deg, #ffffff, #f0fdf4);
  border-top: 1px solid #dcfce7;
  border-left: 1px solid #dcfce7;
}

.seat.free .seat-no { color: #16a34a; }

.seat.booked {
  background: #f8fafc;
  opacity: 0.9;
}

.seat.maintenance {
  background: #fef2f2;
  box-shadow: 
    -2px 2px 0px #fecaca,
    -4px 4px 0px #fca5a5,
    -8px 8px 15px rgba(220,38,38,0.1);
  cursor: not-allowed;
  opacity: 0.7;
}
.seat.maintenance .seat-no { color: #ef4444; }

.seat.selected {
  background: #eef2ff;
  border-color: #818cf8;
  box-shadow: 
    -2px 2px 0px #818cf8,
    -4px 4px 0px #6366f1,
    -6px 6px 0px #4f46e5,
    -10px 10px 25px rgba(79, 70, 229, 0.3);
  transform: translateZ(10px) translateX(1px) translateY(-1px);
}
.seat.selected .seat-no { color: #4f46e5; }

.booking-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--glass-border);
}
.selected-info {
  font-weight: bold;
  color: var(--primary);
}

/* Booking Confirmation Modal */
.booking-modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.booking-modal {
  background: #fff;
  border-radius: 20px;
  padding: 32px;
  min-width: 380px;
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  animation: slideUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f1f5f9;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.modal-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 10px;
}

.modal-label {
  font-size: 0.9rem;
  color: #64748b;
  font-weight: 500;
}

.modal-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e293b;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.modal-footer button:last-child {
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  min-width: 120px;
}

.modal-footer button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Occupant Modal Styles */
.occupant-modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0,0,0,0.3);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.occupant-modal {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  padding: 30px;
  border-radius: 24px;
  text-align: center;
  box-shadow: 0 20px 50px rgba(0,0,0,0.15);
  min-width: 260px;
  animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes popIn {
  from { transform: scale(0.85); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.occupant-avatar-wrapper {
  width: 90px;
  height: 90px;
  margin: 0 auto 15px;
  border-radius: 50%;
  padding: 4px;
  background: linear-gradient(135deg, var(--primary), #818cf8);
}

.occupant-avatar-wrapper img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #fff;
  object-fit: cover;
}

.occupant-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 5px;
}

.occupant-status {
  font-size: 0.9rem;
  color: #64748b;
  margin-bottom: 25px;
}

.occupant-close {
  background: var(--primary);
  color: #fff;
  border: none;
  padding: 8px 24px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.occupant-close:hover {
  opacity: 0.9;
}

.occupant-details {
  background: rgba(255, 255, 255, 0.4);
  border-radius: 16px;
  padding: 15px;
  text-align: left;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-item .label {
  color: #64748b;
  font-weight: 500;
}

.detail-item .value {
  color: #1e293b;
  font-weight: 600;
}

.detail-item .value.highlight {
  color: var(--primary);
}
.secondary-btn {
  background: rgba(79, 70, 229, 0.15) !important;
  border: 1px solid rgba(79, 70, 229, 0.3) !important;
  color: #818cf8 !important;
}

.secondary-btn:hover {
  background: rgba(79, 70, 229, 0.25) !important;
  transform: translateY(-2px);
}

/* Manager Modal Specifics */
.manager-modal {
  max-width: 400px !important;
  background: rgba(2, 6, 23, 0.9) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.manager-avatar-large {
  width: 100px;
  height: 100px;
  margin: 0 auto;
  background: rgba(108, 99, 255, 0.1);
  border-radius: 50%;
  padding: 20px;
  border: 2px solid rgba(108, 99, 255, 0.2);
}

.manager-avatar-large svg {
  width: 100%;
  height: 100%;
}

.modal-footer.justify-center {
  justify-content: center;
}
</style>
