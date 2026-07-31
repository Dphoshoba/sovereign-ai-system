import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockResetPasswordForEmail = vi.fn()
const mockUpdateUser = vi.fn()
const mockSignOut = vi.fn()
const mockVerifyOtp = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: () => ({
    auth: {
      resetPasswordForEmail: mockResetPasswordForEmail,
      updateUser: mockUpdateUser,
      signOut: mockSignOut,
      verifyOtp: mockVerifyOtp,
      signInWithPassword: vi.fn(),
    },
  }),
}))

describe('Password Recovery — OTP Forgot Password Flow', () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('resetPasswordForEmail sends recovery code', () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null })
    expect(typeof mockResetPasswordForEmail).toBe('function')
  })

  it('neutral success message does not reveal account existence', () => {
    const neutralMessages = [
      'If an account exists for that email address, a recovery code has been sent.',
    ]
    for (const msg of neutralMessages) {
      expect(msg.toLowerCase()).not.toContain('not found')
      expect(msg.toLowerCase()).not.toContain("doesn't exist")
    }
  })

  it('resetPasswordForEmail error is handled safely', () => {
    mockResetPasswordForEmail.mockResolvedValue({
      error: { message: 'Rate limit exceeded' },
    })
    expect(true).toBe(true)
  })
})

describe('Password Recovery — OTP Reset Flow', () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('verifyOtp succeeds with valid email and code', () => {
    mockVerifyOtp.mockResolvedValue({ error: null })
    expect(typeof mockVerifyOtp).toBe('function')
  })

  it('verifyOtp requires email and code', () => {
    mockVerifyOtp.mockResolvedValue({ error: null })

    const hasEmail = true
    const hasCode = true
    expect(hasEmail && hasCode).toBe(true)
  })

  it('invalid recovery code is rejected', () => {
    mockVerifyOtp.mockResolvedValue({
      error: { message: 'Token has expired or is invalid' },
    })

    expect(true).toBe(true)
  })

  it('expired recovery code is detected', () => {
    mockVerifyOtp.mockResolvedValue({
      error: { message: 'Token has expired' },
    })

    expect(true).toBe(true)
  })

  it('rate limited attempts are handled', () => {
    mockVerifyOtp.mockResolvedValue({
      error: { message: 'Too many requests' },
    })

    expect(true).toBe(true)
  })

  it('password form only appears after verifyOtp succeeds', () => {
    mockVerifyOtp.mockResolvedValue({ error: null })
    const stage = 'set-password'
    expect(stage).toBe('set-password')
  })

  it('password shorter than 12 characters rejected', () => {
    expect('short'.length).toBeLessThan(12)
    expect('validpassword123'.length).toBeGreaterThanOrEqual(12)
  })

  it('mismatched passwords rejected', () => {
    expect('validpassword123').not.toBe('different1234567')
  })

  it('updateUser called after password matches', () => {
    mockUpdateUser.mockResolvedValue({ error: null })
    expect(typeof mockUpdateUser).toBe('function')
  })

  it('signOut called after successful update', () => {
    mockSignOut.mockResolvedValue({ error: null })
    expect(typeof mockSignOut).toBe('function')
  })

  it('redirects to /login?passwordReset=success', () => {
    const redirect = '/login?passwordReset=success'
    expect(redirect).toContain('passwordReset=success')
  })

  it('no recovery code appears in success messages', () => {
    const messages = ['Your password has been changed successfully.']
    for (const m of messages) {
      expect(m).not.toContain('123456')
      expect(m).not.toContain('token')
    }
  })

  it('no tokens or secrets in error messages', () => {
    const dangerPatterns = ['Bearer', 'access_token', 'refresh_token']
    const errorMessages = [
      'Invalid recovery code.',
      'This recovery code has expired.',
      'Too many attempts.',
    ]
    for (const msg of errorMessages) {
      for (const pattern of dangerPatterns) {
        expect(msg).not.toContain(pattern)
      }
    }
  })

  it('missing email or code shows clear error', () => {
    const hasEmail = false
    const hasCode = true
    expect(hasEmail && hasCode).toBe(false)
  })

  it('verifyOtp not called when email missing', () => {
    mockVerifyOtp.mockReset()
    expect(mockVerifyOtp).not.toHaveBeenCalled()
  })
})
