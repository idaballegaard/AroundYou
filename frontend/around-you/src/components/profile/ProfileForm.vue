<template>
  <form class="mt-6 grid gap-4 sm:grid-cols-2" @submit.prevent="emit('submit')">
    <div class="rounded-2xl border border-[#094b7b]/15 bg-[#C1D2DE]/40 px-4 py-4 sm:col-span-2">
      <label class="grid gap-2">
        <span class="text-sm font-semibold text-slate-700">Avatar billede</span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          class="block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-[#094b7b] file:px-3 file:py-2 file:font-semibold file:text-white"
          @change="emit('avatar-selected', $event)"
        />
      </label>
      <p v-if="avatarFile" class="mt-2 break-all text-xs font-semibold text-slate-600">
        Valgt: {{ avatarFile.name }}
      </p>
      <p v-if="avatarError" class="mt-2 text-sm font-semibold text-rose-700">
        {{ avatarError }}
      </p>
    </div>

    <label class="grid gap-2 sm:col-span-2">
      <span class="text-sm font-semibold text-slate-700">Brugernavn</span>
      <input
        v-model="user.userName"
        class="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#094b7b] focus:ring-4 focus:ring-[#C1D2DE]/60"
      />
    </label>

    <label class="grid gap-2 sm:col-span-2">
      <span class="text-sm font-semibold text-slate-700">Email</span>
      <input
        v-model="user.email"
        type="email"
        class="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#094b7b] focus:ring-4 focus:ring-[#C1D2DE]/60"
      />
    </label>

    <label class="grid gap-2">
      <span class="text-sm font-semibold text-slate-700">Fornavn</span>
      <input
        v-model="user.firstName"
        class="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#094b7b] focus:ring-4 focus:ring-[#C1D2DE]/60"
      />
    </label>

    <label class="grid gap-2">
      <span class="text-sm font-semibold text-slate-700">Efternavn</span>
      <input
        v-model="user.lastName"
        class="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#094b7b] focus:ring-4 focus:ring-[#C1D2DE]/60"
      />
    </label>

    <button
      type="submit"
      class="rounded-full bg-[#094b7b] px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(9,75,123,0.18)] transition hover:bg-[#0b5d98] disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
      :disabled="loading || uploadingAvatar"
    >
      {{ loading || uploadingAvatar ? 'Gemmer...' : 'Gem ændringer' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import type { User } from '@/types/user'

defineProps<{
  avatarError: string
  avatarFile: File | null
  loading: boolean
  uploadingAvatar: boolean
  user: User
}>()

const emit = defineEmits<{
  'avatar-selected': [event: Event]
  submit: []
}>()
</script>
