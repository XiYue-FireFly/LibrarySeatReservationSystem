<template>
  <div class="dashboard-wrapper">
    <NavBar title="管理端 - 实验室预约系统" :links="navLinks" />
    
    <div class="content-container">
      <!-- Tabs -->
      <div class="tabs-sidebar">
        <GlassCard>
          <ul class="tab-list">
            <li :class="{ active: currentTab === 'reservations' }" @click="currentTab = 'reservations'">预约管理</li>
            <li :class="{ active: currentTab === 'labs' }" @click="currentTab = 'labs'">实验室与座位管理</li>
            <li :class="{ active: currentTab === 'feedbacks' }" @click="currentTab = 'feedbacks'">反馈处理</li>
          </ul>
        </GlassCard>
      </div>

      <div class="main-content">
        <!-- Tab 1: 预约管理 -->
        <GlassCard v-if="currentTab === 'reservations'" title="全校预约信息">
          <div class="filter-bar">
            <input type="text" v-model="filters.account" class="glass-input" placeholder="按学号过滤" style="width: 200px" />
            <select v-model="filters.labId" class="glass-input" style="width: 200px">
              <option value="">所有实验室</option>
              <option v-for="lab in labs" :key="lab.id" :value="lab.id">{{ lab.name }}</option>
            </select>
            <button class="glass-button" @click="fetchReservations">搜索</button>
          </div>
          
          <table class="glass-table mt-4">
            <thead>
              <tr>
                <th>预约ID</th>
                <th>实验室</th>
                <th>座位</th>
                <th>学号</th>
                <th>时间</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="res in reservations" :key="res.id">
                <td>{{ res.id }}</td>
                <td>{{ res.labId }}</td>
                <td>{{ res.seatId }}</td>
                <td>{{ res.userId }}</td>
                <td>{{ res.bookStartTime ? String(res.bookStartTime).substring(0, 16) : '' }} - {{ res.bookEndTime ? String(res.bookEndTime).substring(11, 16) : '' }}</td>
                <td>
                  <span :class="'status-badge ' + (res.status || '').toLowerCase()">{{ formatBookStatus(res.status) }}</span>
                </td>
                <td>
                  <div class="flex" style="gap:5px;">
                    <button v-if="res.status === 'PENDING'" class="glass-button success sm" @click="adminCheckin(res)">
                      辅助签到
                    </button>
                    <button v-if="res.status === 'PENDING'" class="glass-button sm" @click="openQRModal(res, 'IN')" title="生成签到二维码">
                      签到码
                    </button>
                    <button v-if="res.status === 'CHECKED_IN'" class="glass-button sm" style="background:#6366f1; color:white;" @click="openQRModal(res, 'OUT')" title="生成签退二维码">
                      签退码
                    </button>
                    <button v-if="res.status === 'CHECKED_IN' || res.status === 'PENDING'" class="glass-button warning sm" @click="adminCheckout(res)">
                      辅助签退
                    </button>
                    <button v-if="res.status === 'PENDING'" class="glass-button danger sm" @click="openCancelModal(res)">
                      强制取消
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </GlassCard>

        <!-- Tab 2: 实验室与座位 -->
        <GlassCard v-if="currentTab === 'labs'" title="实验室配置">
          <div v-if="!selectedLabForSeats" class="lab-cards mt-2">
            <div v-for="lab in labs" :key="lab.id" class="glass-panel lab-config-card">
              <h4>{{ lab.name }}</h4>
              <p>总座位数: {{ lab.totalSeats }}</p>
              <p>状态: <span :class="lab.status === 'AVAILABLE' ? 'text-success' : 'text-danger'">{{ lab.status === 'AVAILABLE' ? '正常开放' : '已下线' }}</span></p>
              <div class="mt-4 flex" style="gap: 10px;">
                <button v-if="lab.status === 'AVAILABLE'" class="glass-button danger sm" @click="openOfflineModal(lab)">下线维护</button>
                <button v-else class="glass-button sm" @click="onlineLab(lab)">恢复上线</button>
                <button class="glass-button sm" style="background:var(--warning)" @click="openSeatManage(lab)">管理座位</button>
              </div>
            </div>
          </div>

          <!-- Seat Management Panel -->
          <div v-else class="mt-2">
            <!-- Header -->
            <div class="flex justify-between" style="margin-bottom: 16px; align-items:center; flex-wrap:wrap; gap:10px;">
              <h4 style="font-size: 1.15rem; font-weight: 700;">{{ selectedLabForSeats.name }} — 座位管理</h4>
              <button class="glass-button sm" @click="selectedLabForSeats = null">← 返回列表</button>
            </div>

            <!-- ① 修改座位数量 -->
            <div class="manage-section">
              <div class="manage-section-title">① 修改座位数量</div>
              <div class="flex" style="align-items:center; gap:12px; flex-wrap:wrap;">
                <span style="font-size:0.9rem;">当前座位数: <strong>{{ seats.length }}</strong></span>
                <input type="number" v-model.number="newSeatCount" min="1" max="200" class="glass-input" style="width:90px;" />
                <button class="glass-button sm" @click="resizeSeats">应用修改</button>
                <span style="font-size:0.8rem; color:#64748b;">增加会追加新座位；减少只会删除末尾空闲座位，预约中的不受影响。</span>
              </div>
            </div>

            <!-- ② 修改座位状态（批量） -->
            <div class="manage-section mt-4">
              <div class="manage-section-title">② 批量修改座位状态</div>
              <div class="flex" style="gap:10px; flex-wrap:wrap; align-items:center;">
                <span style="font-size:0.9rem;">已选 <strong>{{ selectedSeatIds.length }}</strong> 个座位</span>
                <button class="glass-button sm" style="background:#f1f5f9;color:#334155;" @click="selectAllFreeSeats">全选空闲</button>
                <button class="glass-button sm" style="background:#f1f5f9;color:#334155;" @click="selectedSeatIds = []">取消全选</button>
                <button class="glass-button sm" style="background:#ef4444;color:#fff;" @click="batchSetStatus('MAINTENANCE')" :disabled="selectedSeatIds.length===0">→ 设为维护</button>
                <button class="glass-button sm" style="background:#22c55e;color:#fff;" @click="batchSetStatus('FREE')" :disabled="selectedSeatIds.length===0">→ 恢复空闲</button>
              </div>
            </div>

            <!-- 实时监控查询 (监控模式) -->
            <div class="manage-section mt-4 monitoring-panel">
              <div class="manage-section-title">🕒 实时监控查询 (监控模式)</div>
              <div class="flex" style="gap:15px; align-items:center; flex-wrap:wrap;">
                <div class="flex items-center gap-2">
                  <label style="font-size:0.85rem; font-weight:700;">选择日期:</label>
                  <input type="date" v-model="adminSelectDate" class="glass-input sm" />
                </div>
                <div class="flex items-center gap-2">
                  <label style="font-size:0.85rem; font-weight:700;">时段:</label>
                  <select v-model="adminSelectTime" class="glass-input sm" style="width:120px;">
                    <option v-for="t in timeOptions" :key="t" :value="t">{{ t }}</option>
                  </select>
                </div>
                <button class="glass-button sm active-col" @click="fetchSeats">刷新监控图</button>
                <span style="font-size:0.8rem; color:#64748b;">* 在监控模式下，您可以查阅特定时段谁坐在哪里，点击位置可看完整脱敏资料。</span>
              </div>
            </div>

            <!-- ③ 调整座位分布 -->
            <div class="manage-section mt-4">
              <div class="manage-section-title">③ 调整座位分布</div>

              <!-- Mode switcher -->
              <div class="flex" style="gap:8px; margin-bottom:12px;">
                <button :class="['glass-button','sm', layoutMode==='uniform'?'active-col':'']" @click="layoutMode='uniform'">统一列数</button>
                <button :class="['glass-button','sm', layoutMode==='custom'?'active-col':'']" @click="initCustomRows()">自定义每排</button>
              </div>

              <!-- Uniform mode -->
              <div v-if="layoutMode==='uniform'" class="flex" style="gap:8px; align-items:center; flex-wrap:wrap;">
                <button v-for="n in [4,5,6,8,10]" :key="n"
                  :class="['glass-button','sm', seatColumns===n && !customColInput ? 'active-col' : '']"
                  @click="seatColumns=n; customColInput=null">
                  {{ n }} 列
                </button>
                <span style="font-size:0.85rem; color:#94a3b8;">或自定义:</span>
                <input
                  type="number" min="1" max="20"
                  v-model.number="customColInput"
                  @input="customColInput && (seatColumns = customColInput)"
                  class="glass-input" style="width:70px;"
                  placeholder="列数"
                />
              </div>

              <!-- Per-row custom mode -->
              <div v-if="layoutMode==='custom'">
                <p style="font-size:0.82rem;color:#94a3b8;margin-bottom:10px;">
                  设置每排的座位数量，总和 <strong>{{ customRowCols.reduce((a,b)=>a+b,0) }}</strong>（共 {{ seats.length }} 个座位）
                </p>
                <div class="custom-row-list">
                  <div v-for="(col, i) in customRowCols" :key="i" class="custom-row-item">
                    <span class="row-label">第 {{ i+1 }} 排</span>
                    <input type="number" min="1" max="20" v-model.number="customRowCols[i]" class="glass-input" style="width:65px;" />
                    <span style="font-size:0.8rem;color:#94a3b8;">座位</span>
                    <button class="icon-btn danger" @click="customRowCols.splice(i,1)" title="删除此排">✕</button>
                  </div>
                </div>
                <div class="flex" style="gap:10px; margin-top:10px;">
                  <button class="glass-button sm" @click="customRowCols.push(5)">+ 增加一排</button>
                  <button class="glass-button sm active-col" @click="applyCustomLayout">应用布局</button>
                </div>
              </div>
            </div>

            <!-- ④ 座位命名 -->
            <div class="manage-section mt-4">
              <div class="manage-section-title">④ 座位命名</div>
              <div class="flex" style="gap:10px; flex-wrap:wrap; align-items:center;">
                <button class="glass-button sm active-col" @click="renameByGrid">
                  按当前列数自动命名（行号+列字母）
                </button>
                <span style="font-size:0.82rem;color:#94a3b8;">例如当前 {{ seatColumns }} 列 → 1A, 1B... 2A, 2B...</span>
              </div>
              <p class="mt-2" style="font-size:0.82rem;color:#94a3b8;">
                💡 也可以<strong>双击座位号</strong>直接自定义单个座位名称
              </p>
            </div>

            <!-- ⑤ 修改负责人信息 -->
            <div class="manage-section mt-4">
              <div class="manage-section-title">⑤ 实验室负责人信息</div>
              <div class="flex flex-col gap-3" style="align-items:flex-start;">
                <div class="flex items-center gap-2">
                  <label class="font-bold" style="width:80px;">负责人姓名:</label>
                  <input type="text" v-model="editingLabManager.name" class="glass-input" :disabled="!editingLabManager.isEditing" />
                </div>
                <div class="flex items-center gap-2">
                  <label class="font-bold" style="width:80px;">负责人邮箱:</label>
                  <input type="email" v-model="editingLabManager.email" class="glass-input" :disabled="!editingLabManager.isEditing" />
                </div>
                <div class="flex" style="gap: 10px; margin-top: 10px;">
                  <button v-if="!editingLabManager.isEditing" class="glass-button sm" @click="editLabManager(selectedLabForSeats)">编辑</button>
                  <template v-else>
                    <button class="glass-button sm success" @click="saveLabManager">保存</button>
                    <button class="glass-button sm" @click="cancelEditLabManager">取消</button>
                  </template>
                </div>
              </div>
            </div>

            <!-- ⑥ 修改实验室图片 -->
            <div class="manage-section mt-4">
              <div class="manage-section-title">⑥ 修改实验室图片</div>
              <div class="flex flex-col gap-3" style="align-items:flex-start;">
                <div class="flex items-center gap-2">
                  <img v-if="labImagePreviewUrl" :src="labImagePreviewUrl" alt="实验室图片" class="lab-preview-image" />
                  <div v-else class="lab-preview-placeholder">暂无图片</div>
                </div>
                <input type="file" ref="labImageInput" @change="handleLabImageFileChange" accept="image/*" style="display: none;" />
                <div class="flex" style="gap: 10px; margin-top: 10px;">
                <div class="flex flex-col gap-2 w-full">
                  <div class="flex items-center gap-2">
                    <input type="text" v-model="labImageUrlInput" class="glass-input" placeholder="输入图片 URL 链接..." style="flex: 1" />
                    <button class="glass-button sm success" @click="saveLabImageUrl" :disabled="!labImageUrlInput.trim()">
                      保存链接
                    </button>
                  </div>
                  <div class="text-muted" style="font-size: 0.8rem;">— 或选择本地文件上传 —</div>
                  <div class="flex" style="gap: 10px;">
                    <button class="glass-button sm" @click="triggerLabImageUpload">选择图片</button>
                    <button class="glass-button sm success" @click="uploadLabImage" :disabled="!labImageFile || uploadingImage">
                      {{ uploadingImage ? '上传中...' : '上传并保存' }}
                    </button>
                    <button v-if="labImagePreviewUrl" class="glass-button sm danger" @click="removeLabImage" :disabled="uploadingImage">移除图片</button>
                  </div>
                </div>
                </div>
              </div>
            </div>

            <!-- Seat Grid -->
            <div v-if="loadingSeats" class="loading mt-4">座位加载中...</div>
            <div v-else class="seat-grid-container mt-4">

              <!-- Uniform mode: single flat grid -->
              <div v-if="layoutMode === 'uniform'"
                class="seat-grid"
                :style="`grid-template-columns: repeat(${seatColumns}, 1fr);`">
                <div
                  v-for="seat in seats"
                  :key="seat.id"
                  class="seat"
                  :class="[getSeatStatusClass(seat), { 'seat-selected-admin': selectedSeatIds.includes(seat.id) }]"
                  @click="toggleAdminSelect(seat)"
                  :title="seat.maintenanceReason || `座位号: ${seat.seatNo} | ${seat.status}`"
                >
                  <div v-if="renamingId === seat.id" class="seat-rename-input" @click.stop>
                    <input
                      type="text"
                      :value="seat.seatNo"
                      @keyup.enter="commitRename(seat, $event.target.value)"
                      @keyup.escape="renamingId = null"
                      @blur="commitRename(seat, $event.target.value)"
                      class="rename-inp"
                      ref="renameInput"
                      v-focus
                    />
                  </div>
                  <div v-else class="seat-no" @dblclick.stop="startRename(seat)" :title="'双击改名'">
                    {{ seat.seatNo }}
                  </div>
                  
                  <!-- Admin Level Booker Info -->
                  <div v-if="seat.status === 'BOOKED' || seat.status === 'IN_USE'" class="admin-booker-overlay">
                    <img v-if="seat.userAvatar" :src="seat.userAvatar" class="seat-avatar" />
                    <div v-else class="seat-avatar-placeholder">👤</div>
                    <div class="booker-popup-info">
                      <p><strong>{{ seat.bookerName || '占座中' }}</strong></p>
                      <p>{{ seat.bookerAccount || '未知学号' }}</p>
                      <p class="time-range">{{ seat.bookStartTime }}-{{ seat.bookEndTime }}</p>
                    </div>
                  </div>

                  <div v-if="selectedSeatIds.includes(seat.id)" class="seat-check">✓</div>
                </div>
              </div>

              <!-- Custom mode: row-by-row with variable columns -->
              <div v-else class="custom-rows-wrapper">
                <div v-for="(rowSeats, ri) in computedRowSeats" :key="ri" class="custom-seat-row"
                  :style="`grid-template-columns: repeat(${rowSeats.length}, 1fr);`">
                  <div
                    v-for="seat in rowSeats"
                    :key="seat.id"
                    class="seat"
                    :class="[getSeatStatusClass(seat), { 'seat-selected-admin': selectedSeatIds.includes(seat.id) }]"
                    @click="toggleAdminSelect(seat)"
                    :title="seat.maintenanceReason || `座位号: ${seat.seatNo} | ${seat.status}`"
                  >
                    <div v-if="renamingId === seat.id" class="seat-rename-input" @click.stop>
                      <input
                        type="text"
                        :value="seat.seatNo"
                        @keyup.enter="commitRename(seat, $event.target.value)"
                        @keyup.escape="renamingId = null"
                        @blur="commitRename(seat, $event.target.value)"
                        class="rename-inp"
                        ref="renameInput"
                        v-focus
                      />
                    </div>
                    <div v-else class="seat-no" @dblclick.stop="startRename(seat)" :title="'双击改名'">
                      {{ seat.seatNo }}
                    </div>
                    <img v-if="seat.userAvatar" :src="seat.userAvatar" class="seat-avatar" />
                    <div v-if="(seat.status === 'BOOKED' || seat.status === 'IN_USE') && !seat.userAvatar" class="seat-avatar-placeholder">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="#a0aec0"/></svg>
                    </div>
                    <div v-if="selectedSeatIds.includes(seat.id)" class="seat-check">✓</div>
                  </div>
                </div>
              </div>

              <div class="watermark-info">点击座位选中/取消 | 批量操作用上方按钮</div>
            </div>
          </div>
        </GlassCard>

        <!-- Tab 3: 反馈处理 -->
        <GlassCard v-if="currentTab === 'feedbacks'" title="用户反馈列表">
          <div class="books-grid">
            <div v-for="fb in feedbacks" :key="fb.feedbackId" class="glass-panel p-4 flex-col">
              <div class="flex justify-between">
                <strong>{{ fb.labName }} / {{ fb.seatNo }}</strong>
                <span class="status-badge" :class="fb.status.toLowerCase()">{{ formatFbStatus(fb.status) }}</span>
              </div>
              <p class="mt-2 text-sm text-muted">用户: {{ fb.studentName }} ({{ fb.studentAccount }})</p>
              <p class="mt-2 text-sm"><strong>类型:</strong> {{ fb.type }}</p>
              <p class="mt-2"><strong>描述:</strong> <br> {{ fb.description }}</p>
              <div class="mt-4" v-if="fb.status !== 'RESOLVED'">
                <textarea v-model="fb.replyInput" class="glass-input mb-2" rows="2" placeholder="回复内容..."></textarea>
                <button class="glass-button sm" @click="replyFeedback(fb, 'PROCESSING')">标记处理中</button>
                <button class="glass-button sm" style="margin-left: 10px; background: var(--success);" @click="replyFeedback(fb, 'RESOLVED')">问题已解决</button>
              </div>
              <div v-else class="mt-4 p-2" style="background:rgba(255,255,255,0.2); border-radius:4px;">
                <strong>管理员回复:</strong> {{ fb.adminReply }}
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>

    <!-- 改定预约取消弹窗 -->
    <div v-if="showCancelModal" class="modal-overlay" @click.self="showCancelModal = false">
      <div class="quick-modal">
        <h3>强制取消预约</h3>
        <p>预约 ID: <strong>{{ cancelTarget?.id }}</strong>，座位 ID: <strong>{{ cancelTarget?.seatId }}</strong></p>
        <div class="form-group mt-4">
          <label>取消原因</label>
          <select v-model="cancelReason" class="glass-input mt-1">
            <option v-for="r in cancelReasonOptions" :key="r" :value="r">{{ r }}</option>
          </select>
        </div>
        <div class="modal-footer mt-4">
          <button class="glass-button" style="background:var(--text-muted)" @click="showCancelModal = false">取消</button>
          <button class="glass-button danger" @click="adminCancelBooking()">确定取消</button>
        </div>
      </div>
    </div>

    <!-- 实验室下线弹窗 -->
    <div v-if="showOfflineModal" class="modal-overlay" @click.self="showOfflineModal = false">
      <div class="quick-modal">
        <h3>下线实验室: {{ offlineTarget?.name }}</h3>
        <p class="text-danger mt-2">⚠️ 下线将自动取消该实验室所有待签到预约并释放座位！</p>
        <div class="form-group mt-4">
          <label>下线原因 <span class="text-danger">*</span></label>
          <input type="text" v-model="offlineReason" class="glass-input mt-1" placeholder="请填写原因，如：电路维修" />
        </div>
        <div class="modal-footer mt-4">
          <button class="glass-button" style="background:var(--text-muted)" @click="showOfflineModal = false">取消</button>
          <button class="glass-button danger" @click="confirmOffline()">确定下线</button>
        </div>
      </div>
    </div>

    <!-- Generic Message Modal -->
    <div v-if="messageModal.show" class="modal-overlay" @click.self="messageModal.show = false">
      <div class="quick-modal">
        <h3 :style="{ color: messageModal.type === 'success' ? 'var(--success)' : 'var(--danger)' }">{{ messageModal.title }}</h3>
        <p class="mt-2" style="font-size: 0.95rem; color: #475569;">{{ messageModal.message }}</p>
        <div class="modal-footer mt-4">
          <button class="glass-button" @click="messageModal.show = false">关闭</button>
        </div>
      </div>
    </div>

    <!-- QR Code Modal -->
    <div v-if="qrModal.show" class="modal-overlay" @click.self="qrModal.show = false">
      <div class="quick-modal text-center" style="text-align:center;">
        <h3 style="margin-bottom:15px;">{{ qrModal.type === 'IN' ? '📥 学生签到码' : '📤 学生签退码' }}</h3>
        <div class="qr-container" style="display:flex; justify-content:center; padding:20px; background:#fff; border-radius:12px; margin-bottom:15px;">
           <qrcode-vue :value="qrModal.value" :size="240" level="H" />
        </div>
        <p style="font-size:0.85rem; color:#64748b; margin-bottom:20px;">
          请扫屏幕二维码进行{{ qrModal.type === 'IN' ? '签到' : '签退' }}<br/>
          (Token 有效期 5 分钟)
        </p>
        <button class="glass-button" @click="qrModal.show = false" style="width:100%">关闭窗口</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import NavBar from '../../components/NavBar.vue'
import GlassCard from '../../components/GlassCard.vue'
import request from '../../utils/request'
import QrcodeVue from 'qrcode.vue'

const navLinks = [
  { name: '控制台首页', path: '/admin/dashboard' }
]

// Message Modal
const messageModal = ref({
  show: false,
  title: '',
  message: '',
  type: 'success' // 'success' or 'error'
})

const showMessage = (title, message, type = 'success') => {
  messageModal.value.title = title
  messageModal.value.message = message
  messageModal.value.type = type
  messageModal.value.show = true
}

const currentTab = ref('reservations')

// Global lab list for dropdowns
const labs = ref([])
const fetchLabs = async () => {
  try {
    const res = await request.get('/admin/lab/list') 
    if (res.code === 200) {
      labs.value = Array.isArray(res.data) ? res.data : (res.data.list || [])
    }
  } catch (e) {
    console.error('Failed to fetch labs', e)
  }
}

// 1. Reservations
const reservations = ref([])
const filters = ref({ account: '', labId: '' })

const fetchReservations = async () => {
  try {
    let url = `/admin/book/page?current=1&size=50`
    if (filters.value.account) url += `&account=${filters.value.account}`
    if (filters.value.labId) url += `&labId=${filters.value.labId}`
    const res = await request.get(url)
    if (res.code === 200) {
      reservations.value = res.data.records || res.data.list || []
    }
  } catch (e) {
    console.error('Failed to fetch reservations', e)
  }
}

// Cancel booking with reason dropdown
const cancelReasonOptions = ['违规预约', '座位维修', '实验室下线', '其他']
const showCancelModal = ref(false)
const cancelTarget = ref(null)
const cancelReason = ref('违规预约')

const openCancelModal = (book) => {
  cancelTarget.value = book
  cancelReason.value = '违规预约'
  showCancelModal.value = true
}

const adminCancelBooking = async () => {
  if (!cancelTarget.value) return
  try {
    const res = await request.put(`/admin/book/cancel/${cancelTarget.value.id}`, {
      cancelReason: cancelReason.value
    })
    if (res.code === 200) {
      showMessage('操作成功', '已强制取消该预约！', 'success')
      showCancelModal.value = false
      fetchReservations()
    } else {
      showMessage('操作失败', res.msg, 'error')
    }
  } catch (e) {
    console.error(e)
  }
}

const adminCheckin = async (record) => {
  try {
    const res = await request.put(`/admin/book/checkin/${record.id}`)
    if (res.code === 200) {
      alert('已辅助该用户签到成功！')
      fetchReservations()
    } else {
      alert(res.msg)
    }
  } catch (e) {
    console.error(e)
  }
}

const adminCheckout = async (record) => {
  if (!confirm('确定要辅助该用户签退并立即释放座位吗？')) return
  try {
    const res = await request.put(`/admin/book/checkout/${record.id}`)
    if (res.code === 200) {
      alert('已成功辅助签退，座位已重新变为“空开”状态')
      fetchReservations()
    } else {
      alert(res.msg)
    }
  } catch (e) {
    console.error(e)
  }
}

const qrModal = ref({
  show: false,
  value: '',
  type: 'IN'
})

const openQRModal = async (record, type) => {
  try {
    const res = await request.get(`/admin/book/qr-token?id=${record.id}&type=${type}`)
    if (res.code === 200) {
      // Encode as JSON string for the scanner
      qrModal.value.value = JSON.stringify({
        bookingId: res.data.bookingId,
        token: res.data.token,
        type: res.data.type
      })
      qrModal.value.type = type
      qrModal.value.show = true
    } else {
      alert(res.msg)
    }
  } catch (e) {
    console.error(e)
    alert('请求失败')
  }
}

// 2. Labs - Online/Offline management
const showOfflineModal = ref(false)
const offlineTarget = ref(null)
const offlineReason = ref('')

const openOfflineModal = (lab) => {
  offlineTarget.value = lab
  offlineReason.value = ''
  showOfflineModal.value = true
}

const confirmOffline = async () => {
  if (!offlineReason.value.trim()) {
    alert('请填写下线原因')
    return
  }
  try {
    const res = await request.post('/admin/lab/offline', {
      id: offlineTarget.value.id,
      offlineReason: offlineReason.value
    })
    if (res.code === 200) {
      alert(`实验室「${offlineTarget.value.name}」已下线，所有相关预约已自动取消`)
      showOfflineModal.value = false
      fetchLabs()
    } else {
      alert(res.msg)
    }
  } catch(e) {
    console.error(e)
  }
}

const onlineLab = async (lab) => {
  if (!confirm(`确定将「${lab.name}」恢复上线吗？`)) return
  try {
    const res = await request.post('/admin/lab/online', { id: lab.id })
    if (res.code === 200) {
      alert('实验室已恢复上线')
      fetchLabs()
    }
  } catch(e) {
    console.error(e)
  }
}

const selectedLabForSeats = ref(null)
const seats = ref([])
const loadingSeats = ref(false)
const newSeatCount = ref(0)
const seatColumns = ref(5)
const selectedSeatIds = ref([])

// Watch for selectedLabForSeats changes to update image preview and clear file
watch(selectedLabForSeats, (newLab) => {
  if (newLab) {
    newSeatCount.value = newLab.totalSeats
    labImageFile.value = null // Clear any selected file
    labImagePreviewUrl.value = newLab.labImageUrl // Set preview to existing image
    labImageUrlInput.value = newLab.labImageUrl || '' // Initialize URL input
  }
})

// Seat Renaming
const renamingId = ref(null)
const vFocus = {
  mounted: (el) => el.focus()
}

const startRename = (seat) => {
  renamingId.value = seat.id
}

const commitRename = async (seat, newName) => {
  if (!renamingId.value) return
  const oldName = seat.seatNo
  const name = newName.trim()
  renamingId.value = null
  
  if (!name || name === oldName) return
  
  try {
    const res = await request.put('/admin/seat/rename', {
      seatId: seat.id,
      seatNo: name
    })
    if (res.code === 200) {
      seat.seatNo = name
    } else {
      alert(res.msg || '改名失败')
    }
  } catch (e) {
    console.error(e)
    alert('系统错误')
  }
}

const renameByGrid = async () => {
  if (!selectedLabForSeats.value) return
  if (!confirm('确定按当前列数自动重命名所有座位吗？(格式：1A, 1B, 2A...)')) return
  
  try {
    const res = await request.post('/admin/seat/rename-grid', {
      labId: selectedLabForSeats.value.id,
      columns: seatColumns.value
    })
    if (res.code === 200) {
      alert('批量改名成功')
      fetchSeats()
      // Also save the column count as the default layout
      saveLayout()
    } else {
      alert(res.msg || '批量改名失败')
    }
  } catch (e) {
    console.error(e)
    alert('系统错误')
  }
}

const saveLayout = async () => {
  if (!selectedLabForSeats.value) return
  try {
    await request.put('/admin/lab/layout', {
      id: selectedLabForSeats.value.id,
      cols: seatColumns.value,
      layoutConfig: layoutMode.value === 'custom' ? customRowCols.value.join(',') : null
    })
  } catch (e) {
    console.error('Failed to save layout:', e)
  }
}

watch(seatColumns, (newVal) => {
  if (layoutMode.value === 'uniform') {
    saveLayout()
  }
})

// Layout mode: 'uniform' | 'custom'
const layoutMode = ref('uniform')
const customColInput = ref(null)
const customRowCols = ref([])

// Slice flat seats[] into rows according to customRowCols
const computedRowSeats = computed(() => {
  const rows = []
  let i = 0
  for (const colCount of customRowCols.value) {
    rows.push(seats.value.slice(i, i + colCount))
    i += colCount
  }
  // Remaining seats not covered by defined rows
  if (i < seats.value.length) rows.push(seats.value.slice(i))
  return rows
})

const initCustomRows = () => {
  layoutMode.value = 'custom'
  if (customRowCols.value.length === 0) {
    // Default: split seats evenly in rows of 5
    const total = seats.value.length
    const perRow = seatColumns.value || 5
    const fullRows = Math.floor(total / perRow)
    const rem = total % perRow
    customRowCols.value = Array(fullRows).fill(perRow)
    if (rem > 0) customRowCols.value.push(rem)
  }
}

const applyCustomLayout = () => {
  const total = customRowCols.value.reduce((a, b) => a + b, 0)
  if (total !== seats.value.length) {
    alert(`排列总座位数 (${total}) 与实际座位数 (${seats.value.length}) 不符，请调整！`)
    return
  }
  saveLayout()
  alert('布局已应用并同步至学生端！')
}

const openSeatManage = async (lab) => {
  selectedLabForSeats.value = lab
  newSeatCount.value = lab.totalSeats || 0
  selectedSeatIds.value = []
  
  // Load saved layout
  seatColumns.value = lab.cols || 5
  if (lab.layoutConfig) {
    customRowCols.value = lab.layoutConfig.split(',').map(Number)
    layoutMode.value = 'custom'
  } else {
    customRowCols.value = []
    layoutMode.value = 'uniform'
  }
  
  await fetchSeats()
}

const adminSelectDate = ref(new Date().toISOString().split('T')[0])
const adminSelectTime = ref('12:00')
const timeOptions = Array.from({ length: 24 }, (_, i) => {
  const hour = (i + 8) % 20 || 8
  if (hour < 8 || hour >= 20) return null
  return [`${hour.toString().padStart(2, '0')}:00`, `${hour.toString().padStart(2, '0')}:30`]
}).flat().filter(Boolean)

const fetchSeats = async () => {
  if (!selectedLabForSeats.value) return
  loadingSeats.value = true
  try {
    const startStr = `${adminSelectDate.value} ${adminSelectTime.value}:00`
    const endStr = `${adminSelectDate.value} ${adminSelectTime.value}:01`
    
    // Use admin endpoint so we get plain seat list without student booking enrichment
    const res = await request.get(`/admin/seat/list?labId=${selectedLabForSeats.value.id}&startTime=${startStr}&endTime=${endStr}`)
    if (res.code === 200) {
      seats.value = res.data || []
    }
  } catch (e) {
    console.error(e)
  } finally {
    loadingSeats.value = false
  }
}

const getSeatStatusClass = (seat) => {
  if (seat.status === 'FREE') return 'free'
  if (seat.status === 'BOOKED' || seat.status === 'IN_USE') return 'booked'
  if (seat.status === 'MAINTENANCE') return 'maintenance'
  return ''
}

// Single click: toggle select/deselect
const toggleAdminSelect = (seat) => {
  if (seat.status === 'BOOKED' || seat.status === 'IN_USE') return
  const idx = selectedSeatIds.value.indexOf(seat.id)
  if (idx === -1) selectedSeatIds.value.push(seat.id)
  else selectedSeatIds.value.splice(idx, 1)
}

// Select all FREE seats
const selectAllFreeSeats = () => {
  selectedSeatIds.value = seats.value.filter(s => s.status === 'FREE').map(s => s.id)
}

// Batch set status
const batchSetStatus = async (status) => {
  if (selectedSeatIds.value.length === 0) return
  const label = status === 'MAINTENANCE' ? '维护' : '空闲'
  if (!confirm(`确定将选中的 ${selectedSeatIds.value.length} 个座位设为「${label}」吗？`)) return
  try {
    const res = await request.put('/admin/seat/status/batch', {
      seatIds: selectedSeatIds.value,
      status,
      maintenanceReason: status === 'MAINTENANCE' ? '管理员统一维护' : null
    })
    if (res.code === 200) {
      selectedSeatIds.value.forEach(id => {
        const s = seats.value.find(x => x.id === id)
        if (s) { s.status = status; if (status === 'FREE') s.maintenanceReason = null }
      })
      selectedSeatIds.value = []
    } else { alert(res.msg) }
  } catch (e) { console.error(e) }
}

// Resize lab seat count
const resizeSeats = async () => {
  if (!newSeatCount.value || newSeatCount.value < 1) { alert('请输入有效座位数'); return }
  if (!confirm(`确定将「${selectedLabForSeats.value.name}」座位数调整为 ${newSeatCount.value} 个吗？`)) return
  try {
    const res = await request.put('/admin/seat/resize', {
      labId: selectedLabForSeats.value.id,
      totalSeats: newSeatCount.value
    })
    if (res.code === 200) {
      alert('座位数量调整成功！')
      selectedLabForSeats.value.totalSeats = newSeatCount.value
      await fetchSeats()
    } else { alert(res.msg) }
  } catch (e) { console.error(e); alert('操作失败') }
}

const editingLabManager = ref({
  name: '',
  email: '',
  isEditing: false,
})

const editLabManager = (lab) => {
  editingLabManager.value.name = lab.managerName
  editingLabManager.value.email = lab.managerEmail
  editingLabManager.value.isEditing = true
}

const cancelEditLabManager = () => {
  editingLabManager.value.isEditing = false
}

const saveLabManager = async () => {
  if (!selectedLabForSeats.value) return
  if (!editingLabManager.value.name || !editingLabManager.value.email) {
    showMessage('保存失败', '姓名和邮箱不能为空', 'error')
    return
  }
  try {
    const res = await request.put('/admin/lab/manager', {
      id: selectedLabForSeats.value.id,
      managerName: editingLabManager.value.name,
      managerEmail: editingLabManager.value.email
    })
    if (res.code === 200) {
      showMessage('保存成功', '实验室负责人信息已更新')
      selectedLabForSeats.value.managerName = editingLabManager.value.name
      selectedLabForSeats.value.managerEmail = editingLabManager.value.email
      editingLabManager.value.isEditing = false
    } else {
      showMessage('保存失败', res.msg || '更新失败', 'error')
    }
  } catch (error) {
    showMessage('保存失败', error.message || '网络错误', 'error')
  }
}

// Lab Image Management
const labImageInput = ref(null)
const labImageFile = ref(null)
const labImagePreviewUrl = ref(null)
const uploadingImage = ref(false)
const labImageUrlInput = ref('')

const saveLabImageUrl = async () => {
  if (!selectedLabForSeats.value || !labImageUrlInput.value.trim()) return
  
  try {
    const res = await request.put('/admin/lab/image', {
      id: selectedLabForSeats.value.id,
      labImageUrl: labImageUrlInput.value.trim()
    })
    if (res.code === 200) {
      showMessage('保存成功', '实验室图片 URL 已更新')
      selectedLabForSeats.value.labImageUrl = labImageUrlInput.value.trim()
      labImagePreviewUrl.value = labImageUrlInput.value.trim()
      labImageFile.value = null
    } else {
      showMessage('保存失败', res.msg, 'error')
    }
  } catch (error) {
    showMessage('保存失败', error.message || '网络错误', 'error')
  }
}

const triggerLabImageUpload = () => {
  labImageInput.value.click()
}

const handleLabImageFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    labImageFile.value = file
    labImagePreviewUrl.value = URL.createObjectURL(file)
  } else {
    labImageFile.value = null
    labImagePreviewUrl.value = null
  }
}

const uploadLabImage = async () => {
  if (!labImageFile.value || !selectedLabForSeats.value) return
  
  if (labImageFile.value.size > 2 * 1024 * 1024) {
    showMessage('上传失败', '文件大小不能超过 2MB', 'error')
    return
  }

  uploadingImage.value = true
  try {
    // 1. Upload image file to get URL
    const formData = new FormData()
    formData.append('file', labImageFile.value)
    const uploadRes = await request.post('/common/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-type' }
    })

    if (uploadRes.code !== 200 || !uploadRes.data) {
      showMessage('上传失败', uploadRes.msg || '图片上传失败', 'error')
      return
    }
    const imageUrl = uploadRes.data

    // 2. Update lab with the new image URL
    const updateRes = await request.put('/admin/lab/image', {
      id: selectedLabForSeats.value.id,
      labImageUrl: imageUrl
    })

    if (updateRes.code === 200) {
      showMessage('保存成功', '实验室图片已更新')
      selectedLabForSeats.value.labImageUrl = imageUrl
      labImagePreviewUrl.value = imageUrl // Fix: update preview URL immediately
      labImageFile.value = null // Clear file after successful upload
    } else {
      showMessage('保存失败', updateRes.msg || '更新实验室图片失败', 'error')
    }
  } catch (error) {
    showMessage('上传失败', error.message || '网络错误', 'error')
  } finally {
    uploadingImage.value = false
  }
}

const removeLabImage = async () => {
  if (!selectedLabForSeats.value) return
  try {
    const res = await request.put('/admin/lab/image', {
      id: selectedLabForSeats.value.id,
      labImageUrl: null // Set to null to remove image
    })
    if (res.code === 200) {
      showMessage('移除成功', '实验室图片已移除')
      selectedLabForSeats.value.labImageUrl = null
      labImageFile.value = null
      labImagePreviewUrl.value = null
    } else {
      showMessage('移除失败', res.msg || '移除实验室图片失败', 'error')
    }
  } catch (error) {
    showMessage('移除失败', error.message || '网络错误', 'error')
  }
}

// 3. Feedbacks
const feedbacks = ref([])
const fetchFeedbacks = async () => {
  try {
    const res = await request.get('/admin/feedback/page?current=1&size=50')
    if (res.code === 200) {
      feedbacks.value = (res.data.records || res.data.list || []).map(f => ({ ...f, replyInput: '' }))
    }
  } catch (e) {
    console.error(e)
  }
}

const formatFbStatus = (s) => s === 'PENDING' ? '待处理' : (s === 'PROCESSING' ? '处理中' : '已解决')

const formatBookStatus = (s) => {
  const map = { 'PENDING': '待签到', 'CHECKED_IN': '已签到', 'FINISHED': '已结束', 'CANCELLED': '已取消' }
  return map[s] || s
}

const replyFeedback = async (fb, targetStatus) => {
  if (!fb.replyInput && targetStatus !== 'RESOLVED') {
    alert('请填写回复内容')
    return
  }
  try {
    const res = await request.put('/admin/feedback/reply', {
      id: fb.feedbackId || fb.id,
      status: targetStatus,
      adminReply: fb.replyInput || '问题已解决'
    })
    if (res.code === 200) {
      alert('回复已提交')
      fetchFeedbacks()
    } else {
      alert(res.msg)
    }
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchLabs()
  fetchReservations()
  fetchFeedbacks()
})

</script>

<style scoped>
.content-container {
  display: flex;
  gap: 20px;
  padding: 0 30px;
  max-width: 1400px;
  margin: 0 auto;
}

@media (max-width: 1024px) {
  .content-container {
    padding: 0 15px;
  }
}

@media (max-width: 768px) {
  .content-container {
    flex-direction: column;
  }
  .tabs-sidebar {
    width: 100%;
    margin-bottom: 20px;
  }
  .lab-cards {
    grid-template-columns: 1fr;
  }
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-bar input, .filter-bar select {
    width: 100% !important;
  }
  .glass-table {
    display: block;
    overflow-x: auto;
  }
}

.tabs-sidebar {
  width: 250px;
}

.main-content {
  flex: 1;
}

.tab-list {
  list-style: none;
  padding: 0; margin: 0;
}

.tab-list li {
  padding: 15px 20px;
  border-bottom: 1px solid var(--glass-border);
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
}

.tab-list li:hover {
  background: rgba(255, 255, 255, 0.4);
}

.tab-list li.active {
  background: rgba(79, 70, 229, 0.2);
  border-left: 4px solid var(--primary);
  color: var(--primary);
}

/* Glass Table */
.glass-table {
  width: 100%;
  border-collapse: collapse;
}

.glass-table th, .glass-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid var(--glass-border);
}

.glass-table th {
  background: rgba(255, 255, 255, 0.2);
  font-weight: 600;
}

.glass-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.1);
}

.filter-bar {
  display: flex;
  gap: 15px;
  align-items: center;
}

.lab-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.lab-config-card {
  padding: 20px;
}

.text-success { color: var(--success); font-weight:bold; }
.text-danger { color: var(--danger); font-weight:bold; }

.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}
.flex-col { display: flex; flex-direction: column; }
.p-4 { padding: 16px; }
.text-sm { font-size: 0.9rem; }
.text-muted { color: var(--text-muted); }
.mb-2 { margin-bottom: 8px; }
.status-badge { padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: bold; }
.status-badge.pending { background: var(--warning); color: #000; }
.status-badge.processing { background: var(--primary); color: #fff; }
.status-badge.resolved { background: var(--success); color: #fff; }
.sm { padding: 6px 12px; font-size: 0.8rem; }

/* ---------------- 3D Seat Visualization ---------------- */
.justify-between { display: flex; justify-content: space-between; }
.align-center { align-items: center; }

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
  margin-top: 20px;
}

.seat-grid {
  display: grid;
  gap: 30px;
  padding: 30px;
  width: 100%;
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
  border-color: #6366f1;
}

.seat-no {
  font-size: 1.2rem;
  font-weight: bold;
  opacity: 0.8;
}

.seat.free {
  border-color: #4ade80;
  background: #f0fdf4;
}

.seat.booked, .seat.in-use {
  background: #fef2f2;
  border-color: #f87171;
}

.seat.maintenance {
  background: repeating-linear-gradient(45deg, rgba(200,200,200,0.1), rgba(200,200,200,0.1) 10px, rgba(100,100,100,0.1) 10px, rgba(100,100,100,0.1) 20px);
  border-color: rgba(150, 150, 150, 0.5);
}

.seat-avatar, .seat-avatar-placeholder {
  position: absolute;
  top: -15px;
  width: 45px;
  height: 45px;
  border-radius: 50%;
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  object-fit: cover;
  border: 2px solid #fff;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.watermark-info {
  position: absolute;
  bottom: 15px;
  left: 20px;
  font-size: 0.85rem;
  color: rgba(255,255,255,0.6);
  pointer-events: none;
  font-weight: 500;
}

/* ── Seat Management Panel ── */
.manage-section {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.14);
  border-radius: 12px;
  padding: 14px 18px;
}

.manage-section-title {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 10px;
  letter-spacing: 0.02em;
}

.active-col {
  background: var(--primary) !important;
  color: #fff !important;
  box-shadow: 0 3px 10px rgba(79,70,229,0.35);
}

/* Seat selected in admin batch mode */
.seat-selected-admin {
  outline: 3px solid #6366f1 !important;
  outline-offset: 2px;
}

.seat-check {
  position: absolute;
  top: 2px;
  right: 4px;
  font-size: 0.7rem;
  color: #6366f1;
  font-weight: 900;
  line-height: 1;
}

/* Seat Renaming */
.seat-rename-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: white;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.rename-inp {
  width: 90%;
  font-size: 0.8rem;
  border: 1px solid var(--primary);
  border-radius: 2px;
  text-align: center;
  padding: 2px 0;
  outline: none;
}

/* Admin Modals */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999;
}

.quick-modal {
  background: #fff;
  border-radius: 16px;
  padding: 28px 32px;
  min-width: 380px;
  max-width: 480px;
  box-shadow: 0 16px 48px rgba(0,0,0,0.25);
}

.quick-modal h3 {
  font-size: 1.2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.text-danger { color: #ef4444; }

.status-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
}
.status-badge.pending { background: #fef3c7; color: #92400e; }
.status-badge.checked_in { background: #d1fae5; color: #065f46; }
.status-badge.finished { background: #e2e8f0; color: #475569; }
.status-badge.cancelled { background: #fee2e2; color: #991b1b; }

/* Custom per-row layout */
.custom-rows-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.custom-seat-row {
  display: grid;
  gap: 8px;
}

.custom-row-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 260px;
  overflow-y: auto;
  padding: 8px;
  background: rgba(0,0,0,0.06);
  border-radius: 8px;
}

.custom-row-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.row-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-muted);
  width: 48px;
  flex-shrink: 0;
}

.icon-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background 0.15s;
}
.icon-btn.danger { color: #ef4444; }
.icon-btn.danger:hover { background: #fee2e2; }
</style>
