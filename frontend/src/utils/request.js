import axios from 'axios'
import router from '../router'

const request = axios.create({
  baseURL: '/api', // Using proxy in vite.config.js
  timeout: 5000
})

// Request Interceptor
request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// Response Interceptor
request.interceptors.response.use(
  response => {
    const res = response.data
    // Assuming backend returns { code, msg, data, timestamp }
    if (res.code === 200) {
      return res
    } else {
      // Handle other codes
      return Promise.reject(new Error(res.msg || 'Error'))
    }
  },
  error => {
    console.error('Request Error:', error)
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/student/login')
    }
    return Promise.reject(error)
  }
)

export default request
