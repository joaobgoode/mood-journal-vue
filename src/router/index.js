import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../components/LoginView.vue'
import Journal from '../components/Journal.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: LoginView,
  },
  {
    path: '/mood',
    name: 'Mood',
    component: Journal,
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const access = localStorage.getItem('access')
  const refresh = localStorage.getItem('refresh')

  if (requiresAuth && (!access || !refresh)) {
    next('/')
  } else {
    next()
  }
})

export default router
