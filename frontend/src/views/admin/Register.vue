<template>
  <div class="login-container">
    <div class="login-box">
      <GlassCard title="管理员注册">
        <form @submit.prevent="handleRegister" class="login-form">
          <div class="form-group">
            <label>工号</label>
            <input v-model="form.account" @blur="checkAccount" type="text" class="glass-input" placeholder="请输入6-12位工号" />
            <span v-if="accountError" class="field-error">{{ accountError }}</span>
          </div>
          <div class="form-group mt-4">
            <label>真实姓名</label>
            <input v-model="form.name" type="text" class="glass-input" placeholder="请输入真实姓名" />
          </div>
          <div class="form-group mt-4">
            <label>密码</label>
            <input v-model="form.password" type="password" class="glass-input" placeholder="密码至少6位" />
          </div>
          <div class="form-group mt-4">
            <label>确认密码</label>
            <input v-model="form.confirmPassword" type="password" class="glass-input" placeholder="请再次输入密码" />
          </div>
          <div class="form-group mt-4">
            <label>选择头像</label>
            <div class="avatar-selector">
              <div v-for="a in presets" :key="a" 
                class="avatar-item" 
                :class="{ active: form.avatar === a }"
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

            <div class="avatar-preview mt-2">
              <span>预览：</span>
              <img :src="form.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin_preview'" class="preview-img" />
            </div>
          </div>
          <div v-if="errorMsg" class="error-msg mt-2">{{ errorMsg }}</div>
          <button type="submit" class="glass-button w-full mt-4" :disabled="loading || accountError !== ''">
            {{ loading ? '注册中...' : '注 册' }}
          </button>
          
          <div class="admin-link mt-4 text-center">
            <router-link to="/admin/login">已有管理员账号？返回登录</router-link>
          </div>
        </form>
      </GlassCard>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import GlassCard from '../../components/GlassCard.vue'
import request from '../../utils/request'

const router = useRouter()
const form = ref({
  account: '',
  name: '',
  password: '',
  confirmPassword: '',
  avatar: ''
})

const presets = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=Admin1',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Admin2',
  'https://api.dicebear.com/7.x/jdenticon/svg?seed=Admin3',
  'https://api.dicebear.com/7.x/jdenticon/svg?seed=Admin4',
  'https://api.dicebear.com/7.x/identicon/svg?seed=Admin5',
  'https://api.dicebear.com/7.x/identicon/svg?seed=Admin6'
]

const showCustomUrl = ref(false)
const customUrl = ref('')

const selectAvatar = (url) => {
  form.value.avatar = url
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
      form.value.avatar = res.data
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
  if (showCustomUrl.value) {
    form.value.avatar = customUrl.value
  }
}

let timer = null
const debouncedCustomAvatar = () => {
  clearTimeout(timer)
  timer = setTimeout(() => {
    form.value.avatar = customUrl.value
  }, 500)
}
const loading = ref(false)
const errorMsg = ref('')
const accountError = ref('')

const checkAccount = async () => {
  if (!form.value.account || form.value.account.length < 6) return;
  try {
    const res = await request.get(`/common/check-account?account=${form.value.account}&type=ADMIN`)
    if (res.code === 200 && res.data.isExist) {
      accountError.value = '该工号已被注册'
    } else {
      accountError.value = ''
    }
  } catch (e) {
    console.error(e)
  }
}

const handleRegister = async () => {
  if (loading.value) return
  errorMsg.value = ''
  
  if (!form.value.account || !/^\d{6,12}$/.test(form.value.account)) {
    errorMsg.value = '工号必须是6-12位纯数字'
    return
  }
  
  if (!form.value.name) {
    errorMsg.value = '真实姓名不能为空'
    return
  }
  
  if (!form.value.password || form.value.password.length < 6) {
    errorMsg.value = '密码至少6位字符'
    return
  }
  
  if (form.value.password !== form.value.confirmPassword) {
    errorMsg.value = '两次输入的密码不一致'
    return
  }

  loading.value = true
  
  try {
    const res = await request.post('/common/register/admin', {
      account: form.value.account,
      name: form.value.name,
      password: form.value.password,
      avatar: form.value.avatar
    })
    
    if (res.code === 200) {
      alert('注册成功，请重新登录')
      router.push('/admin/login')
    } else {
      errorMsg.value = res.msg || '注册失败'
    }
  } catch (err) {
    errorMsg.value = err.message || '网络连接失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-box {
  width: 100%;
  max-width: 450px;
  padding: 20px;
}

.login-form {
  display: flex;
  flex-direction: column;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.w-full {
  width: 100%;
  padding: 12px;
}

.error-msg, .field-error {
  color: var(--danger);
  font-size: 0.9rem;
  text-align: center;
}

.field-error {
  display: block;
  text-align: left;
  margin-top: 5px;
}

.admin-link a {
  color: var(--primary);
  text-decoration: none;
  font-size: 0.9rem;
}

.admin-link a:hover {
  text-decoration: underline;
}

.admin-link {
  border-top: 1px solid rgba(255,255,255,0.2);
  padding-top: 15px;
}

.avatar-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.avatar-item {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.avatar-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-item.active {
  border-color: var(--primary);
  transform: scale(1.1);
  box-shadow: 0 0 10px rgba(79, 70, 229, 0.4);
}

.avatar-item.custom-trigger {
  font-size: 1.2rem;
  background: rgba(255,255,255,0.2);
}

.avatar-item.upload-box {
  background: rgba(79, 70, 229, 0.1);
  border: 1px dashed var(--primary);
  font-size: 1.2rem;
}

.upload-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.avatar-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255,255,255,0.05);
  padding: 8px 12px;
  border-radius: 8px;
}

.preview-img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.2);
}

.glass-input.sm {
  padding: 8px 12px;
  font-size: 0.9rem;
}
</style>
