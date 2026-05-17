import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      component: () => import('../layouts/MainLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('../views/DashboardView.vue'),
          meta: { roles: ['admin'] }
        },
        {
          path: 'tables',
          name: 'tables',
          component: () => import('../views/TablesView.vue'),
          meta: { roles: ['admin', 'staff'] }
        },
        {
          path: 'inventory',
          name: 'inventory',
          component: () => import('../views/InventoryView.vue'),
          meta: { roles: ['admin', 'staff'] }
        },
        {
          path: 'finance',
          name: 'finance',
          component: () => import('../views/FinanceView.vue'),
          meta: { roles: ['admin'] }
        },
        {
          path: 'debts',
          name: 'debts',
          component: () => import('../views/DebtView.vue'),
          meta: { roles: ['admin'] }
        },
        {
          path: 'reports',
          name: 'reports',
          component: () => import('../views/ReportsView.vue'),
          meta: { roles: ['admin'] }
        }
      ]
    }
  ]
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  await authStore.initPromise;
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } else if (to.name === 'login' && authStore.isAuthenticated) {
    const userRole = authStore.user?.role || 'admin';
    if (userRole === 'admin') {
      next('/');
    } else {
      next('/tables');
    }
  } else if (authStore.isAuthenticated) {
    const userRole = authStore.user?.role || 'admin';
    const allowedRoles = to.meta.roles as string[] | undefined;
    if (allowedRoles && !allowedRoles.includes(userRole)) {
      if (userRole === 'admin') {
        next('/');
      } else {
        next('/tables');
      }
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router;
