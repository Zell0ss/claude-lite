import { SignJWT, jwtVerify } from 'jose'
import { compare } from 'bcryptjs'

function getSecret() {
  const s = process.env.AUTH_COOKIE_SECRET
  if (!s) throw new Error('AUTH_COOKIE_SECRET is not set')
  return new TextEncoder().encode(s)
}

export async function signToken(payload: { sub: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getSecret())
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret())
  return payload
}

export async function verifyPassword(password: string): Promise<boolean> {
  const hashSuffix = process.env.AUTH_PASSWORD_HASH
  if (!hashSuffix) throw new Error('AUTH_PASSWORD_HASH is not set')
  // Stored without the $2b$12$ prefix to avoid dotenv $ interpolation issues
  const hash = hashSuffix.startsWith('$') ? hashSuffix : `$2b$12$${hashSuffix}`
  return compare(password, hash)
}

export const COOKIE_NAME = 'claude-lite-session'
