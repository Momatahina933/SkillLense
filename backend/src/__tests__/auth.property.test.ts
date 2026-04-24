/**
 * Property 9: Token Expiry Enforcement
 * Validates: Requirements 9.x — requireAuth must reject any non-valid or expired JWT with 401.
 */

import fc from 'fast-check'
import jwt from 'jsonwebtoken'
import { requireAuth } from '../middleware/requireAuth'
import type { Request, Response, NextFunction } from 'express'

// Ensure JWT_SECRET is set before the middleware runs
const TEST_SECRET = 'test-secret-for-property-tests'
process.env.JWT_SECRET = TEST_SECRET

function makeReq(authHeader?: string): Request {
  return {
    headers: authHeader ? { authorization: authHeader } : {},
  } as unknown as Request
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

describe('Property 9: Token Expiry Enforcement', () => {
  /**
   * **Validates: Requirements 9.x**
   * For any arbitrary string that is not a valid JWT, requireAuth must return 401.
   */
  it('returns 401 for arbitrary non-JWT strings', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => {
          // Exclude strings that happen to be valid JWTs (3 base64url segments separated by dots)
          const parts = s.split('.')
          return parts.length !== 3
        }),
        (token) => {
          const req = makeReq(`Bearer ${token}`)
          const res = makeRes()
          const next: NextFunction = jest.fn()

          requireAuth(req, res as unknown as Response, next)

          expect(res._status).toBe(401)
          expect(next).not.toHaveBeenCalled()
        },
      ),
    )
  })

  /**
   * **Validates: Requirements 9.x**
   * A real JWT signed with the correct secret but with exp: 0 (already expired) must return 401.
   */
  it('returns 401 for a real expired JWT', () => {
    const expiredToken = jwt.sign(
      { sub: 'user-123', email: 'test@example.com', exp: 0 },
      TEST_SECRET,
    )

    const req = makeReq(`Bearer ${expiredToken}`)
    const res = makeRes()
    const next: NextFunction = jest.fn()

    requireAuth(req, res as unknown as Response, next)

    expect(res._status).toBe(401)
    expect((res._body as { error: string }).error).toMatch(/expired/i)
    expect(next).not.toHaveBeenCalled()
  })

  /**
   * **Validates: Requirements 9.x**
   * Missing Authorization header must return 401.
   */
  it('returns 401 when Authorization header is absent', () => {
    const req = makeReq()
    const res = makeRes()
    const next: NextFunction = jest.fn()

    requireAuth(req, res as unknown as Response, next)

    expect(res._status).toBe(401)
    expect(next).not.toHaveBeenCalled()
  })

  /**
   * **Validates: Requirements 9.x**
   * A JWT signed with a different secret must return 401.
   */
  it('returns 401 for a JWT signed with a wrong secret', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => s !== TEST_SECRET),
        (wrongSecret) => {
          const token = jwt.sign({ sub: 'user-123', email: 'x@x.com' }, wrongSecret, {
            expiresIn: '1h',
          })
          const req = makeReq(`Bearer ${token}`)
          const res = makeRes()
          const next: NextFunction = jest.fn()

          requireAuth(req, res as unknown as Response, next)

          expect(res._status).toBe(401)
          expect(next).not.toHaveBeenCalled()
        },
      ),
    )
  })
})
