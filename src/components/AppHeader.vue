<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

type AppView = 'import' | 'dashboard' | 'competencies'

defineProps<{
  activeView: AppView
}>()

const emit = defineEmits<{
  (event: 'navigate', view: AppView): void
  (event: 'open-imports'): void
  (event: 'height-change', height: number): void
}>()

const views: Array<{ id: AppView; label: string; description: string }> = [
  { id: 'import', label: 'Cargar CSV', description: 'Importacion y control de carga' },
  { id: 'dashboard', label: 'Dashboard general', description: 'Metricas y panorama general' },
  { id: 'competencies', label: 'Competencias y resultados', description: 'Consulta detallada por ficha' },
]

const headerElement = ref<HTMLElement | null>(null)
let resizeObserver: ResizeObserver | null = null

function emitHeight() {
  emit('height-change', headerElement.value?.offsetHeight ?? 0)
}

onMounted(async () => {
  await nextTick()
  emitHeight()

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => emitHeight())
    if (headerElement.value) {
      resizeObserver.observe(headerElement.value)
    }
  }

  window.addEventListener('resize', emitHeight)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  window.removeEventListener('resize', emitHeight)
})
</script>

<template>
  <header ref="headerElement" class="fixed inset-x-0 top-0 z-40 border-b border-emerald-950/10 bg-white/88 backdrop-blur">
    <div class="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p class="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-emerald-700">Juicios evaluativos</p>
          <h1 class="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950 sm:text-3xl">
            Seguimiento academico por dashboard, ficha, competencias y resultados.
          </h1>
          <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Navega entre la carga de archivos, el resumen general y la consulta detallada sin perder el contexto del proyecto.
          </p>
        </div>

        <button
          class="inline-flex rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          type="button"
          @click="emit('open-imports')"
        >
          Archivos importados
        </button>
      </div>

      <nav class="grid gap-3 md:grid-cols-3">
        <button
          v-for="view in views"
          :key="view.id"
          class="rounded-[1.5rem] border px-4 py-4 text-left transition"
          :class="
            activeView === view.id
              ? 'border-emerald-400 bg-emerald-50 shadow-[0_12px_40px_rgba(16,185,129,0.12)]'
              : 'border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40'
          "
          type="button"
          @click="emit('navigate', view.id)"
        >
          <p class="text-sm font-semibold text-slate-950">{{ view.label }}</p>
          <p class="mt-1 text-xs text-slate-500">{{ view.description }}</p>
        </button>
      </nav>
    </div>
  </header>
</template>
