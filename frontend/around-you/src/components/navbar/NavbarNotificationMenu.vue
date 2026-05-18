<template>
  <div class="relative">
    <button
      type="button"
      class="relative rounded-full border border-[#094b7b]/12 px-3 py-2 text-sm font-bold text-[#094b7b] transition hover:bg-[#C1D2DE]"
      aria-haspopup="menu"
      :aria-expanded="isOpen"
      aria-label="Notifikationer"
      @click.stop="emit('toggle')"
    >
      Notifikationer
      <span
        v-if="unreadCount"
        class="absolute -right-1 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#de5826] px-1 text-[0.68rem] font-black text-white"
      >
        {{ unreadCount }}
      </span>
    </button>

    <div
      v-if="isOpen"
      class="absolute right-0 top-full mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#094b7b] bg-white shadow-[0_22px_60px_rgba(9,75,123,0.2)]"
      role="menu"
    >
      <div class="border-b border-[#094b7b]/8 px-4 py-3">
        <p class="text-sm font-black text-[#094b7b]">Notifikationer</p>
        <div v-if="notifications.length" class="mt-2 flex flex-wrap items-center gap-3">
          <button
            v-if="unreadCount"
            type="button"
            class="text-xs font-bold text-[#de5826]"
            @click="emit('mark-all-read')"
          >
            Marker alle læst
          </button>
          <button type="button" class="text-xs font-bold text-rose-700" @click="emit('remove-all')">
            Fjern alle
          </button>
        </div>
      </div>

      <p v-if="error" class="px-4 py-3 text-sm font-semibold text-rose-700">
        {{ error }}
      </p>
      <p v-else-if="isLoading" class="px-4 py-3 text-sm font-semibold text-slate-500">
        Henter notifikationer...
      </p>
      <p v-else-if="!notifications.length" class="px-4 py-3 text-sm font-semibold text-slate-500">
        Ingen notifikationer endnu.
      </p>
      <div v-else class="max-h-96 overflow-y-auto">
        <button
          v-for="notification in notifications"
          :key="notification._id"
          type="button"
          class="block w-full border-b border-slate-100 px-4 py-3 text-left transition hover:bg-[#C1D2DE]/45"
          :class="notification.readAt ? 'bg-white' : 'bg-[#C1D2DE]/25'"
          role="menuitem"
          @click="emit('mark-read', notification._id)"
        >
          <span class="block text-sm font-black text-slate-900">
            {{ notification.title }}
          </span>
          <span class="mt-1 block text-sm leading-relaxed text-slate-600">
            {{ notification.message }}
          </span>
          <span class="mt-2 block text-xs font-bold text-slate-400">
            {{ formatNotificationDate(notification.createdAt) }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AppNotification } from '@/types/notification'

defineProps<{
  error: string
  isLoading: boolean
  isOpen: boolean
  notifications: AppNotification[]
  unreadCount: number
}>()

const emit = defineEmits<{
  'mark-all-read': []
  'mark-read': [id: string]
  'remove-all': []
  toggle: []
}>()

function formatNotificationDate(value: string): string {
  return new Date(value).toLocaleString('da-DK', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>
