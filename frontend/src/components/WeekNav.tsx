import { weekRangeLabel } from '../lib/weekUtils'

interface Props {
  monday: string
  onPrev: () => void
  onNext: () => void
}

export default function WeekNav({ monday, onPrev, onNext }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0, marginBottom: 12 }}>
      <button onClick={onPrev} style={{ padding: '4px 12px' }}>‹</button>
      <span style={{ fontWeight: 600, fontSize: 15 }}>{weekRangeLabel(monday)}</span>
      <button onClick={onNext} style={{ padding: '4px 12px' }}>›</button>
    </div>
  )
}
