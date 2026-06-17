'use client'

import { useState, useRef } from 'react'

const GENRES = ['Drama', 'Documentary', 'Comedy', 'Horror', 'Thriller', 'Sci-Fi', 'Romance', 'Animation', 'Experimental', 'Other']

interface FormState {
  title: string
  director: string
  coDirectors: string
  year: string
  runtimeMinutes: string
  genre: string
  description: string
  directorBio: string
  festivalLaurels: string
  contentWarnings: string
  filmLink: string
}

export default function SubmitForm({ director, contactEmail }: { director: string; contactEmail: string }) {
  const [form, setForm] = useState<FormState>({
    title: '', director, coDirectors: '', year: '', runtimeMinutes: '', genre: '',
    description: '', directorBio: '', festivalLaurels: '', contentWarnings: '', filmLink: '',
  })
  const [posterFile, setPosterFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const posterRef = useRef<HTMLInputElement>(null)

  function set(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      let posterUrl = ''
      if (posterFile) {
        const fd = new FormData()
        fd.append('file', posterFile)
        const pr = await fetch('/api/filmmaker/upload-poster', { method: 'POST', body: fd })
        if (pr.ok) posterUrl = (await pr.json()).url
        // Non-fatal: if poster upload fails, continue without it.
      }
      const res = await fetch('/api/filmmaker/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, posterUrl }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Submission failed')
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="font-display text-7xl text-accent mb-4 tracking-[0.04em]">sent!</div>
          <h1 className="font-display text-4xl tracking-[0.04em] text-ink mb-3">submission received</h1>
          <p className="font-mono text-xs text-muted leading-relaxed">
            thanks for submitting <span className="text-ink">{form.title}</span>. we review every film personally —
            we&apos;ll reach out at <span className="text-ink">{contactEmail}</span>. track its status on your account page.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="font-display text-5xl tracking-[0.04em] text-ink mb-2">submit your film</h1>
        <p className="font-mono text-xs text-muted leading-relaxed">
          fill out the details below. we review every submission and reach out with a decision.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Section title="// film details">
          <Field label="title *" value={form.title} onChange={set('title')} required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="director *" value={form.director} onChange={set('director')} required />
            <Field label="co-directors" value={form.coDirectors} onChange={set('coDirectors')} placeholder="comma separated" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="year" type="number" value={form.year} onChange={set('year')} min="1880" max="2100" />
            <Field label="runtime (min)" type="number" value={form.runtimeMinutes} onChange={set('runtimeMinutes')} min="1" />
            <Select label="genre" value={form.genre} onChange={set('genre')} options={GENRES} />
          </div>
          <Textarea label="synopsis *" value={form.description} onChange={set('description')} required rows={4} />
          <Textarea label="director bio" value={form.directorBio} onChange={set('directorBio')} rows={3} />
          <Field label="festival laurels / awards" value={form.festivalLaurels} onChange={set('festivalLaurels')} placeholder="e.g. Sundance 2025 official selection" />
          <Field label="content warnings" value={form.contentWarnings} onChange={set('contentWarnings')} placeholder="e.g. violence, strong language" />
        </Section>

        <Section title="// the film">
          <p className="font-mono text-xs text-muted leading-relaxed">
            provide a private link (google drive, dropbox, vimeo with password, etc.) so we can review the film.
            if accepted we&apos;ll coordinate the final upload.
          </p>
          <Field label="video link *" type="url" value={form.filmLink} onChange={set('filmLink')} required placeholder="https://..." />
          <div>
            <label className="block font-mono text-xs text-muted uppercase tracking-widest mb-2">poster image (optional)</label>
            <input
              ref={posterRef}
              type="file"
              accept="image/*"
              onChange={e => setPosterFile(e.target.files?.[0] ?? null)}
              className="block w-full text-xs text-muted font-mono file:mr-3 file:py-2 file:px-4 file:rounded-md file:border file:border-line file:bg-surface-2 file:text-ink hover:file:border-accent file:cursor-pointer"
            />
          </div>
        </Section>

        <Section title="// contact">
          <div>
            <label className="block font-mono text-xs text-muted uppercase tracking-widest mb-2">contact email</label>
            <input value={contactEmail} readOnly className="w-full bg-background/50 border border-line rounded-md px-4 py-3 text-muted font-mono text-sm cursor-not-allowed" />
            <p className="font-mono text-[10px] text-muted/60 mt-1">edit this on your account page</p>
          </div>
        </Section>

        {error && <p className="font-mono text-xs text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-background py-3 rounded-md font-mono text-sm uppercase tracking-widest font-bold transition-colors"
        >
          {submitting ? 'submitting_' : 'submit film for review →'}
        </button>
      </form>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-line rounded-xl bg-surface p-6 space-y-4">
      <h2 className="font-mono text-xs text-muted uppercase tracking-widest">{title}</h2>
      {children}
    </section>
  )
}

function Field({ label, value, onChange, type = 'text', required, placeholder, min, max }: {
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: string; required?: boolean; placeholder?: string; min?: string; max?: string
}) {
  return (
    <div>
      <label className="block font-mono text-xs text-muted uppercase tracking-widest mb-2">{label}</label>
      <input
        type={type} value={value} onChange={onChange} required={required} placeholder={placeholder} min={min} max={max}
        className="w-full bg-background border border-line focus:border-accent rounded-md px-4 py-2.5 text-ink font-mono text-sm placeholder-muted focus:outline-none"
      />
    </div>
  )
}

function Textarea({ label, value, onChange, required, rows = 3 }: {
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; required?: boolean; rows?: number
}) {
  return (
    <div>
      <label className="block font-mono text-xs text-muted uppercase tracking-widest mb-2">{label}</label>
      <textarea
        value={value} onChange={onChange} required={required} rows={rows}
        className="w-full bg-background border border-line focus:border-accent rounded-md px-4 py-2.5 text-ink font-mono text-sm placeholder-muted focus:outline-none resize-none"
      />
    </div>
  )
}

function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: string[]
}) {
  return (
    <div>
      <label className="block font-mono text-xs text-muted uppercase tracking-widest mb-2">{label}</label>
      <select
        value={value} onChange={onChange}
        className="w-full bg-background border border-line focus:border-accent rounded-md px-3 py-2.5 text-ink font-mono text-sm focus:outline-none"
      >
        <option value="">select…</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}
