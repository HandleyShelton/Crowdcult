'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

interface NavbarProps {
  user: User | null
  isSubscribed: boolean
  isAdmin: boolean
}

export default function Navbar({ user, isSubscribed, isAdmin }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            <span className="text-accent">Crowd</span>cult
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6 text-sm">
            {isSubscribed && (
              <Link href="/browse" className="text-gray-300 hover:text-white transition-colors">
                Browse
              </Link>
            )}
            <Link href="/submit" className="text-gray-300 hover:text-white transition-colors">
              Submit Your Film
            </Link>
            <Link href="/about" className="text-gray-300 hover:text-white transition-colors">
              About
            </Link>
            {isAdmin && (
              <Link href="/admin" className="text-accent hover:text-accent-hover transition-colors font-medium">
                Admin
              </Link>
            )}
            {user ? (
              <button
                onClick={handleSignOut}
                className="bg-surface-2 text-white px-4 py-2 rounded hover:bg-white/20 transition-colors"
              >
                Sign Out
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="text-gray-300 hover:text-white transition-colors">
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded transition-colors font-medium"
                >
                  Start Watching
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-gray-300 hover:text-white p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/10 py-4 flex flex-col gap-4 text-sm">
            {isSubscribed && (
              <Link href="/browse" onClick={() => setMenuOpen(false)} className="text-gray-300 hover:text-white">
                Browse
              </Link>
            )}
            <Link href="/submit" onClick={() => setMenuOpen(false)} className="text-gray-300 hover:text-white">
              Submit Your Film
            </Link>
            <Link href="/about" onClick={() => setMenuOpen(false)} className="text-gray-300 hover:text-white">
              About
            </Link>
            {isAdmin && (
              <Link href="/admin" onClick={() => setMenuOpen(false)} className="text-accent font-medium">
                Admin
              </Link>
            )}
            {user ? (
              <button onClick={handleSignOut} className="text-left text-gray-300 hover:text-white">
                Sign Out
              </button>
            ) : (
              <>
                <Link href="/login" onClick={() => setMenuOpen(false)} className="text-gray-300 hover:text-white">
                  Log In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="bg-accent text-white px-4 py-2 rounded text-center font-medium"
                >
                  Start Watching
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
