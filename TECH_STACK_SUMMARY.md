# SkillLens - Technical Stack & Feature Summary

## 📋 Overview
SkillLens is a CV analysis and job matching prototype built for a dissertation project. This document outlines all technologies, libraries, and implementation approaches used.

---

## 🎨 Frontend Technologies

### Core Framework
- **React 18.3.1** - Main UI framework
- **TypeScript** - Type safety and better developer experience
- **Vite 6.3.5** - Build tool and development server

### Routing
- **React Router 7.13.0** - Client-side routing with data mode pattern
  - Multi-page navigation (Home, Dashboard, Upload, Jobs, History, Profile, Match Results)
  - Protected routes with authentication guards
  - URL-based routing for bookmarkable pages

### Styling
- **Tailwind CSS 4.1.12** - Utility-first CSS framework
- **Custom CSS Variables** - Theme tokens in `/src/styles/theme.css`
- **Responsive Design** - Mobile-first approach with breakpoints

### UI Components Library
- **Radix UI** - Headless accessible components
  - Dialog, Dropdown, Popover, Accordion, Tabs, etc.
  - Full list of 20+ Radix components installed
- **shadcn/ui Pattern** - Pre-built components using Radix UI + Tailwind
- **Lucide React 0.487.0** - Icon library (Upload, Briefcase, CheckCircle, etc.)

### Additional UI Libraries
- **Motion (Framer Motion) 12.23.24** - Animation library
- **Recharts 2.15.2** - Charts and data visualization
- **Sonner 2.0.3** - Toast notifications
- **date-fns 3.6.0** - Date formatting and manipulation
- **React Hook Form 7.55.0** - Form state management
- **Material UI 7.3.5** - Alternative component library (installed but not primary)

---

## 💾 State Management & Data Storage

### Current Implementation (Frontend Only)
- **React Context API** - Global state management
  - `AuthContext` - User authentication state
  - `DataContext` - CV uploads, job descriptions, match results
- **localStorage** - Client-side data persistence
  - User data stored per user ID
  - CVs, jobs, and match history persisted locally

### Data Flow
1. User uploads CV → File validated → Stored in context
2. Mock AI extracts skills → Displayed for user verification
3. User creates job description → Skills manually extracted
4. Matching algorithm runs → Results stored in context
5. All data persisted to localStorage by user ID

---

## 🤖 CV Scanning & Upload (Current Implementation)

### **⚠️ IMPORTANT: Currently Mock Implementation**

The current prototype uses **simulated/mock CV processing**. No actual AI or NLP is running.

### CV Upload Flow
1. **File Upload**
   - Accepts: PDF and DOCX files
   - Max size: 5MB
   - Validation: File type and size checks
   - Storage: File object stored temporarily, metadata saved

2. **"AI" Skill Extraction (Mocked)**
   - **Current Implementation**: Random selection from predefined skill list
   - Skills pool: JavaScript, Python, React, Node.js, SQL, TypeScript, etc.
   - Returns 6-12 random skills with confidence scores (70%-100%)
   - 2-second delay to simulate processing

3. **Skill Verification**
   - Users can check/uncheck extracted skills
   - Confidence scores displayed for each skill
   - Color-coded by confidence level (green ≥90%, yellow ≥70%, red <70%)

### What You NEED for Production (Not Implemented Yet)
For your dissertation's actual implementation, you would need:

#### Backend Options:
1. **Python NLP Service** (As per your architecture)
   - **spaCy** or **NLTK** for text processing
   - **pdfplumber** or **PyPDF2** for PDF parsing
   - **python-docx** for DOCX parsing
   - **scikit-learn** for skill classification
   - REST API endpoint for CV processing

2. **Alternative: Cloud AI Services**
   - **OpenAI GPT API** - Skill extraction via prompts
   - **Google Cloud Natural Language API** - Entity extraction
   - **Azure Text Analytics** - Key phrase extraction
   - **AWS Textract** - Document parsing

3. **Resume Parsing Libraries**
   - **Sovren** - Commercial resume parser
   - **Affinda** - Resume parsing API
   - **Resume-Parser (Python)** - Open source library

---

## 📝 Job Description Processing (Current Implementation)

### Current Flow
1. User manually inputs job details (title, company, description)
2. User manually adds required skills with importance weights (1-5)
3. Skills stored with job description
4. No automated parsing currently implemented

### Production Recommendations
- **Same NLP tools** as CV parsing
- Extract skills from job description text automatically
- Weight skills by frequency/position in text
- Match job titles to standard occupational classifications

---

## 🎯 Matching Algorithm (Current Implementation)

### Current Algorithm (Mock)
Located in `/src/app/contexts/DataContext.tsx`

**Algorithm Steps:**
1. Compare CV skills vs required job skills
2. Direct string matching (case-insensitive)
3. Partial matching (checks if words are substrings)
4. Calculate weighted match score
5. Generate skill gaps with recommendations

**Scoring:**
- **Matched**: Full weight counted (100%)
- **Partial**: Half weight counted (50%)
- **Missing**: No weight (0%)
- **Final Score**: (matchedWeight / totalWeight) × 100

### Production Recommendations
For your dissertation, implement:

1. **Semantic Similarity**
   - Use word embeddings (Word2Vec, GloVe)
   - Sentence transformers for context
   - Cosine similarity for skill matching

2. **Skill Taxonomy**
   - Map skills to standard taxonomy (e.g., O*NET)
   - Handle synonyms (React.js = ReactJS)
   - Recognize related skills (JavaScript → TypeScript)

3. **Advanced Scoring**
   - TF-IDF for skill importance
   - Machine learning classification
   - Experience level matching
   - Industry-specific weights

---

## 🔐 Authentication & User Management

### Current Implementation
- **Mock Authentication** in `AuthContext`
- In-memory user storage
- localStorage for session persistence
- No password hashing (mock only)

### Features
- Registration with name, email, password
- Login with email/password
- Session management
- Protected routes (redirect to login)
- User profile management

### Production Recommendations
Your architecture calls for backend authentication. Implement:
- **Supabase Auth** (already configured in project)
- **JWT tokens** for session management
- **Bcrypt** password hashing
- **OAuth** for social login (Google, GitHub)
- **Role-based access control** (job seekers, recruiters, admins)

---

## 📊 Data Visualization

### Installed Libraries
- **Recharts 2.15.2** - Chart components
  - Bar charts for skill comparisons
  - Line charts for progress tracking
  - Pie charts for match distributions
  - Area charts for historical trends

### Current Usage
- Dashboard statistics (CVs uploaded, jobs tracked, matches run)
- Match score visualization
- Skill gap breakdown (matched, partial, missing)

---

## 🗄️ Database & Backend (Architecture Plan)

### Your Architecture Document Specifies:
1. **PostgreSQL Database**
   - Tables: users, cvs, jobs, matches, skills, etc.
   - Relational structure
   - Indexes for performance

2. **Node.js/Express Backend**
   - REST API endpoints
   - File upload handling (Multer)
   - JWT authentication
   - Business logic layer

3. **Python AI Service**
   - Separate microservice
   - NLP processing
   - Skill extraction
   - Matching algorithms
   - Communication via REST API

### Current State
- **Frontend-only prototype**
- No database currently
- localStorage for persistence
- Mock data generation

### Migration Path to Production
1. Set up PostgreSQL database
2. Create Express.js API server
3. Build Python NLP service
4. Replace Context API with API calls
5. Implement file storage (S3, Supabase Storage)
6. Add Supabase for authentication

---

## 📦 File Structure

```
/src
  /app
    /components          # Reusable UI components
      /ui               # shadcn/ui components
    /contexts           # React Context (Auth, Data)
    /layouts            # Page layouts (Root, Auth, Dashboard)
    /pages              # Route pages
    App.tsx             # Main app component
    routes.tsx          # Route configuration
  /styles
    theme.css           # Design tokens
    fonts.css           # Font imports
    index.css           # Global styles
  /imports              # Assets (if any)
```

---

## 🚀 Current Features Implemented

### ✅ Completed
1. **Home Page** - Professional landing page with features showcase
2. **Authentication** - Login/Register with mock backend
3. **Dashboard** - Stats overview, quick actions, latest results
4. **CV Upload** - File validation, mock skill extraction, verification
5. **Job Description** - Manual job input with skills
6. **Matching** - Algorithm with scoring and gap analysis
7. **Match Results** - Detailed breakdown with recommendations
8. **History** - View all past CV uploads, jobs, and matches
9. **Profile** - User information and settings
10. **Responsive Design** - Mobile-friendly across all pages
11. **Navigation** - React Router with protected routes
12. **Back to Home** - Navigation button on all pages

### ⏳ Needs Implementation for Production
1. **Real CV Parsing** - Replace mock with actual NLP
2. **Backend API** - Node.js/Express server
3. **Database** - PostgreSQL with proper schema
4. **Python AI Service** - Actual NLP processing
5. **File Storage** - Cloud storage for CVs
6. **Real Authentication** - Supabase/JWT
7. **Advanced Matching** - Semantic similarity, ML models
8. **Analytics Dashboard** - Detailed charts and insights
9. **Email Notifications** - Match alerts
10. **Export Features** - PDF reports, CSV exports

---

## 📈 Next Steps for Your Dissertation

### Phase 1: Backend Setup
1. Set up PostgreSQL database
2. Create database schema (users, cvs, jobs, matches, skills)
3. Build Express.js REST API
4. Implement authentication with JWT

### Phase 2: AI/NLP Service
1. Build Python service with Flask/FastAPI
2. Implement PDF/DOCX parsing (pdfplumber, python-docx)
3. Add NLP for skill extraction (spaCy)
4. Create matching algorithm with semantic similarity
5. Test and tune accuracy

### Phase 3: Integration
1. Connect frontend to backend API
2. Replace localStorage with database calls
3. Implement file upload to cloud storage
4. Add real-time processing feedback

### Phase 4: Advanced Features
1. Improve matching algorithm with ML
2. Add analytics dashboard
3. Implement recommendation system
4. Create admin panel
5. Add export/reporting features

---

## 📚 Key Libraries Summary

| Feature | Library | Version | Purpose |
|---------|---------|---------|---------|
| UI Framework | React | 18.3.1 | Component-based UI |
| Routing | React Router | 7.13.0 | Navigation |
| Styling | Tailwind CSS | 4.1.12 | Utility CSS |
| Components | Radix UI | Various | Accessible primitives |
| Icons | Lucide React | 0.487.0 | Icon set |
| Forms | React Hook Form | 7.55.0 | Form management |
| Charts | Recharts | 2.15.2 | Data visualization |
| Notifications | Sonner | 2.0.3 | Toast messages |
| Animations | Motion | 12.23.24 | UI animations |
| Dates | date-fns | 3.6.0 | Date formatting |
| Build Tool | Vite | 6.3.5 | Dev server & bundler |

---

## 🎓 Dissertation Notes

### What to Emphasize
1. **Architecture** - Show the complete system design (frontend + backend + AI)
2. **Prototype** - Current React app demonstrates UI/UX and user flows
3. **Algorithm** - Document the matching logic and scoring methodology
4. **Scalability** - Discuss how the architecture supports growth
5. **User Experience** - Highlight the clean, professional interface

### What to Acknowledge
- Current implementation is a **frontend prototype**
- AI/NLP features are **mocked** for demonstration
- Production version would require full backend stack
- This validates user flows before heavy backend investment

### Research Opportunities
1. Compare different skill extraction methods
2. Evaluate matching algorithm accuracy
3. User testing of UI/UX design
4. Performance benchmarks
5. Accessibility compliance testing

---

## 📞 Summary

**Current State**: Fully functional React prototype with mock data  
**Tech Stack**: React + TypeScript + Tailwind CSS + Radix UI  
**Data**: localStorage (temporary, frontend-only)  
**AI/NLP**: Mock implementation (random skill generation)  

**Production Requirements**:  
- Node.js/Express backend  
- PostgreSQL database  
- Python NLP service (spaCy, NLTK)  
- Real file processing (PDF/DOCX parsing)  
- Cloud storage (AWS S3 / Supabase)  
- Production authentication (Supabase Auth / JWT)

**Next Priority**: Build backend API and Python NLP service to replace mock implementations.
