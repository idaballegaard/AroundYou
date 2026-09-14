import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SearchFilter from '@/components/SearchFilter.vue'
import type { SearchFilters } from '@/types/search'

const baseFilters: SearchFilters = {
  location: '',
  types: [],
  date: '',
  time: '',
  customTime: '',
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
    expect(wrapper.text()).not.toContain('Typer')
    expect(wrapper.text()).toContain('Dato')
    expect(wrapper.text()).toContain('Tidspunkt')

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

  it('adds custom category filters without duplicates', async () => {
    const wrapper = mountFilter()

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
      time: 'custom',
      customTime: '14:00',
      categories: ['culture'],
    })

    await wrapper.findAll('button').find((button) => button.text() === 'Nulstil filtre')?.trigger('click')

    expect(lastEmittedModelValue(wrapper)).toMatchObject({
      location: '',
      types: [],
      date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      time: '',
      customTime: '',
      categories: [],
    })

    wrapper.unmount()
  })

  it('shows quick date choices before opening the calendar', async () => {
    const wrapper = mountFilter()

    await wrapper.findAll('button').find((button) => button.text().includes('Dato'))?.trigger('click')

    expect(wrapper.text()).toContain('I dag')
    expect(wrapper.text()).toContain('I morgen')
    expect(wrapper.text()).toContain('Vælg dato')
    expect(wrapper.text()).not.toContain(new Date().toLocaleDateString('da-DK', { month: 'long' }))

    await wrapper.findAll('button').find((button) => button.text() === 'Vælg dato')?.trigger('click')

    expect(wrapper.text()).toContain(new Date().toLocaleDateString('da-DK', { month: 'long' }))

    wrapper.unmount()
  })

  it('uses friendly labels for today and tomorrow in the date field', async () => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const toDateValue = (date: Date) => {
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${date.getFullYear()}-${month}-${day}`
    }

    const wrapper = mountFilter({ ...baseFilters, date: toDateValue(today) })
    expect(wrapper.text()).toContain('I dag')

    await wrapper.setProps({ modelValue: { ...baseFilters, date: toDateValue(tomorrow) } })
    expect(wrapper.text()).toContain('I morgen')

    wrapper.unmount()
  })

  it('keeps the time menu open when selecting a custom time', async () => {
    const wrapper = mountFilter()

    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('Tidspunkt'))
      ?.trigger('click')
    await wrapper.findAll('button').find((button) => button.text() === 'Vælg tidspunkt')?.trigger('click')

    expect(wrapper.find('select[aria-label="Time"]').exists()).toBe(true)
    const minuteOptions = wrapper
      .findAll('select[aria-label="Minutter"] option')
      .map((option) => option.attributes('value'))
    expect(minuteOptions).toContain('55')
    expect(minuteOptions).not.toContain('01')

    await wrapper.find('select[aria-label="Time"]').setValue('14')
    await wrapper.find('select[aria-label="Minutter"]').setValue('30')
    expect(wrapper.text()).toContain('14:30')

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
