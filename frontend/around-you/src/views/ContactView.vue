<template>
  <main
    class="min-h-screen relative bg-cover bg-center bg-no-repeat py-4 sm:py-[50px]"
    style="background-image: url('/danmarkskort_1800x1280.jpg')"
  >
    <div class="pointer-events-none absolute inset-0 bg-[#e8c7aa]/55"></div>

    <div class="relative z-10 mx-4 sm:mx-[50px] bg-white shadow-2xl rounded-xl overflow-hidden">
      <section class="px-8 py-10">
        <div class="mx-auto grid gap-6">
          <header class="rounded-lg border border-slate-200 bg-white p-6">
            <div class="mt-3 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <h1 class="text-4xl font-black tracking-tight text-[#094b7b]">Kontakt board</h1>
                <p class="mt-2 max-w-3xl text-base text-slate-600">
                  Send fejlrapporter, feedback og andre henvendelser direkte til admin.
                  Hvis vi har brug for yderligere information, kan du blive kontaktet via e-mailadressen tilknyttet din konto.
                </p>
              </div>
              <div class="rounded-md bg-[#C1D2DE] px-4 py-3 text-sm font-bold text-[#094b7b]">
                Svar sendes til {{ userEmail }}
              </div>
            </div>
          </header>

          <div class="grid gap-6 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1fr)]">
            <form
              class="rounded-lg border border-slate-200 bg-white p-5"
              @submit.prevent="submitTicket"
            >
              <div>
                <h2 class="text-xl font-black text-[#094b7b]">Ny henvendelse</h2>
                <p class="mt-1 text-sm text-slate-600">
                  Vælg den kategori der passer bedst, så admin lettere kan prioritere sagen.
                </p>
              </div>

              <fieldset class="mt-5 grid gap-3">
                <legend class="text-base font-black text-slate-800">Kategori</legend>
                <label
                  v-for="option in contactTicketCategoryOptions"
                  :key="option.key"
                  class="cursor-pointer rounded-lg border border-slate-200 p-3 transition hover:border-[#094b7b]/40"
                  :class="
                    form.category === option.key ? 'bg-slate-50 ring-2 ring-[#094b7b]' : 'bg-white'
                  "
                >
                  <input v-model="form.category" class="sr-only" type="radio" :value="option.key" />
                  <span class="flex flex-wrap items-center justify-between gap-2">
                    <span class="font-black text-slate-900">{{ option.label }}</span>
                    <span class="rounded-full px-2 py-1 text-xs font-black" :class="option.badgeClass">
                      {{ option.label }}
                    </span>
                  </span>
                  <span class="mt-1 block text-sm text-slate-600">{{ option.description }}</span>
                </label>
              </fieldset>

              <label class="mt-5 block">
                <span class="text-base font-black text-slate-800">Titel</span>
                <input
                  v-model.trim="form.subject"
                  class="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#094b7b] focus:ring-2 focus:ring-[#094b7b]/20"
                  maxlength="140"
                  placeholder="Kort titel på sagen"
                  required
                  type="text"
                />
              </label>

              <label class="mt-4 block">
                <span class="text-base font-black text-slate-800">Besked</span>
                <textarea
                  v-model.trim="form.message"
                  class="mt-2 min-h-40 w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#094b7b] focus:ring-2 focus:ring-[#094b7b]/20"
                  maxlength="3000"
                  placeholder="Beskriv hvad der skete, hvor det skete, og hvad du forventede."
                  required
                />
              </label>

              <p
                v-if="errorMessage"
                class="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700"
              >
                {{ errorMessage }}
              </p>
              <p
                v-if="successMessage"
                class="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700"
              >
                {{ successMessage }}
              </p>

              <button
                class="mt-5 rounded-md bg-[#094b7b] px-4 py-2 text-sm font-black text-white transition hover:bg-[#0b5d98] disabled:cursor-not-allowed disabled:bg-slate-400"
                :disabled="isSubmitting"
                type="submit"
              >
                {{ isSubmitting ? 'Sender...' : 'Send henvendelse' }}
              </button>
            </form>

            <section class="rounded-lg border border-slate-200 bg-white p-5">
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-[#de5826]">Live preview</p>
              <h2 class="mt-2 text-xl font-black text-[#094b7b]">Sådan sendes din sag</h2>

              <article
                class="mt-5 rounded-lg border border-l-4 border-slate-200 p-4"
                :class="selectedCategory.borderClass"
              >
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div class="flex flex-wrap items-center gap-2">
                      <h3 class="font-black text-slate-900">
                        {{ previewSubject }}
                      </h3>
                      <span
                        class="rounded-full px-2 py-1 text-xs font-black"
                        :class="selectedCategory.badgeClass"
                      >
                        {{ selectedCategory.label }}
                      </span>
                    </div>
                    <p class="mt-1 text-sm text-slate-600">{{ displayUserName }} · {{ userEmail }}</p>
                    <p class="mt-1 text-xs font-bold text-slate-500">Oprettes {{ previewDate }}</p>
                  </div>
                  <span class="rounded-full bg-slate-100 px-2 py-1 text-xs font-black text-slate-700">
                    Klar til afsendelse
                  </span>
                </div>

                <p
                  class="mt-4 min-h-36 whitespace-pre-line rounded-md bg-slate-50 p-3 text-sm text-slate-700"
                  :class="form.message ? '' : 'font-semibold text-slate-400'"
                >
                  {{ previewMessage }}
                </p>

                <div class="mt-4 grid gap-2 text-sm text-slate-600">
                  <p>
                    <span class="font-black text-slate-800">Kategori:</span>
                    {{ selectedCategory.label }}
                  </p>
                  <p><span class="font-black text-slate-800">Dato:</span> {{ previewDate }}</p>
                  <p><span class="font-black text-slate-800">Status:</span> Sendes som åben sag</p>
                  <p>
                    <span class="font-black text-slate-800">Kontakt:</span> Admin kan svare via email
                  </p>
                </div>
              </article>
            </section>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { useContactView } from '@/composables/contact/useContactView'

const {
  contactTicketCategoryOptions,
  displayUserName,
  errorMessage,
  form,
  isSubmitting,
  previewDate,
  previewMessage,
  previewSubject,
  selectedCategory,
  submitTicket,
  successMessage,
  userEmail,
} = useContactView()
</script>
