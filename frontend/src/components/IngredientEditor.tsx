import type { Ingredient } from '../lib/api'

const CATEGORIES = ['produce', 'meat', 'dairy', 'grains', 'pantry', 'other']

const inputStyle: React.CSSProperties = {
  padding: '4px 6px',
  borderRadius: 4,
  border: '1px solid rgba(255,255,255,0.2)',
  background: 'rgba(255,255,255,0.06)',
  color: 'inherit',
  fontSize: 12,
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  background: '#1e1e2e',
}

interface Props {
  ingredients: Ingredient[]
  onChange: (ingredients: Ingredient[]) => void
}

export default function IngredientEditor({ ingredients, onChange }: Props) {
  function update(index: number, field: keyof Ingredient, value: string | number | null) {
    const next = ingredients.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing))
    onChange(next)
  }

  function remove(index: number) {
    onChange(ingredients.filter((_, i) => i !== index))
  }

  function addRow() {
    onChange([...ingredients, { name: '', quantity: null, unit: null, category: 'other' }])
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {ingredients.map((ing, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 56px 48px 80px 24px', gap: 4, alignItems: 'center' }}>
          <input
            value={ing.name}
            onChange={(e) => update(i, 'name', e.target.value)}
            placeholder="Name"
            style={{ ...inputStyle, minWidth: 0 }}
          />
          <input
            type="number"
            value={ing.quantity ?? ''}
            onChange={(e) => update(i, 'quantity', e.target.value === '' ? null : Number(e.target.value))}
            placeholder="Qty"
            style={{ ...inputStyle, minWidth: 0 }}
          />
          <input
            value={ing.unit ?? ''}
            onChange={(e) => update(i, 'unit', e.target.value || null)}
            placeholder="Unit"
            style={{ ...inputStyle, minWidth: 0 }}
          />
          <select
            value={ing.category}
            onChange={(e) => update(i, 'category', e.target.value)}
            style={{ ...selectStyle, minWidth: 0 }}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => remove(i)}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 0, fontSize: 14 }}
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        style={{
          alignSelf: 'flex-start',
          fontSize: 12,
          padding: '3px 8px',
          background: 'transparent',
          border: '1px dashed rgba(255,255,255,0.25)',
          borderRadius: 4,
          color: 'rgba(255,255,255,0.5)',
          cursor: 'pointer',
          marginTop: 2,
        }}
      >
        + Add ingredient
      </button>
    </div>
  )
}
