<template>
  <div class="relative">
    <button
      type="button"
      class="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-[#094b7b]/12 bg-gradient-to-br from-[#094b7b] to-[#de5826] text-sm font-bold text-white shadow-[0_10px_30px_rgba(9,75,123,0.18)] transition hover:scale-[1.02]"
      aria-haspopup="menu"
      :aria-expanded="isOpen"
      aria-label="Brugermenu"
      @click.stop="emit('toggle')"
    >
      <img
        v-if="displayUserAvatar"
        :src="displayUserAvatar"
        :alt="`${displayUserName} avatar`"
        class="h-full w-full object-cover"
      />
      <span v-else>{{ avatarInitials }}</span>
    </button>

    <div
      v-if="isOpen"
      class="absolute right-0 top-full mt-3 w-56 overflow-hidden rounded-3xl border border-[#094b7b] bg-white shadow-[0_22px_60px_rgba(9,75,123,0.2)]"
      role="menu"
    >
      <div class="border-b border-[#094b7b]/8 bg-[#FFF] px-5 py-4">
        <p class="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[#de5826]">
          Min konto
        </p>
        <p class="mt-1 text-sm font-semibold text-[#094b7b]">{{ displayUserName }}</p>
      </div>

      <RouterLink
        v-if="!isAdmin"
        :to="{ name: 'user-profile' }"
        class="block px-5 py-3 text-sm text-slate-700 transition hover:bg-[#C1D2DE] hover:text-[#094b7b]"
        role="menuitem"
        @click="emit('close')"
      >
        Profil
      </RouterLink>
      <button
        type="button"
        class="block w-full px-5 py-3 text-left text-sm text-slate-700 transition hover:bg-[#C1D2DE] hover:text-[#094b7b]"
        role="menuitem"
        @click="emit('logout')"
      >
        Log ud
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineProps<{
  avatarInitials: string
  displayUserAvatar: string
  displayUserName: string
  isAdmin: boolean
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
  logout: []
  toggle: []
}>()
</script>
