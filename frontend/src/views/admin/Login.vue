<template>
  <div class="login-container">
    <div class="login-box">
      <GlassCard title="管理员登录">
        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label>工号</label>
            <input v-model="form.account" type="text" class="glass-input" placeholder="请输入工号" required pattern="\d{6,12}" />
          </div>
          <div class="form-group mt-4">
            <label>密码</label>
            <input v-model="form.password" type="password" class="glass-input" placeholder="请输入密码" required />
          </div>
          <div v-if="errorMsg" class="error-msg mt-2">{{ errorMsg }}</div>
          <button type="submit" class="glass-button w-full mt-4" :disabled="loading">
            {{ loading ? '登录中...' : '登 录' }}
          </button>
          
          <div class="student-link mt-4 text-center" style="display:flex; justify-content:space-around;">
            <router-link to="/admin/register">注册管理员账号</router-link>
            <router-link to="/student/login">学生登录入口</router-link>
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
  password: ''
})
const loading = ref(false)
const errorMsg = ref('')

const handleLogin = async () => {
  if (loading.value) return
  loading.value = true
  errorMsg.value = ''
  
  try {
    const res = await request.post('/common/login/admin', form.value)
    if (res.code === 200) {
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.userInfo))
      router.push('/admin/dashboard')
    } else {
      errorMsg.value = res.msg || '登录失败'
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
  max-width: 400px;
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

.error-msg {
  color: var(--danger);
  font-size: 0.9rem;
  text-align: center;
}

.student-link {
  border-top: 1px solid rgba(255,255,255,0.2);
  padding-top: 15px;
}

.student-link a {
  color: var(--primary);
  text-decoration: none;
  font-size: 0.9rem;
}

.student-link a:hover {
  text-decoration: underline;
}
</style>
