<template>
  <div
    v-if="isOpen"
    class="basis-full rounded-2xl border border-[#094b7b]/10 bg-white p-4 shadow-sm md:hidden"
  >
    <div class="flex flex-col gap-2">
      <RouterLink :to="{ name: 'home' }" :class="getNavLinkClass('home')" @click="emit('close')">
        Hjem
      </RouterLink>
      <RouterLink
        :to="{ name: 'search' }"
        :class="getNavLinkClass('search')"
        @click="emit('close')"
      >
        Udforsk
      </RouterLink>
      <RouterLink
        :to="{ name: 'create' }"
        :class="getNavLinkClass('create')"
        @click="emit('close')"
      >
        Tilføj
      </RouterLink>
      <RouterLink
        :to="{ name: 'contact' }"
        :class="getNavLinkClass('contact')"
        @click="emit('close')"
      >
        Kontakt
      </RouterLink>

      <template v-if="isAuthenticated">
        <span class="rounded-full bg-[#C1D2DE] px-4 py-2 text-sm font-medium text-[#094b7b]">
          Velkommen {{ displayUserName }}
        </span>

        <RouterLink
          v-if="showAdminLink"
          :to="{ name: 'admin' }"
          :class="getNavLinkClass('admin')"
          @click="emit('close')"
        >
          Admin
        </RouterLink>

        <RouterLink
          :to="{ name: 'user-profile' }"
          class="rounded-full px-4 py-2 text-sm font-semibold text-[#094b7b] transition hover:bg-[#C1D2DE]"
          @click="emit('close')"
        >
          Profil
        </RouterLink>

        <button
          type="button"
          class="rounded-full px-4 py-2 text-left text-sm font-semibold text-[#094b7b] transition hover:bg-[#C1D2DE]"
          @click="emit('logout')"
        >
          Log ud
        </button>
      </template>

      <template v-else>
        <RouterLink
          to="/auth/login"
          class="rounded-full px-4 py-2 text-sm font-semibold text-[#094b7b] transition hover:bg-[#C1D2DE]"
          @click="emit('close')"
        >
          Login
        </RouterLink>
        <RouterLink
          to="/auth/register"
          class="rounded-full bg-[#094b7b] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_25px_rgba(9,75,123,0.18)] transition hover:bg-[#0b5d98]"
          @click="emit('close')"
        >
          Opret konto
        </RouterLink>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineProps<{
  displayUserName: string
  getNavLinkClass: (routeName: string) => string[]
  isAuthenticated: boolean
  isOpen: boolean
  showAdminLink: boolean
}>()

const emit = defineEmits<{
  close: []
  logout: []
}>()
</script>
