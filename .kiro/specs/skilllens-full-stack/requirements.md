# Requirements Document

## Introduction

SkillLens is a full-stack CV analysis and job-matching web application. Users upload CVs (PDF or DOCX), which are parsed by a Python AI service to extract and normalise skills. Users then create job descriptions with weighted required skills. The system runs a hybrid matching pipeline (exact match → semantic similarity → weighted scoring) and returns an explainable match score with per-skill gap recommendations. This document derives requirements from the approved design, covering authentication, CV upload and parsing, job description management, AI matching, history, profile management, and cross-cutting concerns.

## Glossary

- **API**: The Node.js/Express backend service that the React frontend communicates with exclusively.
- **AI_Service**: The Python/FastAPI microservice responsible for document parsing and NLP-based skill matching.
- **Auth_Service**: Supabase Auth, which handles password hashing, JWT issuance, and session management.
- **Storage**: Supabase Storage, the private object store for raw CV files.
- **Database**: PostgreSQL hosted on Supabase, containing all persistent application data.
- **Frontend**: The React 18/TypeScript/Vite single-page application.
- **JWT**: JSON Web Token used as the bearer credential for all protected API endpoints.
- **CV**: A curriculum vitae document uploaded by a user, in PDF or DOCX format.
- **ExtractedSkill**: A skill entity identified from a CV, with a raw text, normalised name, and confidence score.
- **JobDescription**: A user-created record containing a job title, company name, description text, and a list of required skills with importance weights.
- **MatchResult**: The output of the hybrid matching pipeline, containing a score, explanation, and per-skill gap details.
- **SkillGapResult**: A single row in the match output classifying one job-required skill as matched, partial, or missing.
- **Skill_Taxonomy**: The canonical list of skill names used for normalisation.
- **EXACT_THRESHOLD**: Semantic similarity score of 0.90, above which a skill is classified as matched.
- **PARTIAL_THRESHOLD**: Semantic similarity score of 0.65, above which (and below EXACT_THRESHOLD) a skill is classified as partial.

---

## Requirements

### Requirement 1: User Authentication

**User Story:** As a new or returning user, I want to register and log in securely, so that my CV data and match history are private and persistent across sessions.

#### Acceptance Criteria

1. WHEN a user submits a registration request with a unique email, name, and password, THE API SHALL create a new account via Auth_Service, insert a corresponding row in the `users` table, and return HTTP 201 with an `access_token`, `refresh_token`, and user object.
2. IF a registration request contains an email that already exists in the `users` table, THEN THE API SHALL return HTTP 409 with the message "Email already registered" without creating any new records.
3. WHEN a user submits valid login credentials, THE API SHALL authenticate via Auth_Service and return HTTP 200 with an `access_token`, `refresh_token`, and user object.
4. IF a login request contains credentials that do not match any registered account, THEN THE API SHALL return HTTP 401 with the message "Invalid email or password".
5. WHEN a request to a protected endpoint includes a valid, non-expired JWT in the `Authorization: Bearer` header, THE API SHALL allow the request to proceed and set `req.user` to the authenticated user's identity.
6. IF a request to a protected endpoint includes an expired JWT, THEN THE API SHALL return HTTP 401 with the message "Token expired" and SHALL NOT execute the route handler.
7. IF a request to a protected endpoint includes no `Authorization` header or a malformed token, THEN THE API SHALL return HTTP 401 with the message "Missing token" or "Invalid token" respectively.
8. WHEN a user's access token expires, THE Frontend SHALL silently attempt a token refresh using the stored refresh token; IF the refresh succeeds, THE Frontend SHALL retry the original request transparently; IF the refresh fails, THE Frontend SHALL redirect the user to `/auth/login`.

---

### Requirement 2: CV Upload and Parsing

**User Story:** As a user, I want to upload my CV and have my skills automatically extracted, so that I can use them for job matching without manual entry.

#### Acceptance Criteria

1. WHEN a user uploads a file with MIME type `application/pdf` or `application/vnd.openxmlformats-officedocument.wordprocessingml.document` and size ≤ 10 MB, THE API SHALL store the file in Storage at path `{userId}/{cvId}/{fileName}`, insert a `cv_uploads` row with `parse_status = 'processing'`, and return HTTP 202 with `{cvId, status: 'processing'}`.
2. IF a user uploads a file with a MIME type other than PDF or DOCX, THEN THE API SHALL return HTTP 400 with the message "Only PDF and DOCX files are accepted" and SHALL NOT write the file to Storage.
3. IF a user uploads a file exceeding 10 MB, THEN THE API SHALL return HTTP 413 with the message "File exceeds 10 MB limit" and SHALL NOT write the file to Storage.
4. WHEN a CV file is stored in Storage, THE API SHALL dispatch an asynchronous request to THE AI_Service `POST /parse` endpoint with the `cv_id`, a signed URL, and the file type.
5. WHEN THE AI_Service receives a parse request for a PDF file, THE AI_Service SHALL extract text using pdfplumber as the primary method; IF pdfplumber returns empty text, THE AI_Service SHALL fall back to PyPDF2.
6. WHEN THE AI_Service receives a parse request for a DOCX file, THE AI_Service SHALL extract text using python-docx.
7. WHEN text is extracted from a CV, THE AI_Service SHALL segment it into sections (education, experience, skills) and identify skill entities using spaCy NER and pattern matching.
8. WHEN skill entities are identified, THE AI_Service SHALL normalise each skill name against the Skill_Taxonomy using exact match, alias lookup, and fuzzy matching (token_sort_ratio ≥ 85), and assign a `confidence_score` in the range [0.0, 1.0].
9. WHEN CV parsing completes successfully, THE AI_Service SHALL insert `extracted_skills` rows for the CV and THE API SHALL update `cv_uploads.parse_status` to `'completed'`.
10. IF CV parsing fails for any reason, THE AI_Service SHALL return `status = 'failed'` with an error message, and THE API SHALL update `cv_uploads.parse_status` to `'failed'` and store the `error_message`.
11. WHEN a user requests the list of their CVs, THE API SHALL return only `cv_uploads` rows where `user_id` matches the authenticated user.
12. WHEN a user deletes a CV, THE API SHALL remove the file from Storage and cascade-delete all associated `extracted_skills`, `match_results`, and `skill_gap_results` rows.

---

### Requirement 3: Skill Review

**User Story:** As a user, I want to review and verify the skills extracted from my CV, so that I can correct any inaccuracies before running a match.

#### Acceptance Criteria

1. WHEN a user submits skill verification updates for a CV, THE API SHALL update the `user_verified` flag on each specified `extracted_skills` row and return the updated CV object.
2. THE API SHALL return all `extracted_skills` rows for a CV when the CV is fetched, including `raw_skill_text`, `normalised_name`, `confidence_score`, and `user_verified` status.

---

### Requirement 4: Job Description Management

**User Story:** As a user, I want to create and manage job descriptions with required skills, so that I can match my CV against specific roles.

#### Acceptance Criteria

1. WHEN a user creates a job description with a title, company name, description text, and a list of required skills, THE API SHALL persist the `job_descriptions` row and all associated `job_required_skills` rows, and return HTTP 201 with the created job object.
2. WHEN a user adds required skills to a job description, THE API SHALL store each skill with an `importance_weight` value in the range [1, 5].
3. WHEN a user requests their job descriptions, THE API SHALL return only `job_descriptions` rows where `user_id` matches the authenticated user.
4. WHEN a user deletes a job description, THE API SHALL cascade-delete all associated `job_required_skills`, `match_results`, and `skill_gap_results` rows.

---

### Requirement 5: Hybrid Skill Matching

**User Story:** As a user, I want to run an AI-powered match between my CV and a job description, so that I receive an accurate, explainable compatibility score with actionable skill gap recommendations.

#### Acceptance Criteria

1. WHEN a match is requested with a `cvId` and `jobId` owned by the authenticated user, THE API SHALL verify that the CV's `parse_status` is `'completed'` before forwarding the request to THE AI_Service.
2. IF a match is requested for a CV whose `parse_status` is not `'completed'`, THEN THE API SHALL return HTTP 409 with the message "CV parsing not complete".
3. WHEN THE AI_Service receives a match request, THE AI_Service SHALL first perform exact string matching between normalised CV skill names and job skill names.
4. WHEN a job skill has no exact match in the CV skills, THE AI_Service SHALL compute cosine similarity between the job skill embedding and all CV skill embeddings using sentence-transformers.
5. WHEN a job skill's best cosine similarity score is ≥ EXACT_THRESHOLD (0.90), THE AI_Service SHALL classify it as `'matched'` and add the full `importance_weight` to the earned score.
6. WHEN a job skill's best cosine similarity score is ≥ PARTIAL_THRESHOLD (0.65) and < EXACT_THRESHOLD, THE AI_Service SHALL classify it as `'partial'` and add `0.5 × importance_weight` to the earned score.
7. WHEN a job skill's best cosine similarity score is < PARTIAL_THRESHOLD, THE AI_Service SHALL classify it as `'missing'` and add 0 to the earned score.
8. WHEN the matching pipeline completes, THE AI_Service SHALL compute `match_score = (earned_weight / total_weight) × 100`, where `match_score` is in the range [0.0, 100.0].
9. WHEN the matching pipeline completes, every job required skill SHALL appear in exactly one of the `matched`, `partial`, or `missing` output lists.
10. WHEN the matching pipeline completes, THE AI_Service SHALL produce a human-readable `explanation` string summarising the match result.
11. WHEN THE API receives the match result from THE AI_Service, THE API SHALL insert one `match_results` row and one `skill_gap_results` row per job required skill, then return HTTP 200 with the full `MatchResult` object.
12. IF the same `(cvId, jobId)` pair is submitted while a match is already in progress, THEN THE API SHALL return the existing `matchId` with HTTP 202 rather than creating a duplicate `match_results` row.

---

### Requirement 6: Match History and Results

**User Story:** As a user, I want to view my past match results and their details, so that I can track my progress and revisit recommendations.

#### Acceptance Criteria

1. WHEN a user requests their match history, THE API SHALL return only `match_results` rows where `user_id` matches the authenticated user, ordered by `created_at` descending.
2. WHEN a user fetches a specific match result, THE API SHALL return the `match_score`, `explanation`, and all associated `skill_gap_results` rows including `skill_name`, `gap_type`, `similarity_score`, and `recommendation_note`.
3. IF a user requests a match result that does not belong to them, THEN THE API SHALL return HTTP 404.

---

### Requirement 7: User Profile Management

**User Story:** As a user, I want to manage my profile information, so that I can provide context about my background and career goals.

#### Acceptance Criteria

1. WHEN a user fetches their profile, THE API SHALL return the `profiles` row associated with the authenticated user's `user_id`.
2. WHEN a user updates their profile with education summary, experience summary, target role, or career goal, THE API SHALL persist the changes and return the updated profile object.
3. IF a profile row does not yet exist for a user, THEN THE API SHALL create one with empty fields when the profile is first fetched or updated.

---

### Requirement 8: Feedback Submission

**User Story:** As a user, I want to rate the quality of a match result, so that the system can improve over time.

#### Acceptance Criteria

1. WHEN a user submits feedback for a match result with a `usability_rating` (1–5) and optional `comments`, THE API SHALL insert a `feedback` row and return HTTP 201.
2. IF a user submits feedback for a match result for which they have already submitted feedback, THEN THE API SHALL return HTTP 409 with the message "Feedback already submitted for this match".

---

### Requirement 9: Data Isolation and Security

**User Story:** As a user, I want confidence that my data is private and that other users cannot access my CVs, jobs, or match results.

#### Acceptance Criteria

1. THE API SHALL only return or modify records where `user_id` equals the authenticated user's ID for all endpoints that access `cv_uploads`, `job_descriptions`, `match_results`, `skill_gap_results`, `profiles`, and `feedback`.
2. THE Database SHALL enforce row-level security (RLS) policies so that even if the application layer is bypassed, users can only SELECT, UPDATE, or DELETE their own rows.
3. THE API SHALL serve all traffic over HTTPS and SHALL apply CORS restrictions to allow only the configured frontend origin.
4. THE API SHALL validate all user inputs using Zod schemas before executing any business logic or database queries.
5. THE API SHALL use parameterised SQL statements for all database queries and SHALL NOT construct queries via string interpolation.
6. THE API SHALL sanitise uploaded file names to prevent path traversal attacks before writing to Storage.
7. THE Storage SHALL store CV files in a private bucket accessible only via short-lived signed URLs with a maximum expiry of 1 hour.
8. WHILE a user is authenticated, THE Frontend SHALL store the JWT only in memory or a secure cookie and SHALL NOT expose it to third-party scripts.

---

### Requirement 10: Error Handling and Resilience

**User Story:** As a user, I want the application to handle errors gracefully and provide clear feedback, so that I can recover from failures without losing my work.

#### Acceptance Criteria

1. IF THE AI_Service is unreachable when THE API attempts to call `/parse` or `/match`, THEN THE API SHALL return HTTP 503 with `{error: "AI service temporarily unavailable", retryAfter: 30}`.
2. IF a database unique constraint violation (PostgreSQL error code 23505) occurs, THEN THE API SHALL return HTTP 409 with a user-friendly message and SHALL NOT expose raw database error details to the client.
3. IF a database foreign key constraint violation (PostgreSQL error code 23503) occurs, THEN THE API SHALL return HTTP 400 with a user-friendly message.
4. WHEN a CV parse job fails, THE Frontend SHALL display an error state with a retry option that allows the user to re-upload the file.
5. THE API SHALL apply rate limiting of 100 requests per 15 minutes per IP on authentication endpoints and 500 requests per 15 minutes per IP on all other endpoints.

---

### Requirement 11: Normalisation Correctness

**User Story:** As a developer, I want skill normalisation to be deterministic and idempotent, so that repeated processing produces consistent results.

#### Acceptance Criteria

1. THE AI_Service SHALL normalise skill names by first attempting an exact case-insensitive match against the Skill_Taxonomy, then an alias lookup, then fuzzy matching with token_sort_ratio ≥ 85, and finally returning the title-cased original if no match is found.
2. FOR ALL skill strings S, THE AI_Service SHALL produce the same result when normalise_skill is applied once as when it is applied twice: `normalise_skill(normalise_skill(S)) = normalise_skill(S)`.
3. THE AI_Service SHALL assign a `confidence_score` in the range [0.0, 1.0] to every extracted skill.

---

### Requirement 12: Frontend API Integration

**User Story:** As a developer, I want the React frontend to communicate exclusively with the Express API using a typed client, so that all mock data and localStorage logic is replaced with real backend calls.

#### Acceptance Criteria

1. THE Frontend SHALL replace all localStorage-based mock data operations in `AuthContext` and `DataContext` with HTTP calls to the corresponding API endpoints.
2. THE Frontend SHALL inject the JWT `Authorization: Bearer` header on all requests to protected API endpoints.
3. WHEN an API call is in progress, THE Frontend SHALL display a loading state to the user.
4. IF an API call returns an error, THE Frontend SHALL display a user-readable error message and SHALL NOT crash or show raw error objects.
5. THE Frontend SHALL use React Query for server state management, caching, and background refetch on all data-fetching operations.
