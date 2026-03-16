import { weekRangeLabel } from '../lib/weekUtils'

interface Props {
  monday: string
  onPrev: () => void
  onNext: () => void
  onToday: () => void
}

export default function WeekNav({ monday, onPrev, onNext, onToday }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginBottom: 12 }}>
      <button onClick={onPrev} style={{ padding: '4px 12px' }}>‹</button>
      <button onClick={onNext} style={{ padding: '4px 12px' }}>›</button>
      <button onClick={onToday} style={{ padding: '4px 10px', fontSize: 12 }}>Today</button>
      <span style={{ fontWeight: 600, fontSize: 15, marginLeft: 8 }}>{weekRangeLabel(monday)}</span>
    </div>
  )
}
