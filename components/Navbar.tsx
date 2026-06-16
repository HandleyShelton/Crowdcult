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
    <nav className="sticky top-0 z-50 bg-black border-t-[3px] border-accent border-b border-red-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="font-display text-3xl leading-none tracking-wider">
            <span className="text-accent">CROWD</span><span className="text-white">CULT</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1 text-sm font-mono">
            {isSubscribed && (
              <NavLink href="/browse">[ BROWSE ]</NavLink>
            )}
            <NavLink href="/submit">[ SUBMIT FILM ]</NavLink>
            <NavLink href="/about">[ ABOUT ]</NavLink>
            {isAdmin && (
              <NavLink href="/admin" accent>[ ADMIN ]</NavLink>
            )}
            {user ? (
              <button
                onClick={handleSignOut}
                className="ml-2 text-gray-400 hover:text-white border border-white/20 hover:border-white/50 px-3 py-1 transition-colors text-xs tracking-widest uppercase"
              >
                sign out
              </button>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <NavLink href="/login">[ login ]</NavLink>
                <Link
                  href="/signup"
                  className="bg-accent hover:bg-accent-hover text-white px-4 py-1.5 text-xs tracking-widest uppercase font-mono transition-colors"
                >
                  JOIN →
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-gray-300 hover:text-accent p-2 font-mono text-lg"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? '[ × ]' : '[ ≡ ]'}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-red-900 py-4 flex flex-col gap-3 text-sm font-mono">
            {isSubscribed && (
              <MobileLink href="/browse" onClose={() => setMenuOpen(false)}>» BROWSE FILMS</MobileLink>
            )}
            <MobileLink href="/submit" onClose={() => setMenuOpen(false)}>» SUBMIT FILM</MobileLink>
            <MobileLink href="/about" onClose={() => setMenuOpen(false)}>» ABOUT</MobileLink>
            {isAdmin && (
              <MobileLink href="/admin" onClose={() => setMenuOpen(false)} accent>» ADMIN</MobileLink>
            )}
            {user ? (
              <button onClick={handleSignOut} className="text-left text-gray-400 hover:text-white uppercase tracking-widest text-xs py-1">
                » sign out
              </button>
            ) : (
              <>
                <MobileLink href="/login" onClose={() => setMenuOpen(false)}>» LOG IN</MobileLink>
                <Link
                  href="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="bg-accent text-white text-center py-2 uppercase tracking-widest text-xs font-mono mt-2"
                >
                  JOIN CROWDCULT →
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

function NavLink({ href, children, accent }: { href: string; children: React.ReactNode; accent?: boolean }) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 tracking-widest text-xs uppercase transition-colors hover:text-accent ${
        accent ? 'text-accent' : 'text-gray-400 hover:text-white'
      }`}
    >
      {children}
    </Link>
  )
}

function MobileLink({ href, children, onClose, accent }: { href: string; children: React.ReactNode; onClose: () => void; accent?: boolean }) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className={`uppercase tracking-widest text-xs py-1 transition-colors ${
        accent ? 'text-accent' : 'text-gray-300 hover:text-white'
      }`}
    >
      {children}
    </Link>
  )
}
