'use client'

import { useState, useRef } from 'react'

const GENRES = ['Drama', 'Documentary', 'Comedy', 'Thriller', 'Horror', 'Sci-Fi', 'Animation', 'Experimental', 'Romance', 'Action']

interface FormData {
  title: string
  director: string
  directorBio: string
  year: string
  runtimeMinutes: string
  genre: string
  description: string
  festivalLaurels: string
}

export default function UploadTab() {
  const [form, setForm] = useState<FormData>({
    title: '', director: '', directorBio: '', year: new Date().getFullYear().toString(),
    runtimeMinutes: '', genre: '', description: '', festivalLaurels: '',
  })
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [posterFile, setPosterFile] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')
  const videoInputRef = useRef<HTMLInputElement>(null)
  const posterInputRef = useRef<HTMLInputElement>(null)

  function setField(key: keyof FormData, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!videoFile) { setMessage('Please select a video file.'); return }

    setStatus('uploading')
    setProgress(0)
    setMessage('Creating film record and upload URL…')

    try {
      // Step 1: create upload URL + film record
      const res = await fetch('/api/mux-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          year: parseInt(form.year),
          runtimeMinutes: parseInt(form.runtimeMinutes),
        }),
      })
      const { uploadUrl, error: apiError } = await res.json()
      if (apiError) throw new Error(apiError)

      setMessage('Uploading video to Mux…')
      setProgress(10)

      // Step 2: upload video directly to Mux
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setProgress(10 + Math.floor((event.loaded / event.total) * 85))
          }
        }
        xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`))
        xhr.onerror = () => reject(new Error('Upload network error'))
        xhr.open('PUT', uploadUrl)
        xhr.send(videoFile)
      })

      setProgress(95)
      setMessage('Video uploaded! Mux is processing it (this may take a few minutes)…')

      // Step 3: upload poster if provided
      if (posterFile) {
        setMessage('Uploading poster image…')
        const posterForm = new FormData()
        posterForm.append('file', posterFile)
        await fetch('/api/admin/upload-poster', { method: 'POST', body: posterForm })
      }

      setProgress(100)
      setStatus('success')
      setMessage('Upload complete! The film will appear in the catalog once Mux finishes processing.')
      setForm({ title: '', director: '', directorBio: '', year: new Date().getFullYear().toString(), runtimeMinutes: '', genre: '', description: '', festivalLaurels: '' })
      setVideoFile(null)
      setPosterFile(null)
      if (videoInputRef.current) videoInputRef.current.value = ''
      if (posterInputRef.current) posterInputRef.current.value = ''
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Upload New Film</h2>

      {message && (
        <div className={`rounded-lg px-4 py-3 mb-6 text-sm ${
          status === 'error' ? 'bg-red-900/30 border border-red-500/30 text-red-300' :
          status === 'success' ? 'bg-green-900/30 border border-green-500/30 text-green-300' :
          'bg-blue-900/30 border border-blue-500/30 text-blue-300'
        }`}>
          {message}
          {status === 'uploading' && (
            <div className="mt-2 bg-black/30 rounded-full h-1.5">
              <div className="bg-accent h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Title *</label>
            <input required value={form.title} onChange={e => setField('title', e.target.value)}
              className="input w-full" placeholder="Film title" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Director *</label>
            <input required value={form.director} onChange={e => setField('director', e.target.value)}
              className="input w-full" placeholder="Director name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Genre</label>
            <select value={form.genre} onChange={e => setField('genre', e.target.value)} className="input w-full">
              <option value="">Select genre</option>
              {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Year</label>
            <input type="number" value={form.year} onChange={e => setField('year', e.target.value)}
              className="input w-full" min={1900} max={2100} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Runtime (minutes)</label>
            <input type="number" value={form.runtimeMinutes} onChange={e => setField('runtimeMinutes', e.target.value)}
              className="input w-full" placeholder="90" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => setField('description', e.target.value)}
              className="input w-full" rows={3} placeholder="Film synopsis…" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Director Bio</label>
            <textarea value={form.directorBio} onChange={e => setField('directorBio', e.target.value)}
              className="input w-full" rows={2} placeholder="Short director biography…" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Festival Laurels</label>
            <input value={form.festivalLaurels} onChange={e => setField('festivalLaurels', e.target.value)}
              className="input w-full" placeholder="e.g. Sundance 2024 Official Selection" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Video File *</label>
          <input ref={videoInputRef} type="file" accept="video/*" onChange={e => setVideoFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-surface-2 file:text-white hover:file:bg-white/20 file:cursor-pointer" />
          <p className="text-xs text-gray-500 mt-1">MP4, MOV, or MKV. Uploaded directly to Mux.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Custom Poster (optional)</label>
          <input ref={posterInputRef} type="file" accept="image/*" onChange={e => setPosterFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-surface-2 file:text-white hover:file:bg-white/20 file:cursor-pointer" />
          <p className="text-xs text-gray-500 mt-1">JPG or PNG. If not provided, Mux auto-thumbnail is used.</p>
        </div>

        <button
          type="submit"
          disabled={status === 'uploading'}
          className="bg-accent hover:bg-accent-hover disabled:opacity-60 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          {status === 'uploading' ? 'Uploading…' : 'Upload Film'}
        </button>
      </form>

      <style jsx>{`
        .input {
          background: #1f1f1f;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 0.5rem;
          padding: 0.625rem 1rem;
          color: white;
          font-size: 0.875rem;
        }
        .input:focus { outline: none; border-color: #e50914; }
        .input option { background: #1f1f1f; }
      `}</style>
    </div>
  )
}
