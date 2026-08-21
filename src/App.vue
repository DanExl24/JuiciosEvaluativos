<script setup lang="ts">
import { ref } from 'vue'
import AppHeader from './components/layout/AppHeader.vue'
import ImportsHistoryModal from './features/imports/views/ImportsHistoryModal.vue'

const isImportsModalOpen = ref(false)
const headerHeight = ref(56)

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
    class="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 pb-8 sm:px-6 lg:px-8"
    :style="{ paddingTop: `${headerHeight + 20}px` }"
  >
    <router-view />
  </main>

  <ImportsHistoryModal
    :open="isImportsModalOpen"
    @close="isImportsModalOpen = false"
  />
</template>
