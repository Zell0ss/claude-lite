// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest'

beforeAll(() => {
  process.env.AUTH_COOKIE_SECRET = '0'.repeat(64) // 32 bytes hex = 64 chars
  // A real bcrypt hash of 'testpassword' — precomputed so tests don't slow down
  process.env.AUTH_PASSWORD_HASH = '$2b$10$l5eHxGqk21ReO5D6xBzoB.cSVzGzCkAhVP1adIJNmf7ReDCTukuYO'
})

describe('auth helpers', () => {
  it('signToken returns a JWT string', async () => {
    const { signToken } = await import('@/lib/auth')
    const token = await signToken({ sub: 'user' })
    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3)
  })

  it('verifyToken round-trips correctly', async () => {
    const { signToken, verifyToken } = await import('@/lib/auth')
    const token = await signToken({ sub: 'user' })
    const payload = await verifyToken(token)
    expect(payload.sub).toBe('user')
  })

  it('verifyToken throws on invalid token', async () => {
    const { verifyToken } = await import('@/lib/auth')
    await expect(verifyToken('bad.token.here')).rejects.toThrow()
  })

  it('verifyPassword returns true for correct password', async () => {
    const { verifyPassword } = await import('@/lib/auth')
    const result = await verifyPassword('testpassword')
    expect(result).toBe(true)
  })

  it('verifyPassword returns false for wrong password', async () => {
    const { verifyPassword } = await import('@/lib/auth')
    const result = await verifyPassword('wrongpassword')
    expect(result).toBe(false)
  })
})
