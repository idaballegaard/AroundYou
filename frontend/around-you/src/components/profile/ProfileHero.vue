<template>
  <div class="bg-[#094b7b] px-6 py-8 text-center text-white sm:px-10">
    <div
      class="mx-auto flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-white text-3xl font-black shadow-[0_18px_44px_rgba(0,0,0,0.2)]"
      :class="
        displayAvatar
          ? 'bg-white text-[#094b7b]'
          : 'bg-gradient-to-br from-[#094b7b] to-[#de5826] text-white'
      "
    >
      <img
        v-if="displayAvatar"
        :src="displayAvatar"
        :alt="`${displayName} avatar`"
        class="h-full w-full object-cover"
      />
      <span v-else>{{ initials }}</span>
    </div>
    <h1 class="mt-5 text-3xl font-black tracking-tight sm:text-4xl">{{ displayName }}</h1>
    <p class="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/80">
      Hold dine kontooplysninger opdateret, så AroundYou kan føles mere personligt.
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  displayAvatar: string
  displayName: string
  initials: string
}>()
</script>
