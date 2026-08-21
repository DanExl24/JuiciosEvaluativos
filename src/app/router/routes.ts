import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/import',
  },
  {
    path: '/import',
    name: 'import',
    component: () => import('../../features/imports/views/ImportWorkspaceView.vue'),
    meta: { title: 'Cargar CSV/Excel - Juicios Evaluativos' },
  },
  {
    path: '/phases',
    name: 'phases',
    component: () => import('../../features/project-phases/views/ProjectPhasesView.vue'),
    meta: { title: 'Fases del Proyecto - Juicios Evaluativos' },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../../features/dashboard/views/DashboardGeneralView.vue'),
    meta: { title: 'Dashboard General - Juicios Evaluativos' },
  },
  {
    path: '/tracking',
    name: 'tracking',
    component: () => import('../../features/academic-tracking/views/AcademicTrackingView.vue'),
    meta: { title: 'Seguimiento Curricular - Juicios Evaluativos' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/import',
  },
]
