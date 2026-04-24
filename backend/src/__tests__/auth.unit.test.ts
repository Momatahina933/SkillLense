/**
 * Unit tests for auth controller (register / login)
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Must mock env vars before any module that reads them at import time
process.env.DATABASE_URL = 'postgres://mock'
process.env.SUPABASE_URL = 'https://mock.supabase.co'
process.env.SUPABASE_SERVICE_KEY = 'mock-service-key'

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}))

jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
    },
  },
}))

jest.mock('../lib/db', () => ({
  db: {
    query: jest.fn(),
  },
}))

import { register, login } from '../controllers/authController'
import { supabase } from '../lib/supabase'
import { db } from '../lib/db'
import type { Request, Response, NextFunction } from 'express'

const mockSupabase = supabase as jest.Mocked<typeof supabase>
const mockDb = db as jest.Mocked<typeof db>

function makeReq(body: Record<string, unknown>): Request {
  return { body } as unknown as Request
}

function makeRes() {
  const res = {
    _status: 0,
    _body: {} as unknown,
    status(code: number) {
      this._status = code
      return this
    },
    json(body: unknown) {
      this._body = body
      return this
    },
  }
  return res
}

const next: NextFunction = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
})

// ── register ──────────────────────────────────────────────────────────────────

describe('register', () => {
  it('returns 201 with accessToken, refreshToken, and user on success', async () => {
    ;(mockSupabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: {
        user: { id: 'auth-uuid', identities: [{ id: 'identity-1' }] },
        session: { access_token: 'access-tok', refresh_token: 'refresh-tok' },
      },
      error: null,
    })
    ;(mockDb.query as jest.Mock).mockResolvedValue({
      rows: [
        {
          user_id: 'db-uuid',
          name: 'Alice',
          email: 'alice@example.com',
          created_at: '2024-01-01T00:00:00Z',
        },
      ],
    })

    const req = makeReq({ name: 'Alice', email: 'alice@example.com', password: 'secret' })
    const res = makeRes()

    await register(req, res as unknown as Response, next)

    expect(res._status).toBe(201)
    const body = res._body as {
      accessToken: string
      refreshToken: string
      user: { userId: string; name: string; email: string }
    }
    expect(body.accessToken).toBe('access-tok')
    expect(body.refreshToken).toBe('refresh-tok')
    expect(body.user.userId).toBe('db-uuid')
    expect(body.user.name).toBe('Alice')
    expect(body.user.email).toBe('alice@example.com')
  })

  it('returns 409 when Supabase returns an error (duplicate email)', async () => {
    ;(mockSupabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'User already registered' },
    })

    const req = makeReq({ name: 'Bob', email: 'bob@example.com', password: 'secret' })
    const res = makeRes()

    await register(req, res as unknown as Response, next)

    expect(res._status).toBe(409)
    expect((res._body as { error: string }).error).toMatch(/already registered/i)
  })

  it('returns 409 when Supabase returns empty identities (silent duplicate)', async () => {
    ;(mockSupabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: {
        user: { id: 'auth-uuid', identities: [] },
        session: null,
      },
      error: null,
    })

    const req = makeReq({ name: 'Carol', email: 'carol@example.com', password: 'secret' })
    const res = makeRes()

    await register(req, res as unknown as Response, next)

    expect(res._status).toBe(409)
  })
})

// ── login ─────────────────────────────────────────────────────────────────────

describe('login', () => {
  it('returns 200 with tokens and user on success', async () => {
    ;(mockSupabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: {
        user: { id: 'auth-uuid' },
        session: { access_token: 'access-tok', refresh_token: 'refresh-tok' },
      },
      error: null,
    })
    ;(mockDb.query as jest.Mock).mockResolvedValue({
      rows: [
        {
          user_id: 'db-uuid',
          name: 'Alice',
          email: 'alice@example.com',
          created_at: '2024-01-01T00:00:00Z',
        },
      ],
    })

    const req = makeReq({ email: 'alice@example.com', password: 'secret' })
    const res = makeRes()

    await login(req, res as unknown as Response, next)

    expect(res._status).toBe(200)
    const body = res._body as {
      accessToken: string
      refreshToken: string
      user: { userId: string }
    }
    expect(body.accessToken).toBe('access-tok')
    expect(body.refreshToken).toBe('refresh-tok')
    expect(body.user.userId).toBe('db-uuid')
  })

  it('returns 401 when Supabase returns an error (bad credentials)', async () => {
    ;(mockSupabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    })

    const req = makeReq({ email: 'alice@example.com', password: 'wrong' })
    const res = makeRes()

    await login(req, res as unknown as Response, next)

    expect(res._status).toBe(401)
    expect((res._body as { error: string }).error).toMatch(/invalid/i)
  })
})
