import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { ShoppingItem } from '../lib/api'

const CATEGORY_ORDER = ['produce', 'meat', 'dairy', 'grains', 'pantry', 'other']

interface Props {
  householdId: string
  weekStart: string
  onClose: () => void
}

function weekRangeLabel(monday: string): string {
  const start = new Date(monday)
  const end = new Date(monday)
  end.setDate(end.getDate() + 6)
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(start)} – ${fmt(end)}`
}

function formatQty(item: ShoppingItem): string {
  if (item.quantity == null && !item.unit) return ''
  const qty = item.quantity != null ? String(item.quantity) : ''
  return [qty, item.unit].filter(Boolean).join(' ')
}

export default function ShoppingListPanel({ householdId, weekStart, onClose }: Props) {
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    api.getShoppingList(householdId, weekStart).then((data) => {
      if (data.length === 0) {
        return api.syncShoppingList(householdId, weekStart).then(setItems)
      }
      setItems(data)
    }).finally(() => setLoading(false))
  }, [householdId, weekStart])

  async function handleSync() {
    setSyncing(true)
    try {
      const data = await api.syncShoppingList(householdId, weekStart)
      setItems(data)
    } finally {
      setSyncing(false)
    }
  }

  async function handleToggle(item: ShoppingItem) {
    const optimistic = items.map((i) => i.id === item.id ? { ...i, checked: !i.checked } : i)
    setItems(optimistic)
    try {
      const updated = await api.toggleShoppingItem(item.id, !item.checked)
      setItems((prev) => prev.map((i) => i.id === updated.id ? updated : i))
    } catch {
      setItems(items) // revert
    }
  }

  // Group by category
  const grouped = CATEGORY_ORDER.reduce<Record<string, ShoppingItem[]>>((acc, cat) => {
    acc[cat] = items.filter((i) => i.category === cat)
    return acc
  }, {})

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 99 }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 320,
          zIndex: 100,
          background: '#1e1e2e',
          borderLeft: '1px solid rgba(255,255,255,0.12)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15 }}>Shopping List</h3>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
              {weekRangeLabel(weekStart)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              onClick={handleSync}
              disabled={syncing}
              style={{ fontSize: 12, padding: '3px 8px' }}
              title="Refresh from meal tasks"
            >
              {syncing ? '…' : '↻ Refresh'}
            </button>
            <button onClick={onClose} style={{ padding: '2px 8px', fontSize: 16 }}>✕</button>
          </div>
        </div>

        {loading ? (
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Loading…</p>
        ) : items.length === 0 ? (
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
            No items — accept some meal tasks this week.
          </p>
        ) : (
          CATEGORY_ORDER.map((cat) => {
            const catItems = grouped[cat]
            if (!catItems.length) return null
            const unchecked = catItems.filter((i) => !i.checked)
            const checked = catItems.filter((i) => i.checked)
            return (
              <div key={cat}>
                <div style={{ fontSize: 10, letterSpacing: 0.8, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 6 }}>
                  {cat}
                </div>
                {[...unchecked, ...checked].map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '5px 0',
                      opacity: item.checked ? 0.4 : 1,
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => handleToggle(item)}
                      style={{ cursor: 'pointer', flexShrink: 0 }}
                    />
                    <span style={{ fontSize: 13, flex: 1, textDecoration: item.checked ? 'line-through' : 'none' }}>
                      {item.name}
                    </span>
                    {formatQty(item) && (
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', flexShrink: 0 }}>
                        {formatQty(item)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )
          })
        )}
      </div>
    </>
  )
}
