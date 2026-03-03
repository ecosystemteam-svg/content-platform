'use client'
import { useRef, useState, useEffect, createContext, useContext, useCallback } from 'react'

type ToastCtx = { show: (msg: string) => void }
const ToastContext = createContext<ToastCtx>({ show: () => {} })
export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState('')
  const show = useCallback((m: string) => {
    setMsg(m)
    setTimeout(() => setMsg(''), 2500)
  }, [])
  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {msg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-xl text-sm font-medium z-[9999] shadow-lg toast-anim">
          {msg}
        </div>
      )}
    </ToastContext.Provider>
  )
}

type ImageUploadProps = {
  value: string
  onChange: (url: string, file?: File) => void
  label?: string
  recWidth?: number
  recHeight?: number
}

export function ImageUpload({ value, onChange, label, recWidth, recHeight }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [info, setInfo] = useState<{ w: number; h: number; status: string; msg: string } | null>(null)

  const checkDim = (src: string) => {
    const img = new Image()
    img.onload = () => {
      const w = img.naturalWidth, h = img.naturalHeight
      const ratio = +(w / h).toFixed(2)
      const recRatio = recWidth && recHeight ? +(recWidth / recHeight).toFixed(2) : null
      let status = 'ok', msg = `${w} x ${h} px`
      if (recWidth && recHeight) {
        if (w < recWidth * 0.5 || h < recHeight * 0.5) { status = 'err'; msg += ' — รูปเล็กเกินไป' }
        else if (recRatio && Math.abs(ratio - recRatio) > 0.15) { status = 'warn'; msg += ' — สัดส่วนไม่ตรง' }
        else { msg += ' — ขนาดเหมาะสม' }
      }
      setInfo({ w, h, status, msg })
    }
    img.src = src
  }

  useEffect(() => { if (value && !info) checkDim(value) }, [value])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      onChange(result, f)
      checkDim(result)
    }
    reader.readAsDataURL(f)
  }

  const recLabel = recWidth && recHeight ? `แนะนำ: ${recWidth} x ${recHeight} px` : null

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <div className={`upload-zone ${value ? 'has-image' : ''}`} onClick={() => inputRef
