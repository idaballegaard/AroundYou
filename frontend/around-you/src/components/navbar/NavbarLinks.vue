<template>
  <RouterLink :to="{ name: 'home' }" :class="getNavLinkClass('home')">Hjem</RouterLink>
  <RouterLink :to="{ name: 'search' }" :class="getNavLinkClass('search')">Udforsk</RouterLink>
  <RouterLink :to="{ name: 'create' }" :class="getNavLinkClass('create')">Tilføj</RouterLink>
  <RouterLink :to="{ name: 'contact' }" :class="getNavLinkClass('contact')">Kontakt</RouterLink>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineProps<{
  getNavLinkClass: (routeName: string) => string[]
}>()
</script>
