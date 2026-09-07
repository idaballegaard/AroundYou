import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SearchFilter from '@/components/SearchFilter.vue'
import type { SearchFilters } from '@/types/search'

const baseFilters: SearchFilters = {
  location: '',
  types: [],
  date: '',
  categories: [],
}

const mountFilter = (modelValue: SearchFilters = baseFilters) =>
  mount(SearchFilter, {
    props: {
      modelValue,
      locationOptions: ['Aarhus', 'Kobenhavn', 'Ribe'],
      categoryOptions: ['culture', 'family', 'food'],
    },
    attachTo: document.body,
  })

const lastEmittedModelValue = (wrapper: ReturnType<typeof mountFilter>) => {
  const events = wrapper.emitted('update:modelValue') ?? []
  return events[events.length - 1]?.[0]
}

describe('SearchFilter', () => {
  it('renders the core filter controls', () => {
    const wrapper = mountFilter()

    expect(wrapper.find('input[placeholder="Lokation"]').exists()).toBe(true)
    expect(wrapper.find('input[placeholder="Kategorier"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Event / Attraktion')
    expect(wrapper.text()).toContain('Dato')

    wrapper.unmount()
  })

  it('emits a selected location from the suggestion list', async () => {
    const wrapper = mountFilter()

    await wrapper.find('input[placeholder="Lokation"]').trigger('focus')
    await wrapper.find('input[placeholder="Lokation"]').setValue('rib')
    await wrapper.findAll('button').find((button) => button.text() === 'Ribe')?.trigger('click')

    expect(lastEmittedModelValue(wrapper)).toMatchObject({
      location: 'Ribe',
    })

    wrapper.unmount()
  })

  it('toggles type and category filters without duplicating custom categories', async () => {
    const wrapper = mountFilter()

    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('Event / Attraktion'))
      ?.trigger('click')
    await wrapper.findAll('button').find((button) => button.text() === 'Event')?.trigger('click')

    expect(lastEmittedModelValue(wrapper)).toMatchObject({
      types: ['event'],
    })

    const categoryInput = wrapper.find('input[placeholder="Kategorier"]')
    await categoryInput.trigger('focus')
    await categoryInput.setValue('custom')
    await categoryInput.trigger('keydown.enter')
    await categoryInput.setValue('custom')
    await categoryInput.trigger('keydown.enter')

    expect(lastEmittedModelValue(wrapper)).toMatchObject({
      categories: ['custom'],
    })

    wrapper.unmount()
  })

  it('clears all active filters when reset is selected', async () => {
    const wrapper = mountFilter({
      location: 'Ribe',
      types: ['event'],
      date: '2026-09-07',
      categories: ['culture'],
    })

    await wrapper.findAll('button').find((button) => button.text() === 'Nulstil filtre')?.trigger('click')

    expect(lastEmittedModelValue(wrapper)).toEqual({
      location: '',
      types: [],
      date: '',
      categories: [],
    })

    wrapper.unmount()
  })

  it('closes open dropdowns when clicking outside the filter', async () => {
    const wrapper = mountFilter()
    const removeListenerSpy = vi.spyOn(document, 'removeEventListener')

    await wrapper.find('input[placeholder="Lokation"]').trigger('focus')
    expect(wrapper.text()).toContain('Aarhus')

    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).not.toContain('Aarhus')

    wrapper.unmount()
    expect(removeListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function))
    removeListenerSpy.mockRestore()
  })
})
