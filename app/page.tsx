'use client'

import { useEffect, useRef, useState } from 'react'

type RefImage = { url: string; pathname: string }

export default function Home() {
  const [refImages, setRefImages] = useState<RefImage[]>([])
  const [selectedRef, setSelectedRef] = useState<RefImage | null>(null)
  const [prompt, setPrompt] = useState('')
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draggingOver, setDraggingOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { fetchImages() }, [])

  async function fetchImages() {
    const res = await fetch('/api/images')
    const data = await res.json()
    setRefImages(data.images ?? [])
  }

 async function uploadFile(file: File) {
  setUploading(true)
  try {
    const form = new FormData()
    form.append('file', file)
    await fetch('/api/upload', { method: 'POST', body: form })
    await fetchImages()
  } catch (e) {
    console.error(e)
  } finally {
    setUploading(false)
  }
}
  async function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) await uploadFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDraggingOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) uploadFile(file)
  }

  async function handleDelete(pathname: string) {
    await fetch('/api/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pathname }),
    })
    if (selectedRef?.pathname === pathname) setSelectedRef(null)
    await fetchImages()
  }

  async function handleGenerate() {
    if (!selectedRef || !prompt.trim()) return
    setLoading(true)
    setError(null)
    setGeneratedImage(null)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, referenceUrl: selectedRef.url }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setGeneratedImage(data.imageUrl)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'שגיאה לא ידועה')
    }
    setLoading(false)
  }

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-center">🎨 Style Generator</h1>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">גלריית סגנונות</h2>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            {uploading ? 'מעלה...' : '+ הוסף תמונה'}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
        </div>

        <div
          onDragOver={e => { e.preventDefault(); setDraggingOver(true) }}
          onDragLeave={() => setDraggingOver(false)}
          onDrop={handleDrop}
          className={`min-h-40 rounded-xl transition ${draggingOver ? 'ring-2 ring-indigo-400 bg-indigo-950' : ''}`}
        >
          {refImages.length === 0 ? (
            <div className="border-2 border-dashed border-gray-700 rounded-xl p-12 text-center text-gray-500">
              {uploading ? 'מעלה...' : 'גרור תמונת רפרנס לכאן או לחץ "+ הוסף תמונה"'}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {refImages.map(img => (
                <div
                  key={img.pathname}
                  onClick={() => setSelectedRef(img)}
                  className={`relative group cursor-pointer rounded-xl overflow-hidden border-2 transition ${
                    selectedRef?.pathname === img.pathname
                      ? 'border-indigo-500 ring-2 ring-indigo-400'
                      : 'border-transparent hover:border-gray-500'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-32 object-cover" />
                  {selectedRef?.pathname === img.pathname && (
                    <div className="absolute top-2 right-2 bg-indigo-500 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">✓</div>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(img.pathname) }}
                    className="absolute top-2 left-2 bg-red-600 hover:bg-red-700 rounded-full w-6 h-6 items-center justify-center text-xs hidden group-hover:flex"
                  >
                    ×
                  </button>
                </div>
              ))}
              <div
                className="border-2 border-dashed border-gray-700 rounded-xl h-32 flex items-center justify-center text-gray-600 text-sm cursor-pointer hover:border-gray-500 transition"
                onClick={() => fileInputRef.current?.click()}
              >
                + הוסף
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="bg-gray-900 rounded-2xl p-6 space-y-4">
        <h2 className="text-xl font-semibold">יצירת תמונה</h2>

        {selectedRef ? (
          <div className="flex items-center gap-3 text-sm text-gray-300 bg-gray-800 rounded-xl p-3">
            <img src={selectedRef.url} alt="" className="w-12 h-12 rounded-lg object-cover" />
            <span>סגנון נבחר ✓</span>
          </div>
        ) : (
          <p className="text-sm text-yellow-500">בחר תמונת רפרנס מהגלריה למעלה</p>
        )}

        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="תאר מה אתה רוצה ליצור..."
          rows={3}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-indigo-500"
        />

        <button
          onClick={handleGenerate}
          disabled={loading || !selectedRef || !prompt.trim()}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed py-3 rounded-xl font-semibold transition"
        >
          {loading ? 'יוצר תמונה...' : 'צור תמונה'}
        </button>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        {generatedImage && (
          <div className="space-y-2">
            <img src={generatedImage} alt="תמונה שנוצרה" className="w-full rounded-xl" />
            <a
              href={generatedImage}
              download="generated.png"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center bg-gray-700 hover:bg-gray-600 py-2 rounded-xl text-sm transition"
            >
              הורד תמונה
            </a>
          </div>
        )}
      </section>
    </main>
  )
}
