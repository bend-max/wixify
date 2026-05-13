'use client'

import { useEffect, useRef, useState } from 'react'

type RefImage = { url: string; pathname: string }

export default function Home() {
  const [refImages, setRefImages] = useState<RefImage[]>([])
  const [selectedRef, setSelectedRef] = useState<string | null>(null)
  const [prompt, setPrompt] = useState('')
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { fetchImages() }, [])

  async function fetchImages() {
    const res = await fetch('/api/images')
    const data = await res.json()
    setRefImages(data.images ?? [])
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const form = new FormData()
    form.append('file', file)
    await fetch('/api/upload', { method: 'POST', body: form })
    await fetchImages()
    setUploading(false)
  }

  async function handleDelete(pathname: string) {
    await fetch('/api/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pathname }),
    })
    if (selectedRef === pathname) setSelectedRef(null)
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
        body: JSON.stringify({ prompt, referenceUrl: selectedRef }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setGeneratedImage(data.imageUrl)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'שגיאה לא ידועה')
    }
    setLoading(false)
  }

  const selectedImage = refImages.find(img => img.pathname === selectedRef)

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-center">🎨 Style Generator</h1>

      {/* Gallery */}
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
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </div>

        {refImages.length === 0 ? (
          <div className="border-2 border-dashed border-gray-700 rounded-xl p-12 text-center text-gray-500">
            העלה תמונות רפרנס כדי להתחיל
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {refImages.map(img => (
              <div
                key={img.pathname}
                onClick={() => setSelectedRef(img.pathname)}
                className={`relative group cursor-pointer rounded-xl overflow-hidden border-2 transition ${
                  selectedRef === img.pathname ? 'border-indigo-500' : 'border-transparent'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="w-full h-32 object-cover" />
                {selectedRef === img.pathname && (
                  <div className="absolute top-1 right-1 bg-indigo-500 rounded-full w-5 h-5 flex items-center justify-center text-xs">✓</div>
                )}
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(img.pathname) }}
                  className="absolute top-1 left-1 bg-red-600 hover:bg-red-700 rounded-full w-6 h-6 items-center justify-center text-xs hidden group-hover:flex transition"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Generate */}
      <section className="bg-gray-900 rounded-2xl p-6 space-y-4">
        <h2 className="text-xl font-semibold">יצירת תמונה</h2>

        {selectedImage && (
          <div className="flex items-center gap-3 text-sm text-gray-400">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selectedImage.url} alt="" className="w-10 h-10 rounded-lg object-cover" />
            <span>סגנון נבחר</span>
          </div>
        )}

        {!selectedRef && (
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
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
