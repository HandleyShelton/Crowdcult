import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Crowdcult — Independent Media',
  description: 'Independent media. Real filmmakers. 50% goes back to the artists.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isSubscribed = false
  let isAdmin = false

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('is_subscribed, email')
      .eq('id', user.id)
      .single()

    isSubscribed = profile?.is_subscribed ?? false
    const adminEmails = (process.env.ADMIN_EMAIL ?? '').split(',').map(e => e.trim().toLowerCase())
    isAdmin = adminEmails.includes((profile?.email ?? '').toLowerCase())
  }

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-background text-ink">
        <Navbar user={user} isSubscribed={isSubscribed} isAdmin={isAdmin} />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
