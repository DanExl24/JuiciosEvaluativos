<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const navItems = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
  },
  {
    path: '/phases',
    label: 'Fases',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  },
  {
    path: '/tracking',
    label: 'Seguimiento',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  },
  {
    path: '/consulta',
    label: 'Consulta',
    icon: 'M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z',
  },
  {
    path: '/import',
    label: 'Cargar',
    icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
  },
]

const currentPath = computed(() => route.path)

function navigateTo(path: string) {
  router.push(path)
}
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-40 md:hidden border-t border-slate-200/90 bg-white/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]"
    aria-label="Navegación Móvil"
  >
    <div class="grid grid-cols-5 h-15 items-center px-1">
      <button
        v-for="item in navItems"
        :key="item.path"
        type="button"
        class="flex flex-col items-center justify-center h-full w-full gap-1 transition-all active:scale-95 cursor-pointer relative"
        :class="currentPath === item.path ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800 font-medium'"
        @click="navigateTo(item.path)"
      >
        <!-- Top active pill indicator -->
        <span
          v-if="currentPath === item.path"
          class="absolute top-0 h-0.5 w-8 rounded-full bg-emerald-600 animate-in fade-in duration-200"
        ></span>

        <div
          class="flex h-7 w-12 items-center justify-center rounded-full transition-colors"
          :class="currentPath === item.path ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500'"
        >
          <svg
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            :stroke-width="currentPath === item.path ? 2.5 : 2"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
          </svg>
        </div>

        <span class="text-[0.65rem] tracking-tight leading-none">
          {{ item.label }}
        </span>
      </button>
    </div>
  </nav>
</template>
