import { useState } from 'react'
import type { MappingConfig, Preset } from '../lib/types'
import { Select, TextInput, Button } from './ui'

/** Save the current mapping to localStorage, or load/delete a saved preset. */
export default function PresetBar({
  presets,
  onSave,
  onLoad,
  onDelete,
}: {
  presets: Preset[]
  onSave: (name: string) => void
  onLoad: (config: MappingConfig) => void
  onDelete: (name: string) => void
}) {
  const [name, setName] = useState('')
  const [selected, setSelected] = useState('')

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-end gap-2">
        <div className="w-48">
          <label className="mb-1 block text-xs font-medium text-slate-500">
            حفظ الإعدادات باسم
          </label>
          <TextInput
            value={name}
            placeholder="اسم القالب"
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <Button
          onClick={() => {
            if (!name.trim()) return
            onSave(name)
            setSelected(name.trim())
            setName('')
          }}
          disabled={!name.trim()}
        >
          حفظ القالب
        </Button>
      </div>

      {presets.length > 0 && (
        <div className="flex items-end gap-2">
          <div className="w-48">
            <label className="mb-1 block text-xs font-medium text-slate-500">
              تحميل قالب محفوظ
            </label>
            <Select
              value={selected}
              onChange={(e) => {
                const p = presets.find((x) => x.name === e.target.value)
                setSelected(e.target.value)
                if (p) onLoad(p.config)
              }}
            >
              <option value="">— اختر —</option>
              {presets.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
          <Button
            variant="danger"
            disabled={!selected}
            onClick={() => {
              if (!selected) return
              onDelete(selected)
              setSelected('')
            }}
          >
            حذف
          </Button>
        </div>
      )}
    </div>
  )
}
