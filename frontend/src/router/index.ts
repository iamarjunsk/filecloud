import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LoginPage from '@/pages/LoginPage.vue'
import RegisterPage from '@/pages/RegisterPage.vue'
import FilesPage from '@/pages/FilesPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginPage,
      meta: { guest: true },
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterPage,
      meta: { guest: true },
    },
    {
      path: '/',
      redirect: '/files',
    },
    {
      path: '/files',
      name: 'files',
      component: FilesPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/files/:folderId',
      name: 'files-folder',
      component: FilesPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/shared',
      name: 'shared',
      component: () => import('@/pages/SharedPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/trash',
      name: 'trash',
      component: () => import('@/pages/TrashPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/pages/SettingsPage.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  if (!authStore.accessToken && localStorage.getItem('accessToken')) {
    authStore.initialize()
  }

  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      return next('/login')
    }
  }

  if (to.meta.guest) {
    if (authStore.isAuthenticated) {
      return next('/files')
    }
  }

  next()
})

export default router
