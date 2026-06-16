'use client'

import { useState } from 'react'

interface FormState {
  name: string
  email: string
  title: string
  director: string
  directorBio: string
  year: string
  runtimeMinutes: string
  genre: string
  description: string
  festivalLaurels: string
  filmLink: string
  message: string
}

const BLANK: FormState = {
  name: '',
  email: '',
  title: '',
  director: '',
  directorBio: '',
  year: '',
  runtimeMinutes: '',
  genre: '',
  description: '',
  festivalLaurels: '',
  filmLink: '',
  message: '',
}

export default function SubmitPage() {
  const [form, setForm] = useState<FormState>(BLANK)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  function set(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm(f => ({ ...f, [field]: e.target.value }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/submit-film', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? 'Submission failed')
      }
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-3">Submission received</h1>
          <p className="text-gray-400 leading-relaxed">
            Thanks for submitting <strong className="text-ink">{form.title}</strong>. We&apos;ll
            review it and get back to you at <strong className="text-ink">{form.email}</strong>.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-3">Submit your film</h1>
        <p className="text-gray-400 leading-relaxed">
          We curate indie films for our subscriber community. Fill out the form below and
          we&apos;ll review your submission. If selected, we&apos;ll reach out to coordinate
          distribution.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Contact */}
        <section className="bg-surface rounded-xl p-6 border border-white/10 space-y-4">
          <h2 className="font-semibold text-ink text-lg">Your contact info</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Your name *" value={form.name} onChange={set('name')} required />
            <Field label="Email *" type="email" value={form.email} onChange={set('email')} required />
          </div>
        </section>

        {/* Film details */}
        <section className="bg-surface rounded-xl p-6 border border-white/10 space-y-4">
          <h2 className="font-semibold text-ink text-lg">Film details</h2>
          <Field label="Film title *" value={form.title} onChange={set('title')} required />
          <Field label="Director *" value={form.director} onChange={set('director')} required />
          <TextareaField
            label="Director bio"
            value={form.directorBio}
            onChange={set('directorBio')}
            placeholder="Short bio for the director page"
            rows={3}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Year" type="number" value={form.year} onChange={set('year')} min="1900" max="2099" />
            <Field label="Runtime (minutes)" type="number" value={form.runtimeMinutes} onChange={set('runtimeMinutes')} min="1" />
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Genre</label>
              <select
                value={form.genre}
                onChange={set('genre')}
                className="w-full bg-surface-2 border border-white/10 rounded-lg px-3 py-2.5 text-ink text-sm focus:outline-none focus:border-accent"
              >
                <option value="">Select…</option>
                {['Drama', 'Documentary', 'Comedy', 'Horror', 'Thriller', 'Sci-Fi', 'Romance', 'Animation', 'Other'].map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>
          <TextareaField
            label="Synopsis *"
            value={form.description}
            onChange={set('description')}
            required
            rows={4}
            placeholder="A brief description of your film"
          />
          <Field
            label="Festival laurels / awards"
            value={form.festivalLaurels}
            onChange={set('festivalLaurels')}
            placeholder="e.g. Sundance Official Selection 2025"
          />
        </section>

        {/* File link */}
        <section className="bg-surface rounded-xl p-6 border border-white/10 space-y-4">
          <h2 className="font-semibold text-ink text-lg">Film file</h2>
          <p className="text-sm text-gray-400">
            Provide a download or streaming link (Google Drive, Dropbox, Vimeo password-protected, etc.)
            so we can review the film. If selected we&apos;ll coordinate the final upload.
          </p>
          <Field
            label="Film link"
            type="url"
            value={form.filmLink}
            onChange={set('filmLink')}
            placeholder="https://drive.google.com/…"
          />
          <TextareaField
            label="Additional notes"
            value={form.message}
            onChange={set('message')}
            rows={3}
            placeholder="Anything else you'd like us to know"
          />
        </section>

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-accent hover:bg-accent/90 disabled:opacity-50 text-ink font-semibold py-3 rounded-lg transition-colors"
        >
          {submitting ? 'Submitting…' : 'Submit film for review'}
        </button>
      </form>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
  placeholder,
  min,
  max,
}: {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: string
  required?: boolean
  placeholder?: string
  min?: string
  max?: string
}) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        min={min}
        max={max}
        className="w-full bg-surface-2 border border-white/10 rounded-lg px-3 py-2.5 text-ink text-sm placeholder-gray-600 focus:outline-none focus:border-accent"
      />
    </div>
  )
}

function TextareaField({
  label,
  value,
  onChange,
  required,
  placeholder,
  rows = 3,
}: {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  required?: boolean
  placeholder?: string
  rows?: number
}) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        rows={rows}
        className="w-full bg-surface-2 border border-white/10 rounded-lg px-3 py-2.5 text-ink text-sm placeholder-gray-600 focus:outline-none focus:border-accent resize-none"
      />
    </div>
  )
}
