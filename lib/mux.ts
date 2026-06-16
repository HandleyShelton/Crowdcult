import Mux from '@mux/mux-node'
import { SignJWT, importPKCS8 } from 'jose'

export const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
})

export async function signPlaybackToken(playbackId: string): Promise<string> {
  const keyId = process.env.MUX_SIGNING_KEY_ID!
  const privateKeyB64 = process.env.MUX_SIGNING_PRIVATE_KEY!

  const privateKeyPem = Buffer.from(privateKeyB64, 'base64').toString('utf-8')
  const privateKey = await importPKCS8(privateKeyPem, 'RS256')

  const token = await new SignJWT({ sub: playbackId, aud: 'v' })
    .setProtectedHeader({ alg: 'RS256', kid: keyId, typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(privateKey)

  return token
}


