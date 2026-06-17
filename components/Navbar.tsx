'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import LogoIcons from '@/components/LogoIcons'
import type { User } from '@supabase/supabase-js'

interface NavbarProps {
  user: User | null
  isSubscribed: boolean
  isAdmin: boolean
}

export default function Navbar({ user, isSubscribed, isAdmin }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const supabase = createClient()

  function handleSignOut() {
    supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2.5 group">
            <LogoIcons className="hidden sm:flex items-center gap-1.5" />
            <span className="font-display text-2xl leading-none tracking-wide">
              <span className="text-accent">crowd</span><span className="text-ink">cult</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1 text-sm font-mono flex-shrink-0">
            {isSubscribed && <NavLink href="/browse">browse</NavLink>}
            <NavLink href="/submit">submit</NavLink>
            <NavLink href="/about">about</NavLink>
            {isAdmin && <NavLink href="/admin" color="text-yellow">admin</NavLink>}
            {user ? (
              <div className="flex items-center gap-2 ml-2">
                <NavLink href="/settings">account</NavLink>
                <button
                  onClick={handleSignOut}
                  className="flex-shrink-0 whitespace-nowrap text-muted hover:text-ink border border-line hover:border-muted rounded-md px-3 py-1 transition-colors text-xs tracking-widest lowercase"
                >
                  sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <NavLink href="/login">login</NavLink>
                <Link
                  href="/signup"
                  className="flex-shrink-0 whitespace-nowrap bg-accent hover:bg-accent-hover text-background rounded-md px-4 py-1.5 text-xs tracking-widest lowercase font-mono font-bold transition-colors"
                >
                  join →
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-muted hover:text-accent p-2 font-mono text-lg"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? '[x]' : '[≡]'}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-line py-4 flex flex-col gap-3 text-sm font-mono">
            {isSubscribed && <MobileLink href="/browse" onClose={() => setMenuOpen(false)}>~/browse</MobileLink>}
            <MobileLink href="/submit" onClose={() => setMenuOpen(false)}>~/submit</MobileLink>
            <MobileLink href="/about" onClose={() => setMenuOpen(false)}>~/about</MobileLink>
            {isAdmin && <MobileLink href="/admin" onClose={() => setMenuOpen(false)} color="text-yellow">~/admin</MobileLink>}
            {user ? (
              <>
                <MobileLink href="/settings" onClose={() => setMenuOpen(false)}>~/account</MobileLink>
                <button onClick={handleSignOut} className="text-left text-muted hover:text-ink lowercase tracking-widest text-xs py-1">
                  ~/sign-out
                </button>
              </>
            ) : (
              <>
                <MobileLink href="/login" onClose={() => setMenuOpen(false)}>~/login</MobileLink>
                <Link
                  href="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="bg-accent text-background text-center rounded-md py-2 lowercase tracking-widest text-xs font-mono font-bold mt-2"
                >
                  join crowdcult →
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

function NavLink({ href, children, color }: { href: string; children: React.ReactNode; color?: string }) {
  return (
    <Link
      href={href}
      className={`flex-shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 tracking-widest text-xs lowercase transition-colors hover:bg-surface ${
        color ?? 'text-muted hover:text-ink'
      }`}
    >
      {children}
    </Link>
  )
}

function MobileLink({ href, children, onClose, color }: { href: string; children: React.ReactNode; onClose: () => void; color?: string }) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className={`lowercase tracking-widest text-xs py-1 transition-colors ${color ?? 'text-muted hover:text-ink'}`}
    >
      {children}
    </Link>
  )
}
