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
      <div className={`upload-zone ${value ? 'has-image' : ''}`} onClick={() => inputRef.current?.click()}>
        {value ? (
          <>
            <img src={value} alt="" />
            <div className="upload-overlay">เปลี่ยนรูป</div>
          </>
        ) : (
          <div className="text-slate-400">
            <p className="text-sm">{label || 'อัปโหลดรูปภาพ'}</p>
            <p className="text-xs mt-1">PNG, JPG — กดเพื่อเลือกไฟล์</p>
            {recLabel && <span className="inline-block mt-2 px-3 py-1 rounded bg-cyan-50 text-primary text-xs font-semibold">{recLabel}</span>}
          </div>
        )}
      </div>
      {info && value && (
        <div className={`flex items-center gap-2 mt-2 px-3 py-2 rounded-lg bg-slate-50 border text-xs ${info.status === 'ok' ? 'text-emerald-600 border-emerald-200' : info.status === 'warn' ? 'text-amber-600 border-amber-200' : 'text-red-500 border-red-200'}`}>
          <span className="font-semibold">{info.msg}</span>
        </div>
      )}
    </div>
  )
}

export function RichTextEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [fontColor, setFontColor] = useState('#0e7490')

  useEffect(() => {
    if (editorRef.current && value && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value
    }
  }, [])

  const exec = (cmd: string, val: string | null = null) => {
    document.execCommand(cmd, false, val || undefined)
    editorRef.current?.focus()
    handleChange()
  }

  const handleChange = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML)
  }

  const handleImgFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = (ev) => exec('insertImage', ev.target?.result as string)
    reader.readAsDataURL(f)
  }

  return (
    <div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImgFile} />
      <div className="rte-toolbar">
        <button className="rte-btn" onClick={() => exec('bold')} title="Bold"><b>B</b></button>
        <button className="rte-btn" onClick={() => exec('italic')} title="Italic"><i>I</i></button>
        <button className="rte-btn" onClick={() => exec('underline')} title="Underline"><u>U</u></button>
        <div className="rte-divider" />
        <input type="color" className="rte-color" value={fontColor} onChange={(e) => { setFontColor(e.target.value); exec('foreColor', e.target.value) }} />
        <div className="rte-divider" />
        <button className="rte-btn" onClick={() => { const u = prompt('URL:'); if (u) exec('createLink', u) }}>Link</button>
        <button className="rte-btn" onClick={() => fileRef.current?.click()}>Img</button>
        <div className="rte-divider" />
        <button className="rte-btn" onClick={() => exec('formatBlock', '<h2>')}>H</button>
        <button className="rte-btn" onClick={() => exec('formatBlock', '<p>')}>P</button>
      </div>
      <div className="rte-editor" ref={editorRef} contentEditable suppressContentEditableWarning onInput={handleChange} />
    </div>
  )
}

export function ShareButtons({ title, articleId }: { title: string; articleId: number }) {
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/article/${articleId}` : ''
  return (
    <div className="flex items-center gap-3 mt-7 pt-5 border-t border-slate-200">
      <span className="text-sm font-semibold text-slate-500">แชร์</span>
      <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(title)}`, '_blank', 'width=600,height=400')} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-semibold bg-[#1877F2] hover:opacity-90 transition">Facebook</button>
      <button onClick={() => window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`, '_blank', 'width=600,height=400')} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-semibold bg-[#06C755] hover:opacity-90 transition">LINE</button>
    </div>
  )
}
