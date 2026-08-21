<script setup lang="ts">
import { ref } from 'vue'
import AppHeader from './components/layout/AppHeader.vue'
import ImportsHistoryModal from './features/imports/views/ImportsHistoryModal.vue'

const isImportsModalOpen = ref(false)
const headerHeight = ref(0)

function openImportsModal() {
  isImportsModalOpen.value = true
}
</script>

<template>
  <AppHeader
    @open-imports="openImportsModal"
    @height-change="headerHeight = $event"
  />

  <main
    class="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 pb-6 sm:px-6 lg:px-8 lg:pb-10"
    :style="{ paddingTop: `${headerHeight + 24}px` }"
  >
    <div class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_58%)]"></div>

    <router-view />
  </main>

  <ImportsHistoryModal
    :open="isImportsModalOpen"
    @close="isImportsModalOpen = false"
  />
</template>
