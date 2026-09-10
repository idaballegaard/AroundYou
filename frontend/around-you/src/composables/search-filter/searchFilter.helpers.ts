import type { SearchFilters } from '@/types/search'

export const weekdayLabels = ['M', 'T', 'O', 'T', 'F', 'L', 'S']

export const areStringArraysEqual = (first: string[], second: string[]) => {
  if (first.length !== second.length) {
    return false
  }

  return first.every((item, index) => item === second[index])
}

export const areFiltersEqual = (first: SearchFilters, second: SearchFilters) => {
  return (
    first.location === second.location &&
    first.date === second.date &&
    first.time === second.time &&
    first.customTime === second.customTime &&
    areStringArraysEqual(first.types, second.types) &&
    areStringArraysEqual(first.categories, second.categories)
  )
}

export const getCalendarDays = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1).getDay()
  // JavaScript weeks start on Sunday; the filter calendar starts on Monday.
  const offset = (firstDay + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Always return a six-week grid so the date dropdown does not resize while
  // navigating between months.
  return Array.from({ length: 42 }, (_, index) => {
    const dayNumber = index - offset + 1
    return dayNumber > 0 && dayNumber <= daysInMonth ? dayNumber : null
  })
}

export const formatDisplayDate = (dateValue: string) => {
  if (!dateValue) {
    return ''
  }

  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return dateValue
  }

  return date.toLocaleDateString('da-DK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export const isSelectedCalendarDay = (
  dateValue: string,
  year: number,
  month: number,
  day: number,
) => {
  if (!dateValue) {
    return false
  }

  const selected = new Date(dateValue)

  return (
    selected.getFullYear() === year && selected.getMonth() === month && selected.getDate() === day
  )
}

export const toDateInputValue = (year: number, month: number, day: number) => {
  const selected = new Date(year, month, day)
  const selectedYear = selected.getFullYear()
  const selectedMonth = String(selected.getMonth() + 1).padStart(2, '0')
  const selectedDate = String(selected.getDate()).padStart(2, '0')

  return `${selectedYear}-${selectedMonth}-${selectedDate}`
}
