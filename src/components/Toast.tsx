import { useEffect, useState } from 'react'

export interface ToastMessage {
  id: string
  text: string
  type?: 'success' | 'info' | 'warning'
}

let toastListener: ((toast: ToastMessage) => void) | null = null

export function showToast(text: string, type: 'success' | 'info' | 'warning' = 'success') {
  if (toastListener) {
    toastListener({ id: String(Date.now() + Math.random()), text, type })
  }
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    toastListener = (toast) => {
      setToasts((prev) => [...prev.slice(-3), toast])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id))
      }, 3500)
    }
    return () => {
      toastListener = null
    }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 start-5 z-50 flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((toast) => {
        const bg =
          toast.type === 'warning'
            ? 'bg-[color:var(--mustard)] text-[color:var(--on-mustard)]'
            : toast.type === 'info'
              ? 'bg-[color:var(--sky)] text-[color:var(--on-sky)]'
              : 'bg-[color:var(--teal)] text-[color:var(--on-teal)]'

        const icon =
          toast.type === 'warning' ? '⚠️' : toast.type === 'info' ? 'ℹ️' : '✓'

        return (
          <div
            key={toast.id}
            className={`hard-3 flex items-center gap-2.5 px-4 py-2.5 font-bold shadow-lg pointer-events-auto transition-all transform animate-bounce-short ${bg}`}
            style={{ borderRadius: 'var(--r-pill)', fontSize: 'var(--fs-body)' }}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/80 text-xs font-black text-[color:var(--ink)]">
              {icon}
            </span>
            <span>{toast.text}</span>
          </div>
        )
      })}
    </div>
  )
}
