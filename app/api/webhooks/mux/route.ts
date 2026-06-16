import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createHmac } from 'crypto'

export async function POST(req: NextRequest) {
  const body = await req.text()

  // Verify Mux webhook signature
  const muxSig = req.headers.get('mux-signature')
  if (muxSig && process.env.MUX_WEBHOOK_SECRET) {
    const [tPart, v1Part] = muxSig.split(',')
    const t = tPart?.split('=')[1]
    const v1 = v1Part?.split('=')[1]
    if (t && v1) {
      const signedPayload = `${t}.${body}`
      const expected = createHmac('sha256', process.env.MUX_WEBHOOK_SECRET)
        .update(signedPayload)
        .digest('hex')
      if (expected !== v1) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }
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
