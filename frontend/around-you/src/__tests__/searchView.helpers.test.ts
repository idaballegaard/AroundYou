import { describe, expect, it } from 'vitest'

import {
  clampPage,
  getInitialSearchTypes,
  getSearchResultDescription,
  getSelectedCityCenter,
  getVisibleSearchItems,
  paginateSearchItems,
  toSearchMapMarkers,
  toSearchResultCard,
} from '@/composables/search/searchView.helpers'
import type { SearchFilters, SearchResult } from '@/types/search'

const baseFilters: SearchFilters = {
  location: '',
  types: [],
  date: '',
  time: '',
  customTime: '',
  categories: [],
}

const results: SearchResult[] = [
  {
    id: 'city-aarhus',
    title: 'Aarhus',
    description: 'City',
    location: 'Aarhus',
    coordinates: { lat: 56.1629, lng: 10.2039 },
    type: 'city',
    date: '',
    startDateTime: '',
    endDateTime: '',
    rating: 4.8,
    reviews: 12,
    image: 'aarhus.jpg',
    categories: [],
  },
  {
    id: 'event-food',
    title: 'Food Festival',
    description: 'Event',
    location: 'Aarhus',
    coordinates: { lat: 56.16, lng: 10.2 },
    type: 'event',
    date: '2026-06-10',
    startDateTime: '2026-06-10T12:00:00.000Z',
    endDateTime: '2026-06-10T13:00:00.000Z',
    rating: 4.5,
    reviews: 3,
    image: 'food.jpg',
    categories: ['food'],
  },
  {
    id: 'attraction-museum',
    title: 'Museum',
    description: 'Attraction',
    location: 'Ribe',
    coordinates: null,
    type: 'attraction',
    date: '2026-05-01',
    startDateTime: '',
    endDateTime: '',
    rating: 4.1,
    reviews: 5,
    image: 'museum.jpg',
    categories: ['culture'],
  },
]

describe('search view helpers', () => {
  it('normalizes route type query values into supported initial filters', () => {
    expect(getInitialSearchTypes('event')).toEqual(['event'])
    expect(getInitialSearchTypes(['attraction', 'event'])).toEqual(['activity'])
    expect(getInitialSearchTypes('city')).toEqual([])
    expect(getInitialSearchTypes(undefined)).toEqual([])
  })

  it('builds the result description from filter and location states', () => {
    expect(getSearchResultDescription({ ...baseFilters, location: 'Ribe' }, false, false)).toBe(
      'Søg blandt byer, events og attraktioner i hele Danmark.',
    )
    expect(getSearchResultDescription(baseFilters, true, false)).toBe(
      'Vi viser de nærmeste events og attraktioner ud fra din lokation.',
    )
    expect(getSearchResultDescription(baseFilters, false, true)).toBe(
      'Del din lokation for at se oplevelser tæt på dig, eller udforsk Danmarks seks største byer her.',
    )
  })

  it('removes city cards from the list after selecting a city marker', () => {
    expect(getVisibleSearchItems(results, '')).toHaveLength(3)
    expect(getVisibleSearchItems(results, 'Aarhus').map((item) => item.type)).toEqual([
      'event',
      'attraction',
    ])
  })

  it('clamps and paginates result pages', () => {
    expect(clampPage(-1, 3)).toBe(1)
    expect(clampPage(5, 3)).toBe(3)
    expect(paginateSearchItems(results, 2, 2).map((item) => item.id)).toEqual(['attraction-museum'])
  })

  it('maps search results to card and map marker props', () => {
    expect(toSearchResultCard(results[1]!)).toMatchObject({
      id: 'event-food',
      name: 'Food Festival',
      tags: ['event', 'Aarhus', 'food'],
      href: '/event/event-food',
    })

    expect(toSearchMapMarkers(results).map((marker) => marker.id)).toEqual([
      'city-aarhus',
      'event-food',
    ])
  })

  it('resolves a selected city center from normalized city coordinates', () => {
    expect(getSelectedCityCenter(' aarhus ', { aarhus: { lat: 56.1629, lng: 10.2039 } })).toEqual({
      latitude: 56.1629,
      longitude: 10.2039,
    })
    expect(getSelectedCityCenter('', { aarhus: { lat: 56.1629, lng: 10.2039 } })).toBeNull()
  })
})
