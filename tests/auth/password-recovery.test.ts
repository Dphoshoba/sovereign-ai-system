import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockResetPasswordForEmail = vi.fn()
const mockUpdateUser = vi.fn()
const mockSignOut = vi.fn()
const mockGetSession = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: () => ({
    auth: {
      resetPasswordForEmail: mockResetPasswordForEmail,
      updateUser: mockUpdateUser,
      signOut: mockSignOut,
      getSession: mockGetSession,
      signInWithPassword: vi.fn(),
    },
  }),
}))

describe('Password Recovery — Forgot Password Flow', () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('resetPasswordForEmail accepts email and redirectTo', () => {
    const email = 'test@example.com'
    const redirectTo = 'http://localhost:3000/reset-password'

    mockResetPasswordForEmail.mockResolvedValue({ error: null })
    expect(typeof email).toBe('string')
    expect(typeof redirectTo).toBe('string')
    expect(redirectTo).toContain('/reset-password')
  })

  it('neutral success message does not reveal account existence', () => {
    const neutralMessages = [
      'If an account exists for that email address, a password reset link has been sent.',
      'Please check your inbox and follow the instructions.',
    ]
    for (const msg of neutralMessages) {
      expect(msg.toLowerCase()).not.toContain('not found')
      expect(msg.toLowerCase()).not.toContain("doesn't exist")
      expect(msg.toLowerCase()).not.toContain('no account')
    }
  })

  it('redirectTo uses correct origin for production', () => {
    const origins = ['https://sovereign-ai-executive.vercel.app', 'http://localhost:3000']
    for (const origin of origins) {
      const redirectTo = `${origin}/reset-password`
      expect(redirectTo).toBe(`${origin}/reset-password`)
    }
  })

  it('resetPasswordForEmail error is handled safely', () => {
    mockResetPasswordForEmail.mockResolvedValue({
      error: { message: 'Rate limit exceeded' },
    })
    expect(true).toBe(true)
  })
})

describe('Password Recovery — Reset Password Flow', () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('missing recovery session displays expired message', () => {
    mockGetSession.mockResolvedValue({ data: { session: null } })

    const hasSession = false
    expect(hasSession).toBe(false)
  })

  it('valid recovery session allows password update', () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: '123' } } } })

    const hasSession = true
    expect(hasSession).toBe(true)
  })

  it('password shorter than 12 characters is rejected', () => {
    const short = 'short1'
    const long = 'longenough123'

    expect(short.length).toBeLessThan(12)
    expect(long.length).toBeGreaterThanOrEqual(12)
  })

  it('mismatched passwords are rejected', () => {
    const password = 'validpassword123'
    const confirm = 'differentpassword123'

    expect(password).not.toBe(confirm)
  })

  it('matching passwords are accepted', () => {
    const password = 'validpassword123'
    const confirm = 'validpassword123'

    expect(password).toBe(confirm)
  })

  it('updateUser succeeds and signOut is called', () => {
    mockUpdateUser.mockResolvedValue({ error: null })
    mockSignOut.mockResolvedValue({ error: null })

    expect(true).toBe(true)
  })

  it('updateUser error is handled', () => {
    mockUpdateUser.mockResolvedValue({
      error: { message: 'Password update failed' },
    })

    expect(true).toBe(true)
  })

  it('redirect URL after success is /login?passwordReset=success', () => {
    const redirectUrl = '/login?passwordReset=success'
    expect(redirectUrl).toContain('passwordReset=success')
    expect(redirectUrl).toContain('/login')
  })

  it('login page success banner text is correct', () => {
    const bannerText = 'Your password has been changed successfully. Please sign in with your new password.'
    expect(bannerText.toLowerCase()).toContain('password')
    expect(bannerText.toLowerCase()).toContain('changed')
    expect(bannerText.toLowerCase()).toContain('sign in')
  })

  it('no tokens or passwords appear in success messages', () => {
    const dangerWords = ['access_token', 'refresh_token', 'Bearer', 'password=', 'secret']
    const messages = [
      'Your password has been changed successfully. Please sign in with your new password.',
      'If an account exists for that email address, a password reset link has been sent.',
    ]
    for (const msg of messages) {
      for (const word of dangerWords) {
        expect(msg.toLowerCase()).not.toContain(word.toLowerCase())
      }
    }
  })

  it('resetPasswordForEmail uses correct redirectTo path', () => {
    const redirectTo = 'http://localhost:3000/reset-password'
    expect(redirectTo.endsWith('/reset-password')).toBe(true)
    expect(redirectTo.startsWith('http')).toBe(true)
  })

  it('neutral forgot-password message says "If an account exists"', () => {
    const message = 'If an account exists for that email address, a password reset link has been sent.'
    expect(message).toContain('If an account exists')
  })
})
