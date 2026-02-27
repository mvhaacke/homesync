export interface DayMeta {
  day: string      // 'monday'..'sunday'
  label: string    // 'Mon 3'
  isoDate: string  // 'YYYY-MM-DD'
}

const DAY_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function toIso(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function getMondayOf(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day // shift sunday back 6, others forward to monday
  d.setDate(d.getDate() + diff)
  return toIso(d)
}

export function currentWeekMonday(): string {
  return getMondayOf(new Date())
}

export function shiftWeek(monday: string, n: number): string {
  const d = new Date(monday + 'T00:00:00')
  d.setDate(d.getDate() + n * 7)
  return toIso(d)
}

export function weekDays(monday: string): DayMeta[] {
  const base = new Date(monday + 'T00:00:00')
  return DAY_NAMES.map((day, i) => {
    const d = new Date(base)
    d.setDate(d.getDate() + i)
    const label = `${DAY_LABELS[i]} ${d.getDate()}`
    return { day, label, isoDate: toIso(d) }
  })
}

export function weekRangeLabel(monday: string): string {
  const days = weekDays(monday)
  const start = new Date(days[0].isoDate + 'T00:00:00')
  const end = new Date(days[6].isoDate + 'T00:00:00')
  const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
  return `${fmt.format(start)} – ${fmt.format(end)}`
}
