import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createHmac, timingSafeEqual } from 'crypto'

export async function POST(req: NextRequest) {
  const body = await req.text()

  // Verify Mux webhook signature — FAIL CLOSED. A missing/invalid signature is
  // rejected, so nobody can forge a video.asset.ready to hijack a film's video.
  const secret = process.env.MUX_WEBHOOK_SECRET
  if (!secret) {
    console.error('MUX_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }
  const muxSig = req.headers.get('mux-signature')
  const t = muxSig?.split(',')[0]?.split('=')[1]
  const v1 = muxSig?.split(',')[1]?.split('=')[1]
  if (!t || !v1) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
  }
  const expected = createHmac('sha256', secret).update(`${t}.${body}`).digest('hex')
  const expBuf = Buffer.from(expected)
  const gotBuf = Buffer.from(v1)
  if (expBuf.length !== gotBuf.length || !timingSafeEqual(expBuf, gotBuf)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(body)
  const supabase = createServiceClient()

  if (event.type === 'video.asset.ready') {
    const asset = event.data
    const filmId = asset.passthrough // we pass the film DB id as passthrough

    if (filmId) {
      const playbackId = asset.playback_ids?.[0]?.id

      await supabase
        .from('films')
        .update({
          mux_asset_id: asset.id,
          mux_playback_id: playbackId ?? null,
          status: 'ready',
        })
        .eq('id', filmId)
    }
  }

  return NextResponse.json({ received: true })
}
