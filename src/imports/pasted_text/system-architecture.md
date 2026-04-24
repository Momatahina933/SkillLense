Proposed System Architecture
1. Architectural style

The recommended architecture for SkillLens is a modular multi-service web architecture made of:

a React frontend
a Node.js/Express backend API
a PostgreSQL database
a secure file storage service
a Python AI/NLP microservice

This is the strongest choice for your project because your own draft already identified that a single-service design is simpler but less flexible, while a multi-service design is better for AI features and gives clearer separation of responsibilities.

2. High-level architecture diagram
+-------------------+
|       User        |
+---------+---------+
          |
          v
+-------------------+
|  React Frontend   |
|  (UI / Dashboard) |
+---------+---------+
          |
          | HTTPS / REST API
          v
+------------------------+
|  Node.js / Express API |
| Auth, business logic,  |
| validation, orchestration
+----+-------------+-----+
     |             |
     |             |
     v             v
+-----------+   +------------------+
|PostgreSQL |   | Secure File      |
|Database   |   | Storage (CVs)    |
+-----------+   +------------------+
     |
     | request for analysis
     v
+---------------------------+
| Python AI/NLP Service     |
| CV parsing, skill         |
| extraction, normalisation,|
| semantic matching,        |
| explanation generation    |
+---------------------------+
3. Why this architecture is appropriate

This architecture directly supports the project goals in your report:

the frontend supports an interactive user experience for profile creation, CV upload, and results viewing
the backend manages users, files, APIs, and secure system control
the Python service handles AI-heavy processing, which your technical review already identified as better separated from the Node backend
the relational database fits your structured data model of users, skills, jobs, and results better than NoSQL

It also aligns with the dissertation guidance that a software artefact project should clearly specify requirements, design, implementation, and evaluation.

4. Layered view of the system
4.1 Presentation layer

This is the React frontend.

Responsibilities
registration and login pages
user profile pages
CV upload interface
job description input form
analysis results dashboard
history page for previous analyses
feedback and recommendations display
Why React

Your draft technical review already justifies React as suitable for interactive forms and reusable UI components.

4.2 Application layer

This is the Node.js/Express backend.

Responsibilities
handle API requests from frontend
authenticate users
validate input and uploaded files
store and retrieve structured data
coordinate CV analysis requests with the Python service
return final results to the frontend
Why Node.js/Express

Your report already identifies Node.js/Express as suitable for APIs, authentication, uploads, and service coordination.

4.3 Data layer

This consists of PostgreSQL and file storage.

Responsibilities
store user accounts
store extracted skills and corrected skills
store job descriptions
store match results
store analysis history
store uploaded CV files securely
Why PostgreSQL

Your report already argues that relational storage is a better fit because the data is structured and strongly linked.

4.4 Intelligence layer

This is the Python AI/NLP service.

Responsibilities
extract text from PDF/DOCX CVs
clean and preprocess text
identify skills
normalise skill names
compare skills to job requirements
produce match score
generate skill-gap explanation
Why separate Python service

Your technical review already supports separating AI processing into Python because it improves flexibility and gives better access to AI tools.

5. Main system modules

A proper architecture section should show modules, not just technologies.

5.1 Authentication and User Management Module

Handles:

sign up
login
logout
password reset
profile management

Inputs: email, password, profile data
Outputs: authenticated session or token, stored user profile

5.2 CV Upload and Document Management Module

Handles:

file upload
file type validation
file size checks
malware-safe handling
secure storage of uploaded CVs

Accepted formats: PDF, DOCX
Outputs: file metadata and stored document reference

5.3 CV Parsing and Preprocessing Module

Handles:

text extraction from CVs
removal of formatting noise
tokenisation / cleaning
segmentation into likely sections such as education, work experience, skills

Outputs: cleaned CV text ready for analysis

5.4 Skill Extraction Module

Handles:

detection of explicit skills from text
possible detection of implied skills
mapping extracted terms to standard skill labels

Example:

“front-end scripting”
“React UI work”
“JavaScript development”

may all be normalised to:

JavaScript
React
Frontend Development

This directly reflects the skill normalisation idea already discussed in your initial review.

5.5 Job Description Analysis Module

Handles:

job description input by user
extraction of required skills
categorisation of essential vs desirable skills if supported
normalisation into same skill vocabulary as CV analysis
5.6 Matching and Scoring Module

Handles:

direct skill overlap matching
weighted scoring
semantic similarity for related terms
final overall match score

A hybrid approach is best here because your report already notes that keyword methods are explainable but limited, while semantic methods are more accurate but harder to explain.

5.7 Explainability Module

Handles:

matched skills list
missing skills list
partially matched skills
reasons for score
suggestions for improvement

This is important because your literature section emphasises explainable results rather than opaque automation.

5.8 Results and History Module

Handles:

saving previous analyses
displaying previous reports
comparing different job roles or CV versions
allowing user review of extracted skills
6. End-to-end workflow
Primary workflow: CV to match result
1. User logs into the system
2. User uploads CV
3. Frontend sends file to backend API
4. Backend validates and stores file
5. Backend sends document for parsing/analysis to Python service
6. Python extracts text and identifies skills
7. User can review/edit extracted skills
8. User submits or pastes target job description
9. Backend sends user skills + job description to Python service
10. Python performs matching and scoring
11. Python returns match result, gaps, and explanation
12. Backend saves result in database
13. Frontend displays dashboard and recommendations
7. Deployment architecture

For an undergraduate project, keep deployment simple and defensible.

Recommended hosting structure
Frontend: Vercel or Netlify
Backend API: Render or Railway
Python AI service: Render or Railway
Database and storage: Supabase
Deployment diagram
Browser
  |
  v
Frontend Hosting (React)
  |
  v
Backend Hosting (Node/Express)
  |               \
  |                \
  v                 v
Supabase DB       AI Service Hosting (Python)
and Storage

This is realistic for your timeframe and matches the practical tool choices already proposed in your initial report.

8. Security architecture

Your report correctly notes that CV data is sensitive and that security must be part of the system design.

Security controls
Authentication and authorisation
secure login using hashed passwords or Supabase Auth
role-based access if needed
users can access only their own CVs and results
File upload security
allow only PDF and DOCX
file size limits
filename sanitisation
content-type validation
store outside public web root
API security
HTTPS for all traffic
JWT or secure session authentication
request validation
rate limiting
proper error handling without leaking internals
Data protection
encrypt data in transit
minimise stored personal data
allow record deletion
obtain user consent before CV analysis
Logging and audit
log uploads, analysis requests, and failures
do not expose confidential document contents in logs
9. Data architecture

A proper system architecture should also define the main entities.

Core database entities
users
user_id
name
email
password_hash / auth_provider_id
created_at
profiles
profile_id
user_id
education_summary
experience_summary
target_role
career_goal
cv_uploads
cv_id
user_id
file_name
file_path
upload_date
parse_status
extracted_skills
extracted_skill_id
cv_id
raw_skill_text
normalised_skill_name
confidence_score
user_verified
job_descriptions
job_id
user_id
title
company_name
description_text
created_at
job_required_skills
job_skill_id
job_id
skill_name
importance_weight
match_results
match_id
user_id
cv_id
job_id
match_score
created_at
skill_gap_results
gap_id
match_id
skill_name
gap_type
recommendation_note
feedback
feedback_id
match_id
user_id
usability_rating
comments
Simple entity relationship view
User -> Profile
User -> CV Uploads
CV Upload -> Extracted Skills
User -> Job Descriptions
Job Description -> Job Required Skills
CV Upload + Job Description -> Match Result
Match Result -> Skill Gap Results
Match Result -> Feedback
10. API architecture

Your backend should expose REST endpoints such as:

Authentication
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
Profile
GET /api/profile
PUT /api/profile
CV handling
POST /api/cv/upload
GET /api/cv/:id
DELETE /api/cv/:id
Skill processing
POST /api/skills/extract
PUT /api/skills/review
Job description
POST /api/jobs
GET /api/jobs/:id
Matching
POST /api/match/run
GET /api/match/:id
GET /api/match/history
Feedback
POST /api/feedback
11. Matching engine design

This is the most important technical part of your architecture.

Recommended matching strategy: hybrid pipeline
Step 1: Rule-based extraction

Extract obvious skills from CV and job description using dictionaries, regex, or known skill lists.

Step 2: Skill normalisation

Map different phrases to standard labels.

Step 3: Semantic similarity

Use embeddings or sentence similarity to detect related skill meanings where exact words differ.

Step 4: Weighted scoring

Combine:

exact skill matches
normalised matches
semantic similarity matches
weighted importance of required skills
Step 5: Explainability output

Return:

matched skills
missing skills
partially matched skills
suggestions

This hybrid approach is the most defensible because it combines explainability with better matching quality, which your literature and technical review already support.

12. Architectural rationale: option comparison
Option A: Monolithic architecture

Everything in one backend.

Pros
simpler to build at first
easier local setup
Cons
harder to maintain
AI processing can block or complicate web logic
less clean separation for dissertation design
Option B: Multi-service architecture

Frontend, backend, and AI service separated.

Pros
cleaner separation of concerns
easier maintenance
better fit for Python NLP tools
more scalable and academically stronger
Cons
slightly more setup complexity
requires secure service-to-service communication
Final choice

Option B: Multi-service architecture

That choice is consistent with your own technical review and is the better architecture for a full-stack AI-supported honours project.

13. Dissertation-ready architecture write-up

You can use this directly in your report:

The proposed system adopts a modular multi-service architecture to support secure CV handling, intelligent skill extraction, and explainable job matching. The architecture consists of a React frontend, a Node.js/Express backend API, a PostgreSQL database, secure file storage, and a Python-based AI/NLP microservice. The frontend is responsible for user interaction, including authentication, CV upload, job description submission, and result visualisation. The backend manages business logic, validation, authentication, persistence, and orchestration between system components. Uploaded CV documents are stored securely and passed to the Python service for text extraction, preprocessing, skill extraction, skill normalisation, and semantic job matching. Match results, including overall score, matched skills, missing skills, and explanatory feedback, are then returned to the backend, stored in the database, and displayed to the user through the frontend dashboard. This architecture was selected because it offers a clearer separation of responsibilities than a monolithic design, improves maintainability, and allows AI-specific processing to be implemented using tools better supported in Python.

14. Final architecture recommendation

For your project, the best final system architecture is:

Frontend: React
Backend: Node.js + Express
Database: PostgreSQL via Supabase
Storage: Supabase Storage
AI service: Python + FastAPI
AI approach: hybrid skill extraction + semantic matching + explainable feedback
Architecture style: modular multi-service

This is strong enough for implementation, clear enough for diagrams, and academic enough for the dissertation.

Next I should turn this into the full Requirements and Design section, including:

functional requirements
non-functional requirements
use cases
ER diagram
component diagram
sequence diagram
wireframe/page list