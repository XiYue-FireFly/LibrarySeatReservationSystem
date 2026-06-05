import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  // Student Portal
  {
    path: '/',
    redirect: '/student/login'
  },
  {
    path: '/student/login',
    name: 'StudentLogin',
    component: () => import('../views/student/Login.vue')
  },
  {
    path: '/student/register',
    name: 'StudentRegister',
    component: () => import('../views/student/Register.vue')
  },
  {
    path: '/student/home',
    name: 'StudentHome',
    component: () => import('../views/student/Home.vue'),
    meta: { requiresAuth: true, role: 'STUDENT' }
  },
  {
    path: '/student/profile',
    name: 'StudentProfile',
    component: () => import('../views/student/Profile.vue'),
    meta: { requiresAuth: true, role: 'STUDENT' }
  },
  {
    path: '/student/notifications',
    name: 'StudentNotifications',
    component: () => import('../views/student/Notifications.vue'),
    meta: { requiresAuth: true, role: 'STUDENT' }
  },
  // Admin Portal
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('../views/admin/Login.vue')
  },
  {
    path: '/admin/register',
    name: 'AdminRegister',
    component: () => import('../views/admin/Register.vue')
  },
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: () => import('../views/admin/Dashboard.vue'),
    meta: { requiresAuth: true, role: 'ADMIN' }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Navigation Guard
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  
  if (to.meta.requiresAuth) {
    if (!token) {
      if (to.path.startsWith('/admin')) {
        next('/admin/login')
      } else {
        next('/student/login')
      }
    } else {
      if (to.meta.role === 'ADMIN' && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        next('/student/home') // Redirect unauthorized
      } else if (to.meta.role === 'STUDENT' && user.role !== 'STUDENT') {
        next('/admin/dashboard')
      } else {
        next()
      }
    }
  } else {
    next()
  }
})

export default router
