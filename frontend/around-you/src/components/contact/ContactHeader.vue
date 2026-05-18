<template>
  <header class="rounded-lg border border-slate-200 bg-white p-6">
    <div class="mt-3 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
      <div>
        <h1 class="text-4xl font-black tracking-tight text-[#094b7b]">Kontakt board</h1>
        <p class="mt-2 max-w-3xl text-base text-slate-600">
          Send fejlrapporter, feedback og andre henvendelser direkte til admin. Hvis vi har brug
          for yderligere information, kan du blive kontaktet via e-mailadressen tilknyttet din konto.
        </p>
      </div>
      <div class="rounded-md bg-[#C1D2DE] px-4 py-3 text-sm font-bold text-[#094b7b]">
        Svar sendes til {{ userEmail }}
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  userEmail: string
}>()
</script>
