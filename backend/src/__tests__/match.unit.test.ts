/**
 * Unit tests for match controller
 */

process.env.DATABASE_URL = 'postgres://mock'
process.env.SUPABASE_URL = 'https://mock.supabase.co'
process.env.SUPABASE_SERVICE_KEY = 'mock-service-key'

jest.mock('../lib/db', () => ({ db: { query: jest.fn() } }))
jest.mock('../lib/supabase', () => ({ supabase: {} }))
jest.mock('@supabase/supabase-js', () => ({ createClient: jest.fn() }))
jest.mock('axios')

import { run } from '../controllers/matchController'
import { db } from '../lib/db'
import axios from 'axios'
import type { Request, Response, NextFunction } from 'express'

const mockDb = db as jest.Mocked<typeof db>
const mockAxios = axios as jest.Mocked<typeof axios>

function makeReq(body: Record<string, unknown>, userId = 'user-1'): Request {
  return {
    body,
    user: { userId, email: 'test@example.com' },
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

const next: NextFunction = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
})

describe('match controller — run', () => {
  it('returns 404 when CV is not found', async () => {
    ;(mockDb.query as jest.Mock).mockResolvedValueOnce({ rowCount: 0, rows: [] })

    const req = makeReq({ cvId: 'cv-missing', jobId: 'job-1' })
    const res = makeRes()

    await run(req, res as unknown as Response, next)

    expect(res._status).toBe(404)
    expect((res._body as { error: string }).error).toMatch(/cv not found/i)
  })

  it('returns 409 when CV parse_status is not completed', async () => {
    // CV found but parse_status = 'processing'
    ;(mockDb.query as jest.Mock)
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ cv_id: 'cv-1', parse_status: 'processing' }] })
      // job query
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ job_id: 'job-1' }] })

    const req = makeReq({ cvId: 'cv-1', jobId: 'job-1' })
    const res = makeRes()

    await run(req, res as unknown as Response, next)

    expect(res._status).toBe(409)
    expect((res._body as { error: string }).error).toMatch(/cv parsing not complete/i)
  })

  it('returns 503 when Python service is unreachable (network error)', async () => {
    // CV found, parse_status = 'completed'
    ;(mockDb.query as jest.Mock)
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ cv_id: 'cv-1', parse_status: 'completed' }] })
      // job found
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ job_id: 'job-1' }] })
      // no in-progress match
      .mockResolvedValueOnce({ rowCount: 0, rows: [] })
      // cv skills
      .mockResolvedValueOnce({ rows: [{ normalised_name: 'Python' }] })
      // job skills
      .mockResolvedValueOnce({ rows: [{ skill_name: 'Python', importance_weight: 3 }] })

    // Simulate network error (no response)
    const networkError = Object.assign(new Error('Network Error'), {
      isAxiosError: true,
      response: undefined,
    })
    ;(mockAxios.post as jest.Mock).mockRejectedValueOnce(networkError)
    ;(mockAxios.isAxiosError as unknown as jest.Mock).mockReturnValue(true)

    const req = makeReq({ cvId: 'cv-1', jobId: 'job-1' })
    const res = makeRes()

    await run(req, res as unknown as Response, next)

    expect(res._status).toBe(503)
    const body = res._body as { error: string; retryAfter: number }
    expect(body.error).toMatch(/unavailable/i)
    expect(body.retryAfter).toBe(30)
  })

  it('returns 200 with matchId, matchScore, and skillGaps on success', async () => {
    ;(mockDb.query as jest.Mock)
      // CV found, completed
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ cv_id: 'cv-1', parse_status: 'completed' }] })
      // job found
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ job_id: 'job-1' }] })
      // no in-progress match
      .mockResolvedValueOnce({ rowCount: 0, rows: [] })
      // cv skills
      .mockResolvedValueOnce({ rows: [{ normalised_name: 'Python', confidence_score: 0.9, user_verified: false }] })
      // job skills
      .mockResolvedValueOnce({ rows: [{ skill_name: 'Python', importance_weight: 3 }] })
      // insert match_results
      .mockResolvedValueOnce({ rows: [] })
      // insert skill_gap_results (one skill)
      .mockResolvedValueOnce({ rows: [] })
      // fetch match row
      .mockResolvedValueOnce({
        rows: [{
          match_id: 'match-uuid',
          user_id: 'user-1',
          cv_id: 'cv-1',
          job_id: 'job-1',
          match_score: 0.85,
          explanation: 'Good match',
          created_at: '2024-01-01T00:00:00Z',
        }],
      })
      // fetch skill gaps
      .mockResolvedValueOnce({
        rows: [{
          gap_id: 'gap-1',
          match_id: 'match-uuid',
          skill_name: 'Python',
          gap_type: 'matched',
          similarity_score: 1.0,
          recommendation_note: null,
        }],
      })

    ;(mockAxios.post as jest.Mock).mockResolvedValueOnce({
      data: {
        match_score: 0.85,
        explanation: 'Good match',
        matched: [{ skill: 'Python', score: 1.0, type: 'matched' }],
        partial: [],
        missing: [],
      },
    })
    ;(mockAxios.isAxiosError as unknown as jest.Mock).mockReturnValue(false)

    const req = makeReq({ cvId: 'cv-1', jobId: 'job-1' })
    const res = makeRes()

    await run(req, res as unknown as Response, next)

    expect(res._status).toBe(200)
    const body = res._body as {
      match_id: string
      match_score: number
      skillGaps: Array<{ gap_type: string }>
    }
    expect(body.match_id).toBe('match-uuid')
    expect(body.match_score).toBe(0.85)
    expect(Array.isArray(body.skillGaps)).toBe(true)
    expect(body.skillGaps[0].gap_type).toBe('matched')
  })
})
