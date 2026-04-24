# Implementation Plan: SkillLens Full-Stack

## Overview

Wire the existing React prototype to real services by building the Node.js/Express backend and Python/FastAPI AI service from scratch, then replacing all mock/localStorage logic in the frontend with typed API calls. Supabase provides the database, auth, and file storage.

## Tasks

- [x] 1. Supabase database schema and RLS setup
  - [x] 1.1 Create SQL migration file with all table definitions
    - Create `supabase/migrations/001_initial_schema.sql` with all tables: `users`, `profiles`, `cv_uploads`, `extracted_skills`, `job_descriptions`, `job_required_skills`, `match_results`, `skill_gap_results`, `feedback`
    - Add all CHECK constraints, foreign keys with CASCADE, and indexes from the design schema
    - _Requirements: 2.1, 4.1, 5.11, 6.1, 7.1, 8.1_

  - [x] 1.2 Create RLS policies migration
    - Create `supabase/migrations/002_rls_policies.sql`
    - Enable RLS on all tables; add SELECT/INSERT/UPDATE/DELETE policies scoped to `auth.uid()` for each table
    - Add a UNIQUE constraint on `feedback(match_id, user_id)` to enforce one-feedback-per-match
    - _Requirements: 9.1, 9.2, 8.2_

  - [x] 1.3 Create Supabase Storage bucket configuration
    - Create `supabase/migrations/003_storage.sql` to create a private `cvs` bucket
    - Add storage RLS policy: users can only read/write objects under their own `user_id/` prefix
    - _Requirements: 9.7, 2.1_

- [x] 2. Node.js/Express backend — project scaffold
  - [x] 2.1 Initialise backend project structure
    - Create `backend/package.json` with dependencies: `express`, `@supabase/supabase-js`, `pg`, `multer`, `jsonwebtoken`, `zod`, `helmet`, `express-rate-limit`, `cors`, `axios`, `uuid`, `dotenv`; devDependencies: `typescript`, `@types/*`, `ts-node-dev`, `jest`, `supertest`
    - Create `backend/tsconfig.json` targeting ES2022, `backend/src/index.ts` as entry point
    - Create `backend/.env.example` with `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `JWT_SECRET`, `PYTHON_SERVICE_URL`, `FRONTEND_ORIGIN`, `PORT`
    - _Requirements: 9.3, 9.4_

  - [x] 2.2 Create Express app with global middleware
    - Create `backend/src/app.ts` wiring `helmet`, `cors` (restricted to `FRONTEND_ORIGIN`), `express.json()`, and the rate limiter (100 req/15 min on `/api/auth/*`, 500 req/15 min elsewhere)
    - Create `backend/src/middleware/errorHandler.ts` mapping PostgreSQL error codes `23505` → 409 and `23503` → 400, and all unhandled errors → 500 without leaking raw DB messages
    - _Requirements: 9.3, 10.2, 10.3, 10.5_

  - [x] 2.3 Create Zod validation schemas
    - Create `backend/src/schemas/auth.ts`: `RegisterSchema` (name, email, password), `LoginSchema` (email, password)
    - Create `backend/src/schemas/cv.ts`: `SkillReviewSchema` (array of `{skillId, userVerified}`)
    - Create `backend/src/schemas/job.ts`: `JobSchema` (title, companyName, descriptionText, requiredSkills array with importanceWeight 1–5)
    - Create `backend/src/schemas/match.ts`: `MatchRunSchema` (cvId UUID, jobId UUID)
    - Create `backend/src/schemas/feedback.ts`: `FeedbackSchema` (matchId UUID, usabilityRating 1–5, comments optional)
    - Create `backend/src/middleware/validate.ts` middleware factory that runs a Zod schema and returns 400 on failure
    - _Requirements: 9.4_

- [x] 3. Node.js/Express backend — authentication
  - [x] 3.1 Implement JWT auth middleware
    - Create `backend/src/middleware/requireAuth.ts`
    - Parse `Authorization: Bearer <token>` header; call `jwt.verify` with `JWT_SECRET`
    - Set `req.user = { userId, email }` on success; return 401 with `"Missing token"`, `"Token expired"`, or `"Invalid token"` on failure
    - _Requirements: 1.5, 1.6, 1.7_

  - [-]* 3.2 Write property test for JWT middleware
    - **Property 9: Token Expiry Enforcement**
    - **Validates: Requirements 1.6**
    - Use `fast-check` in `backend/src/__tests__/auth.property.test.ts`; generate arbitrary expired tokens and assert every response is HTTP 401

  - [x] 3.3 Implement auth controller and routes
    - Create `backend/src/controllers/authController.ts` with `register` and `login` handlers
    - `register`: call `supabase.auth.signUp`, INSERT into `users`, return 201 `{accessToken, refreshToken, user}`; return 409 on duplicate email
    - `login`: call `supabase.auth.signInWithPassword`, return 200 `{accessToken, refreshToken, user}`; return 401 on bad credentials
    - Create `backend/src/routes/auth.ts` and mount at `/api/auth`
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [-]* 3.4 Write unit tests for auth controller
    - Test register success (201), duplicate email (409), login success (200), bad credentials (401)
    - Mock Supabase auth and `pg` client
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 4. Node.js/Express backend — profile, CV, and job routes
  - [x] 4.1 Implement profile controller and routes
    - Create `backend/src/controllers/profileController.ts` with `get` and `update` handlers
    - `get`: SELECT from `profiles` WHERE `user_id`; if no row, INSERT empty profile and return it
    - `update`: UPSERT `profiles` row; return updated profile
    - Create `backend/src/routes/profile.ts` and mount at `/api/profile`
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 4.2 Implement CV upload controller
    - Create `backend/src/controllers/cvController.ts`
    - Configure Multer with `fileFilter` (PDF/DOCX only → 400) and `limits.fileSize` (10 MB → 413); sanitise filename (strip path separators)
    - `upload`: store file in Supabase Storage at `{userId}/{cvId}/{sanitisedName}`, INSERT `cv_uploads` with `parse_status = 'processing'`, fire-and-forget POST to `PYTHON_SERVICE_URL/parse`, return 202 `{cvId, status: 'processing'}`
    - `get`: SELECT `cv_uploads` + `extracted_skills` WHERE `cv_id` AND `user_id`
    - `list`: SELECT all `cv_uploads` for authenticated user
    - `delete`: delete file from Storage, DELETE `cv_uploads` row (cascades to skills/matches/gaps)
    - `reviewSkills`: UPDATE `user_verified` on specified `extracted_skills` rows
    - Create `backend/src/routes/cv.ts` and mount at `/api/cv`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.11, 2.12, 3.1, 3.2, 9.6, 9.7_

  - [-]* 4.3 Write property test for file type enforcement
    - **Property 6: File Type Enforcement**
    - **Validates: Requirements 2.2**
    - Use `fast-check` in `backend/src/__tests__/cv.property.test.ts`; generate arbitrary MIME type strings that are not PDF/DOCX and assert every upload attempt returns HTTP 400

  - [x] 4.4 Implement job description controller and routes
    - Create `backend/src/controllers/jobController.ts` with `create`, `get`, `list`, `delete` handlers
    - `create`: INSERT `job_descriptions` + all `job_required_skills` rows in a transaction; return 201 with full job object
    - `get`/`list`: SELECT WHERE `user_id = req.user.userId`
    - `delete`: DELETE `job_descriptions` row (cascades to skills/matches/gaps)
    - Create `backend/src/routes/jobs.ts` and mount at `/api/jobs`
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 5. Node.js/Express backend — match and feedback routes
  - [x] 5.1 Implement match controller and routes
    - Create `backend/src/controllers/matchController.ts`
    - `run`: verify CV `parse_status = 'completed'` (→ 409 if not); check for in-progress duplicate `(cvId, jobId)` (→ 202 with existing matchId); fetch CV skills + job skills from DB; POST to `PYTHON_SERVICE_URL/match`; INSERT `match_results` + `skill_gap_results`; return 200 with full `MatchResult`
    - `get`: SELECT `match_results` + `skill_gap_results` WHERE `match_id` AND `user_id` (→ 404 if not owned)
    - `history`: SELECT `match_results` WHERE `user_id` ORDER BY `created_at DESC`
    - Create `backend/src/routes/match.ts` and mount at `/api/match`
    - Handle Python service unreachable → 503 `{error: "AI service temporarily unavailable", retryAfter: 30}`
    - _Requirements: 5.1, 5.2, 5.11, 5.12, 6.1, 6.2, 6.3, 10.1_

  - [-]* 5.2 Write unit tests for match controller
    - Test: CV not completed → 409; duplicate in-progress → 202; Python service down → 503; successful match → 200 with score and gaps
    - Mock DB queries and Python HTTP client
    - _Requirements: 5.1, 5.2, 5.12, 10.1_

  - [x] 5.3 Implement feedback controller and routes
    - Create `backend/src/controllers/feedbackController.ts`
    - `submit`: INSERT `feedback` row; return 201; catch `23505` unique violation → 409 `"Feedback already submitted for this match"`
    - Create `backend/src/routes/feedback.ts` and mount at `/api/feedback`
    - _Requirements: 8.1, 8.2_

  - [ ] 6. Checkpoint — backend wired and passing
    - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Python/FastAPI AI service — project scaffold
  - [x] 7.1 Initialise Python project structure
    - Create `ai-service/requirements.txt` with: `fastapi`, `uvicorn[standard]`, `pdfplumber`, `PyPDF2`, `python-docx`, `spacy`, `sentence-transformers`, `rapidfuzz`, `httpx`, `pydantic`, `pytest`, `hypothesis`
    - Create `ai-service/main.py` as FastAPI entry point with `/health` endpoint returning `{"status": "ok"}`
    - Create `ai-service/.env.example` with `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
    - Create `ai-service/Dockerfile` (python:3.11-slim base, install spaCy model `en_core_web_md`)
    - _Requirements: 2.5, 2.6_

  - [x] 7.2 Implement Pydantic models and shared types
    - Create `ai-service/models.py` with: `ParseRequest`, `ParseResponse`, `ExtractedSkill`, `MatchRequest`, `MatchResponse`, `NormalisedSkill`, `JobSkill`, `SkillMatchDetail`
    - All fields typed and validated; `confidence_score` constrained to [0.0, 1.0]; `importance_weight` constrained to 1–5
    - _Requirements: 11.3, 5.5, 5.6, 5.7_

- [x] 8. Python/FastAPI AI service — skill normalisation
  - [x] 8.1 Implement skill taxonomy and normalisation function
    - Create `ai-service/skill_taxonomy.py` with a hardcoded `SKILL_TAXONOMY` list (~100 common tech skills) and an `ALIAS_MAP` dict (e.g. `"js" → "JavaScript"`, `"reactjs" → "React"`)
    - Create `ai-service/normalise.py` with `normalise_skill(raw_text: str) -> str`:
      1. Lowercase + strip punctuation
      2. Exact match against taxonomy index
      3. Alias lookup
      4. `rapidfuzz.fuzz.token_sort_ratio` ≥ 85 fuzzy match
      5. Fallback: `raw_text.title()`
    - _Requirements: 11.1, 11.2_

  - [x]* 8.2 Write property test for normalisation idempotency
    - **Property 5: Normalisation Idempotency**
    - **Validates: Requirements 11.2**
    - Use `hypothesis` in `ai-service/tests/test_normalise.py`; generate arbitrary non-empty strings and assert `normalise_skill(normalise_skill(s)) == normalise_skill(s)`

  - [x]* 8.3 Write unit tests for normalise_skill
    - Test exact match, alias match, fuzzy match (token_sort_ratio ≥ 85), no-match fallback (returns title-cased original)
    - _Requirements: 11.1_

- [x] 9. Python/FastAPI AI service — CV parsing
  - [x] 9.1 Implement document text extraction
    - Create `ai-service/extractor.py` with:
      - `extract_pdf(raw_bytes) -> str`: pdfplumber primary, PyPDF2 fallback if empty
      - `extract_docx(raw_bytes) -> str`: python-docx
      - `segment_sections(text) -> dict[str, str]`: regex-based segmentation into `education`, `experience`, `skills`, `other`
    - _Requirements: 2.5, 2.6, 2.7_

  - [x] 9.2 Implement spaCy skill extraction
    - Create `ai-service/skill_extractor.py`
    - Load `en_core_web_md` once at module level
    - `extract_skills(sections: dict) -> list[CandidateSpan]`: run spaCy NER (SKILL entity) + custom `PhraseMatcher` pattern list over each section; deduplicate spans
    - `compute_confidence(span, section_name) -> float`: weight by section (skills section = higher confidence) and NER score; clamp to [0.0, 1.0]
    - _Requirements: 2.7, 2.8, 11.3_

  - [x]* 9.3 Write property test for confidence score range
    - **Property 7: Confidence Score Range**
    - **Validates: Requirements 11.3**
    - Use `hypothesis` in `ai-service/tests/test_extractor.py`; generate arbitrary section text and assert all returned `confidence_score` values are in [0.0, 1.0]

  - [x] 9.4 Implement `/parse` endpoint
    - In `ai-service/main.py`, add `POST /parse` route
    - Download file from `request.file_url` using `httpx`; call `extract_pdf` or `extract_docx`; call `segment_sections`; call `extract_skills`; call `normalise_skill` on each candidate; build `ExtractedSkill` list
    - INSERT `extracted_skills` rows into PostgreSQL via `asyncpg`; UPDATE `cv_uploads.parse_status = 'completed'`
    - On any exception: UPDATE `cv_uploads.parse_status = 'failed'`, store `error_message`; return `ParseResponse(status="failed")`
    - _Requirements: 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_

- [x] 10. Python/FastAPI AI service — hybrid matching
  - [x] 10.1 Implement semantic matching pipeline
    - Create `ai-service/matcher.py`
    - Load `sentence-transformers/all-MiniLM-L6-v2` once at module level
    - `run_match(cv_skills, job_skills) -> MatchResponse`:
      1. Exact string match pass (normalised names)
      2. Encode remaining job skills + all CV skills with sentence-transformer
      3. Cosine similarity; classify ≥ 0.90 → matched, ≥ 0.65 → partial, else → missing
      4. `match_score = (earned_weight / total_weight) * 100`
      5. Build `explanation` string
    - _Requirements: 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10_

  - [x]* 10.2 Write property test for match score bounds
    - **Property 3: Match Score Bounds**
    - **Validates: Requirements 5.8**
    - Use `hypothesis` in `ai-service/tests/test_matcher.py`; generate arbitrary non-empty cv_skills and job_skills lists and assert `0 <= run_match(...).match_score <= 100`

  - [x]* 10.3 Write property test for skill gap completeness
    - **Property 4: Skill Gap Completeness**
    - **Validates: Requirements 5.9**
    - Use `hypothesis`; assert `len(matched) + len(partial) + len(missing) == len(job_skills)` for all inputs

  - [x]* 10.4 Write property test for weighted score formula
    - **Property 8: Weighted Score Formula**
    - **Validates: Requirements 5.5, 5.6, 5.7, 5.8**
    - Use `hypothesis`; assert `match_score == (sum_matched_weight + sum_partial_weight * 0.5) / total_weight * 100` for all inputs

  - [x] 10.5 Implement `/match` endpoint
    - In `ai-service/main.py`, add `POST /match` route calling `run_match`; return `MatchResponse`
    - _Requirements: 5.3, 5.4, 5.8, 5.9, 5.10_

  - [ ] 11. Checkpoint — AI service wired and passing
    - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Frontend — typed API client
  - [x] 12.1 Install frontend dependencies
    - Add `axios` and `@tanstack/react-query` to `package.json`
    - Add `@tanstack/react-query` `QueryClientProvider` wrapper in `src/main.tsx`
    - _Requirements: 12.5_

  - [x] 12.2 Create `src/app/api.ts` typed API client
    - Create an Axios instance with `baseURL = import.meta.env.VITE_API_URL`
    - Add request interceptor: inject `Authorization: Bearer <token>` from in-memory token store
    - Add response interceptor: on 401, attempt silent token refresh via `POST /api/auth/refresh`; if refresh succeeds retry original request; if refresh fails redirect to `/auth/login`
    - Implement all methods matching the `ApiClient` interface from the design: `auth.*`, `profile.*`, `cv.*`, `jobs.*`, `match.*`, `feedback.*`
    - _Requirements: 12.1, 12.2, 1.8_

  - [-]* 12.3 Write property test for API client auth header injection
    - **Property 1: Authentication Isolation (client-side)**
    - **Validates: Requirements 12.2**
    - Use `fast-check` in `src/__tests__/api.property.test.ts`; generate arbitrary token strings and assert every request produced by the client includes the correct `Authorization` header

- [x] 13. Frontend — replace AuthContext mock
  - [x] 13.1 Rewrite `AuthContext` to use real API
    - Replace all `localStorage` mock logic in `src/app/contexts/AuthContext.tsx` with calls to `apiClient.auth.login`, `apiClient.auth.register`, `apiClient.auth.logout`
    - Store `accessToken` and `refreshToken` in memory (module-level variables, not localStorage); expose only `user` object in context state
    - On mount, attempt a silent token refresh to restore session; set `isLoading = true` until resolved
    - _Requirements: 12.1, 9.8, 1.8_

  - [x] 13.2 Add loading and error states to auth pages
    - Update `LoginPage.tsx` and `RegisterPage.tsx` to show a spinner while `isLoading` is true and display the error message string when the API call fails
    - _Requirements: 12.3, 12.4_

- [x] 14. Frontend — replace DataContext mock
  - [x] 14.1 Rewrite `DataContext` to use React Query
    - Replace all `localStorage` mock logic in `src/app/contexts/DataContext.tsx` with React Query hooks: `useQuery` for list/get operations, `useMutation` for create/delete/upload/match
    - Remove all in-browser `extractSkillsFromCV` and `calculateMatch` mock functions
    - Expose query results and mutation functions through context (or remove context and use hooks directly in pages)
    - _Requirements: 12.1, 12.5_

  - [x] 14.2 Add loading and error states to data pages
    - Update `UploadCVPage.tsx`: show upload progress bar, poll `GET /api/cv/:id` every 3 seconds until `parseStatus = 'completed'` or `'failed'`; show retry button on failure
    - Update `DashboardPage.tsx`, `HistoryPage.tsx`, `MatchResultPage.tsx`: show skeleton loaders while queries are loading; show error alert with message on failure
    - Update `JobDescriptionPage.tsx`: show loading state during job creation mutation
    - _Requirements: 12.3, 12.4, 10.4_

  - [x] 14.3 Wire profile page to real API
    - Update `ProfilePage.tsx` to call `apiClient.profile.get` on mount and `apiClient.profile.update` on form submit using React Query `useQuery` / `useMutation`
    - _Requirements: 7.1, 7.2, 7.3, 12.1_

- [x] 15. Final checkpoint — full stack integrated
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- The backend and AI service are built in `backend/` and `ai-service/` subdirectories respectively
- Property tests validate universal correctness properties; unit tests validate specific examples and edge cases
- The frontend prototype's routes and UI components remain unchanged — only context/data layer is replaced
