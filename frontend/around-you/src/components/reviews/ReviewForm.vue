<template>
  <div class="mb-8 rounded-2xl border border-[#C1D2DE]/70 bg-white p-6 shadow-sm">
    <div class="mb-4 flex items-center gap-3">
      <div
        class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#094b7b] to-[#de5826] text-sm font-black text-white"
      >
        <img
          v-if="userAvatar"
          :src="userAvatar"
          :alt="`${userName} avatar`"
          class="h-full w-full object-cover"
        />
        <span v-else>{{ userInitials }}</span>
      </div>
      <div>
        <h3 class="text-base font-semibold text-[#094b7b]">Skriv en anmeldelse</h3>
        <p class="text-sm font-semibold text-[#de5826]">{{ userName }}</p>
      </div>
    </div>

    <form @submit.prevent="emit('submit')" class="space-y-4">
      <div>
        <label for="review-title" class="mb-1 block text-sm font-medium text-slate-700">Titel</label>
        <input
          id="review-title"
          :value="modelValue.title"
          type="text"
          required
          minlength="3"
          maxlength="255"
          placeholder="Kort titel for din oplevelse"
          class="w-full rounded-lg border border-[#C1D2DE] px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#094b7b] focus:ring-2 focus:ring-[#094b7b]/20"
          @input="updateField('title', ($event.target as HTMLInputElement).value)"
        />
      </div>

      <div>
        <label for="review-description" class="mb-1 block text-sm font-medium text-slate-700">Beskrivelse</label>
        <textarea
          id="review-description"
          :value="modelValue.description"
          required
          minlength="6"
          maxlength="1024"
          rows="4"
          placeholder="Beskriv din oplevelse..."
          class="w-full rounded-lg border border-[#C1D2DE] px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#094b7b] focus:ring-2 focus:ring-[#094b7b]/20"
          @input="updateField('description', ($event.target as HTMLTextAreaElement).value)"
        ></textarea>
      </div>

      <div>
        <label class="mb-1 block text-sm font-medium text-slate-700">Bedømmelse</label>
        <div class="flex gap-1">
          <button
            v-for="star in 5"
            :key="star"
            type="button"
            :aria-label="`${star} stjerner`"
            class="text-2xl transition-transform hover:scale-110 focus:outline-none"
            :class="star <= modelValue.rating ? 'text-[#de5826]' : 'text-slate-300'"
            @click="updateField('rating', star)"
          >★</button>
        </div>
      </div>

      <div>
        <label for="review-image" class="mb-1 block text-sm font-medium text-slate-700">
          Billede-URL <span class="font-normal text-slate-400">(valgfrit)</span>
        </label>
        <input
          id="review-image"
          :value="modelValue.image"
          type="url"
          placeholder="https://..."
          class="w-full rounded-lg border border-[#C1D2DE] px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#094b7b] focus:ring-2 focus:ring-[#094b7b]/20"
          @input="updateField('image', ($event.target as HTMLInputElement).value)"
        />
      </div>

      <p v-if="submitError" class="text-sm text-[#de5826]">{{ submitError }}</p>

      <button
        type="submit"
        :disabled="submitting || modelValue.rating === 0"
        class="rounded-full bg-[#094b7b] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#094b7b]/85 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {{ submitting ? 'Sender...' : 'Send anmeldelse' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
export type ReviewFormModel = {
  title: string
  description: string
  rating: number
  image: string
}

const props = defineProps<{
  modelValue: ReviewFormModel
  submitting: boolean
  submitError: string | null
  userAvatar: string
  userInitials: string
  userName: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: ReviewFormModel): void
  (e: 'submit'): void
}>()

function updateField<K extends keyof ReviewFormModel>(key: K, value: ReviewFormModel[K]) {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value,
  })
}
</script>
