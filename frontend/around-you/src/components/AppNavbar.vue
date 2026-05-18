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
        <NavbarLinks :get-nav-link-class="getNavLinkClass" />

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

          <NavbarNotificationMenu
            :error="notificationError"
            :is-loading="notificationsLoading"
            :is-open="isNotificationMenuOpen"
            :notifications="notifications"
            :unread-count="unreadNotificationCount"
            @mark-all-read="markAllRead"
            @mark-read="markRead"
            @remove-all="removeAllNotifications"
            @toggle="toggleNotificationMenu"
          />

          <NavbarUserMenu
            :avatar-initials="avatarInitials"
            :display-user-avatar="displayUserAvatar"
            :display-user-name="displayUserName"
            :is-admin="isAdmin"
            :is-open="isAvatarMenuOpen"
            @close="closeAvatarMenu"
            @logout="handleLogout"
            @toggle="toggleAvatarMenu"
          />
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

      <NavbarMobileMenu
        :display-user-name="displayUserName"
        :get-nav-link-class="getNavLinkClass"
        :is-authenticated="isAuthenticated"
        :is-open="isMobileMenuOpen"
        :show-admin-link="showAdminLink"
        @close="closeMobileMenu"
        @logout="handleMobileLogout"
      />
    </nav>
  </header>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import aroundYouLogo from '@/assets/around-you-logo.svg'
import { useAuth } from '@/composables/useAuth'
import { useNavbarNotifications } from '@/composables/navbar/useNavbarNotifications'
import NavbarLinks from '@/components/navbar/NavbarLinks.vue'
import NavbarMobileMenu from '@/components/navbar/NavbarMobileMenu.vue'
import NavbarNotificationMenu from '@/components/navbar/NavbarNotificationMenu.vue'
import NavbarUserMenu from '@/components/navbar/NavbarUserMenu.vue'

const route = useRoute()
const router = useRouter()
const navRef = ref<HTMLElement | null>(null)
const isAvatarMenuOpen = ref(false)
const isNotificationMenuOpen = ref(false)
const isMobileMenuOpen = ref(false)

const { avatarInitials, checkSession, isAdmin, isAuthenticated, logout, userAvatar, userName } =
  useAuth()

const {
  clearNotifications,
  loadNotifications,
  markAllRead,
  markRead,
  notificationError,
  notifications,
  notificationsLoading,
  removeAllNotifications,
  unreadNotificationCount,
} = useNavbarNotifications(isAuthenticated)

const displayUserName = computed(() => userName.value || 'Guest')
const displayUserAvatar = computed(() => userAvatar.value?.trim() || '')
const showAdminLink = computed(() => isAuthenticated.value && isAdmin.value)

const getNavLinkClass = (routeName: string) => {
  const isActive = route.name === routeName

  return [
    'rounded-full px-4 py-2 text-sm font-semibold transition',
    isActive
      ? 'bg-[#094b7b] text-white shadow-[0_12px_25px_rgba(9,75,123,0.18)]'
      : 'text-[#094b7b] hover:bg-[#C1D2DE] hover:text-[#de5826]',
  ]
}

const closeAvatarMenu = () => (isAvatarMenuOpen.value = false)
const closeNotificationMenu = () => (isNotificationMenuOpen.value = false)
const closeMobileMenu = () => (isMobileMenuOpen.value = false)
const toggleMobileMenu = () => (isMobileMenuOpen.value = !isMobileMenuOpen.value)

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

const handleLogout = async () => {
  closeAvatarMenu()
  closeNotificationMenu()
  clearNotifications()
  logout()
  await router.push('/')
}

const handleMobileLogout = async () => {
  closeMobileMenu()
  clearNotifications()
  logout()
  await router.push('/')
}

const handleDocumentClick = (event: MouseEvent) => {
  if (!isAvatarMenuOpen.value && !isMobileMenuOpen.value) return

  if (navRef.value && event.target instanceof Node && !navRef.value.contains(event.target)) {
    closeAvatarMenu()
    closeNotificationMenu()
  }
}

watch(isAuthenticated, (authenticated) => {
  if (!authenticated) {
    closeNotificationMenu()
  }
})

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)

  void checkSession()

  if (isAuthenticated.value) {
    void loadNotifications()
  }
})

onBeforeUnmount(() => document.removeEventListener('click', handleDocumentClick))
</script>
