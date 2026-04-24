import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'

// ─── TypeScript Interfaces ────────────────────────────────────────────────────

export interface User {
  userId: string
  name: string
  email: string
  createdAt: string
}

export interface Profile {
  profileId: string
  userId: string
  educationSummary: string
  experienceSummary: string
  targetRole: string
  careerGoal: string
}

export interface CVUpload {
  cvId: string
  userId: string
  fileName: string
  uploadDate: string
  parseStatus: 'pending' | 'processing' | 'completed' | 'failed'
  extractedSkills: ExtractedSkill[]
}

export interface ExtractedSkill {
  skillId: string
  cvId: string
  rawSkillText: string
  normalisedName: string
  confidenceScore: number
  userVerified: boolean
}

export interface JobDescription {
  jobId: string
  userId: string
  title: string
  companyName: string
  descriptionText: string
  requiredSkills: JobRequiredSkill[]
  createdAt: string
}

export interface JobRequiredSkill {
  jobSkillId: string
  jobId: string
  skillName: string
  importanceWeight: 1 | 2 | 3 | 4 | 5
}

export interface MatchResult {
  matchId: string
  userId: string
  cvId: string
  jobId: string
  matchScore: number
  explanation: string
  skillGaps: SkillGapResult[]
  createdAt: string
}

export interface SkillGapResult {
  gapId: string
  matchId: string
  skillName: string
  gapType: 'matched' | 'partial' | 'missing'
  similarityScore: number
  recommendationNote: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: User
}

export interface SkillReview {
  skillId: string
  userVerified: boolean
  normalisedName?: string
}

export interface CreateJobInput {
  title: string
  companyName?: string
  descriptionText: string
}

// ─── In-Memory Token Store ────────────────────────────────────────────────────

let _accessToken: string | null = null
let _refreshToken: string | null = null

export const tokenStore = {
  setTokens(access: string, refresh: string) {
    _accessToken = access
    _refreshToken = refresh
  },
  clearTokens() {
    _accessToken = null
    _refreshToken = null
  },
  getAccessToken() {
    return _accessToken
  },
  getRefreshToken() {
    return _refreshToken
  },
}

// ─── Axios Instance ───────────────────────────────────────────────────────────

const axiosInstance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' },
})

// ─── Request Interceptor ──────────────────────────────────────────────────────

axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (_accessToken) {
    config.headers.set('Authorization', `Bearer ${_accessToken}`)
  }
  return config
})

// ─── Response Interceptor (silent token refresh) ──────────────────────────────

let _isRefreshing = false
let _pendingQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

function processQueue(error: unknown, token: string | null) {
  _pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token as string)
  })
  _pendingQueue = []
}

axiosInstance.interceptors.response.use(
  (response: import('axios').AxiosResponse) => response,
  async (error: import('axios').AxiosError & { config?: InternalAxiosRequestConfig & { _retry?: boolean } }) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
    if (!originalRequest) return Promise.reject(error)

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (_isRefreshing) {
        // Queue the request until refresh completes
        return new Promise((resolve, reject) => {
          _pendingQueue.push({
            resolve: (token) => {
              originalRequest.headers.set('Authorization', `Bearer ${token}`)
              resolve(axiosInstance(originalRequest))
            },
            reject,
          })
        })
      }

      originalRequest._retry = true
      _isRefreshing = true

      try {
        const { data } = await axios.post<AuthResponse>(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/refresh`,
          { refreshToken: _refreshToken },
        )
        tokenStore.setTokens(data.accessToken, data.refreshToken)
        processQueue(null, data.accessToken)
        originalRequest.headers.set('Authorization', `Bearer ${data.accessToken}`)
        return axiosInstance(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        tokenStore.clearTokens()
        window.location.href = '/auth/login'
        return Promise.reject(refreshError)
      } finally {
        _isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

// ─── Helper ───────────────────────────────────────────────────────────────────

function unwrap<T>(res: import('axios').AxiosResponse<T>): T {
  return res.data
}

// ─── API Client ───────────────────────────────────────────────────────────────

export const apiClient = {
  auth: {
    register(name: string, email: string, password: string) {
      return axiosInstance
        .post<AuthResponse>('/api/auth/register', { name, email, password })
        .then(unwrap)
    },
    login(email: string, password: string) {
      return axiosInstance
        .post<AuthResponse>('/api/auth/login', { email, password })
        .then(unwrap)
    },
    logout() {
      return axiosInstance.post<void>('/api/auth/logout').then(unwrap)
    },
  },

  profile: {
    get() {
      return axiosInstance.get<Profile>('/api/profile').then(unwrap)
    },
    update(profileData: Partial<Profile>) {
      return axiosInstance.put<Profile>('/api/profile', profileData).then(unwrap)
    },
  },

  cv: {
    upload(file: File, onProgress?: (pct: number) => void) {
      const form = new FormData()
      form.append('file', file)
      return axiosInstance
        .post<CVUpload>('/api/cv/upload', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: onProgress
            ? (e: import('axios').AxiosProgressEvent) => {
                if (e.total) onProgress(Math.round((e.loaded * 100) / e.total))
              }
            : undefined,
        })
        .then(unwrap)
    },
    get(cvId: string) {
      return axiosInstance.get<CVUpload>(`/api/cv/${cvId}`).then(unwrap)
    },
    list() {
      return axiosInstance.get<CVUpload[]>('/api/cv').then(unwrap)
    },
    delete(cvId: string) {
      return axiosInstance.delete<void>(`/api/cv/${cvId}`).then(unwrap)
    },
    reviewSkills(cvId: string, updates: SkillReview[]) {
      return axiosInstance
        .put<CVUpload>(`/api/cv/${cvId}/skills/review`, { updates })
        .then(unwrap)
    },
  },

  jobs: {
    create(jobData: CreateJobInput) {
      return axiosInstance.post<JobDescription>('/api/jobs', jobData).then(unwrap)
    },
    get(jobId: string) {
      return axiosInstance.get<JobDescription>(`/api/jobs/${jobId}`).then(unwrap)
    },
    list() {
      return axiosInstance.get<JobDescription[]>('/api/jobs').then(unwrap)
    },
    delete(jobId: string) {
      return axiosInstance.delete<void>(`/api/jobs/${jobId}`).then(unwrap)
    },
  },

  match: {
    run(cvId: string, jobId: string) {
      return axiosInstance
        .post<MatchResult>('/api/match/run', { cvId, jobId })
        .then(unwrap)
    },
    get(matchId: string) {
      return axiosInstance.get<MatchResult>(`/api/match/${matchId}`).then(unwrap)
    },
    history() {
      return axiosInstance.get<MatchResult[]>('/api/match/history').then(unwrap)
    },
  },

  feedback: {
    submit(matchId: string, rating: number, comments: string) {
      return axiosInstance
        .post<void>('/api/feedback', { matchId, rating, comments })
        .then(unwrap)
    },
  },
}
