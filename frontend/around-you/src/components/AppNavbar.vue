<template>
  <header class="sticky top-0 z-50 border-b border-[#094b7b]/10 bg-white px-4 py-4">
    <nav
      ref="navRef"
      class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-y-3 px-1 py-1 md:px-2"
      aria-label="Primary"
    >
      <RouterLink
        to="/"
        class="inline-flex shrink-0 items-center transition hover:opacity-85"
        aria-label="AroundYou home"
        @click="closeMobileMenu"
      >
        <img :src="aroundYouLogo" alt="AroundYou" class="h-10 w-auto sm:h-12" />
      </RouterLink>

      <button
        type="button"
        class="inline-flex h-11 w-11 items-center justify-center text-[#094b7b] transition hover:text-[#0b5d98] md:hidden"
        aria-label="Åbn navigation"
        :aria-expanded="isMobileMenuOpen"
        @click="toggleMobileMenu"
      >
        <span class="text-xl leading-none">{{ isMobileMenuOpen ? '×' : '☰' }}</span>
      </button>

      <div
        class="hidden basis-full flex-wrap items-center justify-start gap-x-4 gap-y-3 md:ml-20 md:basis-auto md:flex md:flex-1 md:justify-end md:gap-x-8"
      >
        <RouterLink :to="{ name: 'home' }" :class="getNavLinkClass('home')">Hjem</RouterLink>
        <RouterLink :to="{ name: 'search' }" :class="getNavLinkClass('search')">Udforsk</RouterLink>
        <RouterLink :to="{ name: 'create' }" :class="getNavLinkClass('create')">Tilføj</RouterLink>
        <RouterLink :to="{ name: 'contact' }" :class="getNavLinkClass('contact')"
          >Kontakt</RouterLink
        >

        <template v-if="isAuthenticated">
          <span class="rounded-full bg-[#C1D2DE] px-4 py-2 text-sm font-medium text-[#094b7b]">
            Velkommen {{ displayUserName }}
          </span>

          <RouterLink
            v-if="showAdminLink"
            :to="{ name: 'admin' }"
            :class="getNavLinkClass('admin')"
          >
            Admin
          </RouterLink>

          <div class="relative">
            <button
              type="button"
              class="relative rounded-full border border-[#094b7b]/12 px-3 py-2 text-sm font-bold text-[#094b7b] transition hover:bg-[#C1D2DE]"
              aria-haspopup="menu"
              :aria-expanded="isNotificationMenuOpen"
              aria-label="Notifikationer"
              @click.stop="toggleNotificationMenu"
            >
              Notifikationer
              <span
                v-if="unreadNotificationCount"
                class="absolute -right-1 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#de5826] px-1 text-[0.68rem] font-black text-white"
              >
                {{ unreadNotificationCount }}
              </span>
            </button>

            <div
              v-if="isNotificationMenuOpen"
              class="absolute right-0 top-full mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#094b7b] bg-white shadow-[0_22px_60px_rgba(9,75,123,0.2)]"
              role="menu"
            >
              <div class="border-b border-[#094b7b]/8 px-4 py-3">
                <p class="text-sm font-black text-[#094b7b]">Notifikationer</p>
                <div v-if="notifications.length" class="mt-2 flex flex-wrap items-center gap-3">
                  <button
                    v-if="unreadNotificationCount"
                    type="button"
                    class="text-xs font-bold text-[#de5826]"
                    @click="markAllRead"
                  >
                    Marker alle læst
                  </button>
                  <button
                    type="button"
                    class="text-xs font-bold text-rose-700"
                    @click="removeAllNotifications"
                  >
                    Fjern alle
                  </button>
                </div>
              </div>

              <p v-if="notificationError" class="px-4 py-3 text-sm font-semibold text-rose-700">
                {{ notificationError }}
              </p>
              <p
                v-else-if="notificationsLoading"
                class="px-4 py-3 text-sm font-semibold text-slate-500"
              >
                Henter notifikationer...
              </p>
              <p
                v-else-if="!notifications.length"
                class="px-4 py-3 text-sm font-semibold text-slate-500"
              >
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
                  @click="markRead(notification._id)"
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

          <div class="relative">
            <button
              type="button"
              class="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-[#094b7b]/12 bg-gradient-to-br from-[#094b7b] to-[#de5826] text-sm font-bold text-white shadow-[0_10px_30px_rgba(9,75,123,0.18)] transition hover:scale-[1.02]"
              aria-haspopup="menu"
              :aria-expanded="isAvatarMenuOpen"
              aria-label="Brugermenu"
              @click.stop="toggleAvatarMenu"
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
              v-if="isAvatarMenuOpen"
              class="absolute right-0 top-full mt-3 w-56 overflow-hidden rounded-3xl border border-[#094b7b] bg-white shadow-[0_22px_60px_rgba(9,75,123,0.2)]"
              role="menu"
            >
              <div class="border-b border-[#094b7b]/8 bg-[#FFF] px-5 py-4">
                <h6 class="text-[0.8rem] font-semibold uppercase tracking-[0.24em] text-[#de5826]">
                  Min konto
                </h6>
                <p class="mt-1 text-sm font-semibold text-[#094b7b]">{{ displayUserName }}</p>
              </div>

              <RouterLink
                v-if="!isAdmin"
                :to="{ name: 'user-profile' }"
                class="block px-5 py-3 text-sm text-slate-700 transition hover:bg-[#C1D2DE] hover:text-[#094b7b]"
                role="menuitem"
                @click="closeAvatarMenu"
              >
                Profil
              </RouterLink>
              <button
                type="button"
                class="block w-full px-5 py-3 text-left text-sm text-slate-700 transition hover:bg-[#C1D2DE] hover:text-[#094b7b]"
                role="menuitem"
                @click="handleLogout"
              >
                Log ud
              </button>
            </div>
          </div>
        </template>

        <template v-else>
          <RouterLink
            to="/auth/login"
            class="rounded-full px-4 py-2 text-sm font-semibold text-[#094b7b] transition hover:bg-[#C1D2DE]"
          >
            Login
          </RouterLink>
          <RouterLink
            to="/auth/register"
            class="rounded-full bg-[#094b7b] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_25px_rgba(9,75,123,0.18)] transition hover:bg-[#0b5d98]"
          >
            Opret konto
          </RouterLink>
        </template>
      </div>

      <div
        v-if="isMobileMenuOpen"
        class="basis-full rounded-2xl border border-[#094b7b]/10 bg-white p-4 shadow-sm md:hidden"
      >
        <div class="flex flex-col gap-2">
          <RouterLink :to="{ name: 'home' }" :class="getNavLinkClass('home')" @click="closeMobileMenu"
            >Hjem</RouterLink
          >
          <RouterLink
            :to="{ name: 'search' }"
            :class="getNavLinkClass('search')"
            @click="closeMobileMenu"
            >Udforsk</RouterLink
          >
          <RouterLink
            :to="{ name: 'create' }"
            :class="getNavLinkClass('create')"
            @click="closeMobileMenu"
            >Tilføj</RouterLink
          >
          <RouterLink
            :to="{ name: 'contact' }"
            :class="getNavLinkClass('contact')"
            @click="closeMobileMenu"
            >Kontakt</RouterLink
          >

          <template v-if="isAuthenticated">
            <span
              class="rounded-full bg-[#C1D2DE] px-4 py-2 text-sm font-medium text-[#094b7b]"
            >
              Velkommen {{ displayUserName }}
            </span>

            <RouterLink
              v-if="showAdminLink"
              :to="{ name: 'admin' }"
              :class="getNavLinkClass('admin')"
              @click="closeMobileMenu"
            >
              Admin
            </RouterLink>

            <RouterLink
              :to="{ name: 'user-profile' }"
              class="rounded-full px-4 py-2 text-sm font-semibold text-[#094b7b] transition hover:bg-[#C1D2DE]"
              @click="closeMobileMenu"
            >
              Profil
            </RouterLink>

            <button
              type="button"
              class="rounded-full px-4 py-2 text-left text-sm font-semibold text-[#094b7b] transition hover:bg-[#C1D2DE]"
              @click="handleMobileLogout"
            >
              Log ud
            </button>
          </template>

          <template v-else>
            <RouterLink
              to="/auth/login"
              class="rounded-full px-4 py-2 text-sm font-semibold text-[#094b7b] transition hover:bg-[#C1D2DE]"
              @click="closeMobileMenu"
            >
              Login
            </RouterLink>
            <RouterLink
              to="/auth/register"
              class="rounded-full bg-[#094b7b] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_25px_rgba(9,75,123,0.18)] transition hover:bg-[#0b5d98]"
              @click="closeMobileMenu"
            >
              Opret konto
            </RouterLink>
          </template>
        </div>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  deleteAllNotifications,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/api/notifications.api'
import aroundYouLogo from '@/assets/around-you-logo.svg'
import { useAuth } from '@/composables/useAuth'
import type { AppNotification } from '@/types/notification'

const route = useRoute()
const router = useRouter()
const navRef = ref<ComponentPublicInstance | HTMLElement | null>(null)
const isAvatarMenuOpen = ref(false)
const isNotificationMenuOpen = ref(false)
const notifications = ref<AppNotification[]>([])
const notificationsLoading = ref(false)
const notificationError = ref('')
const isMobileMenuOpen = ref(false)

const { avatarInitials, checkSession, isAdmin, isAuthenticated, logout, userAvatar, userName } =
  useAuth()

const displayUserName = computed(() => userName.value || 'Guest')
const displayUserAvatar = computed(() => userAvatar.value?.trim() || '')

const showAdminLink = computed(() => {
  return isAuthenticated.value && isAdmin.value
})

const unreadNotificationCount = computed(() => {
  return notifications.value.filter((notification) => !notification.readAt).length
})

const getNavLinkClass = (routeName: string) => {
  const isActive = route.name === routeName

  return [
    'rounded-full px-4 py-2 text-sm font-semibold transition',
    isActive
      ? 'bg-[#094b7b] text-white shadow-[0_12px_25px_rgba(9,75,123,0.18)]'
      : 'text-[#094b7b] hover:bg-[#C1D2DE] hover:text-[#de5826]',
  ]
}

async function loadNotifications(): Promise<void> {
  if (!isAuthenticated.value) {
    notifications.value = []
    return
  }

  notificationsLoading.value = true
  notificationError.value = ''

  try {
    notifications.value = await fetchNotifications()
  } catch (error) {
    notificationError.value =
      error instanceof Error ? error.message : 'Kunne ikke hente notifikationer.'
  } finally {
    notificationsLoading.value = false
  }
}

const closeAvatarMenu = () => (isAvatarMenuOpen.value = false)
const closeNotificationMenu = () => (isNotificationMenuOpen.value = false)
const toggleAvatarMenu = () => {
  isAvatarMenuOpen.value = !isAvatarMenuOpen.value
  if (isAvatarMenuOpen.value) closeNotificationMenu()
}
const toggleNotificationMenu = () => {
  isNotificationMenuOpen.value = !isNotificationMenuOpen.value
  if (isNotificationMenuOpen.value) {
    closeAvatarMenu()
    void loadNotifications()
  }
}

async function markRead(id: string): Promise<void> {
  const notification = notifications.value.find((entry) => entry._id === id)
  if (!notification || notification.readAt) return

  try {
    const updated = await markNotificationRead(id)
    notifications.value = notifications.value.map((entry) => (entry._id === id ? updated : entry))
  } catch (error) {
    notificationError.value =
      error instanceof Error ? error.message : 'Kunne ikke opdatere notifikationen.'
  }
}

async function markAllRead(): Promise<void> {
  try {
    notifications.value = await markAllNotificationsRead()
  } catch (error) {
    notificationError.value =
      error instanceof Error ? error.message : 'Kunne ikke opdatere notifikationer.'
  }
}

async function removeAllNotifications(): Promise<void> {
  const confirmed = window.confirm('Vil du fjerne alle notifikationer?')
  if (!confirmed) return

  try {
    await deleteAllNotifications()
    notifications.value = []
    notificationError.value = ''
  } catch (error) {
    notificationError.value =
      error instanceof Error ? error.message : 'Kunne ikke fjerne notifikationer.'
  }
}

function formatNotificationDate(value: string): string {
  return new Date(value).toLocaleString('da-DK', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
const closeMobileMenu = () => (isMobileMenuOpen.value = false)
const toggleMobileMenu = () => (isMobileMenuOpen.value = !isMobileMenuOpen.value)

const handleLogout = async () => {
  closeAvatarMenu()
  closeNotificationMenu()
  notifications.value = []
  logout()
  await router.push('/')
}

const handleMobileLogout = async () => {
  closeMobileMenu()
  logout()
  await router.push('/')
}

const handleDocumentClick = (event: MouseEvent) => {
  if (!isAvatarMenuOpen.value && !isMobileMenuOpen.value) return

  const navElement = navRef.value instanceof HTMLElement ? navRef.value : navRef.value?.$el

  if (navElement && event.target instanceof Node && !navElement.contains(event.target)) {
    closeAvatarMenu()
    closeNotificationMenu()
  }
}

watch(isAuthenticated, (authenticated) => {
  if (authenticated) {
    void loadNotifications()
    return
  }

  notifications.value = []
  closeNotificationMenu()
})

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)

  if (isAuthenticated.value && !isAdmin.value) {
    void checkSession()
  }
  if (isAuthenticated.value) {
    void loadNotifications()
  }
})
onBeforeUnmount(() => document.removeEventListener('click', handleDocumentClick))
</script>
