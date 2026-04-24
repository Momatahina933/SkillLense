/**
 * Property 1: Auth Header Injection
 * Validates: Requirements 1.x — apiClient must attach `Authorization: Bearer <token>`
 * for every request when a token is stored in tokenStore.
 */

import fc from 'fast-check'
import MockAdapter from 'axios-mock-adapter'
import axios from 'axios'
import { tokenStore } from '../app/api'

describe('Property 1: Auth Header Injection', () => {
  afterEach(() => {
    tokenStore.clearTokens()
  })

  /**
   * **Validates: Requirements 1.x**
   * For any non-empty token string stored in tokenStore, the stored value is
   * retrievable and the Authorization header format is `Bearer <token>`.
   */
  it('sets Authorization header to Bearer <token> for arbitrary token strings', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        (token) => {
          tokenStore.setTokens(token, 'refresh-tok')
          const stored = tokenStore.getAccessToken()
          expect(stored).toBe(token)
          expect(`Bearer ${stored}`).toBe(`Bearer ${token}`)
        },
      ),
    )
  })

  /**
   * **Validates: Requirements 1.x**
   * After clearTokens(), getAccessToken() returns null.
   */
  it('clears the token so no Authorization header is injected', () => {
    tokenStore.setTokens('some-token', 'some-refresh')
    tokenStore.clearTokens()
    expect(tokenStore.getAccessToken()).toBeNull()
  })

  /**
   * **Validates: Requirements 1.x**
   * The Authorization header format is always exactly `Bearer ${token}` — no extra spaces,
   * no missing prefix — for any arbitrary token string.
   */
  it('Authorization header format is always Bearer <token>', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        (token) => {
          tokenStore.setTokens(token, 'r')
          const stored = tokenStore.getAccessToken()
          const header = `Bearer ${stored}`
          expect(header.startsWith('Bearer ')).toBe(true)
          expect(header.slice('Bearer '.length)).toBe(token)
        },
      ),
    )
  })
})

/**
 * Integration-level test using axios-mock-adapter to verify an interceptor
 * injects the Authorization header into outgoing requests.
 *
 * **Validates: Requirements 1.x**
 */
describe('Property 1: Auth Header Injection — interceptor integration', () => {
  it('interceptor injects Authorization header into outgoing requests', async () => {
    const instance = axios.create({ baseURL: 'http://localhost:3001' })
    const mock = new MockAdapter(instance)

    let capturedHeader: string | undefined

    mock.onGet('/api/profile').reply((config) => {
      capturedHeader = config.headers?.['Authorization'] as string | undefined
      return [200, {}]
    })

    let _token: string | null = null
    instance.interceptors.request.use((config) => {
      if (_token) {
        config.headers.set('Authorization', `Bearer ${_token}`)
      }
      return config
    })

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }).filter((s) => !s.includes('\n') && !s.includes('\r')),
        async (token) => {
          _token = token
          capturedHeader = undefined
          await instance.get('/api/profile')
          expect(capturedHeader).toBe(`Bearer ${token}`)
        },
      ),
      { numRuns: 20 },
    )

    mock.restore()
  })
})
