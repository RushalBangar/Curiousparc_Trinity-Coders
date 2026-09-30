# SkillBridge — Technical Architecture & System Design

SkillBridge is built on a decoupled, service-oriented architecture prioritizing low latency, data integrity, mathematical determinism, and seamless user experience.

---

## Table of Contents

- [System Architecture Overview](#system-architecture-overview)
- [Core Components](#core-components)
  - [1. Frontend Presentation Layer](#1-frontend-presentation-layer)
  - [2. Application & API Layer (FastAPI)](#2-application--api-layer-fastapi)
  - [3. Persistence & Auth Layer (Supabase / PostgreSQL)](#3-persistence--auth-layer-supabase--postgresql)
- [Algorithmic Formulation: Skill-to-Job Matching Engine](#algorithmic-formulation-skill-to-job-matching-engine)
  - [Mathematical Model](#mathematical-model)
  - [Competency Categorization](#competency-categorization)
  - [Proficiency & Assessment Multipliers](#proficiency--assessment-multipliers)
- [Sequence Workflows](#sequence-workflows)
  - [Authentication & Session Lifecycle](#authentication--session-lifecycle)
  - [Skill Matching & Gap Analysis Workflow](#skill-matching--gap-analysis-workflow)
  - [Application & Recruiter Pipeline Management](#application--recruiter-pipeline-management)
- [Security, Authorization & RLS Model](#security-authorization--rls-model)

---

## System Architecture Overview

```mermaid
flowchart TD
    subgraph Client["Frontend Client (Vanilla Web Standards)"]
        UI["Modern UI / Responsive Views\n(HTML5, CSS3, ES6 Modules)"]
        APIClient["API Client & Interceptor\n(Native Fetch + Bearer JWT)"]
        ToastMgr["Toast & UI Feedback Service"]
    end

    subgraph Backend["Application Server (Python / FastAPI)"]
        FastAPIApp["FastAPI ASGI Gateway\n(Uvicorn)"]
        Router["API v1 Central Router\n(/auth, /users, /jobs, /skills)"]
        SecurityMW["Auth Security Middleware\n(JWT Validator & Context Dependency)"]
        MatchEngine["Matching & Gap Analysis Engine\n(app/services/matcher.py)"]
        Models["Pydantic Schemas\n(Input/Output Validation)"]
    end

    subgraph Database["Supabase Cloud (PostgreSQL 15+)"]
        AuthService["Supabase Auth & GoTrue\n(JWT Issuance, Google OAuth)"]
        PostgresTables["Relational Tables\n(profiles, skills, jobs, candidate_skills, job_skills, applications)"]
        RLS["Row Level Security (RLS) Policies"]
        StorageEngine["Supabase Storage\n(Resumes & Company Assets)"]
    end

    UI --> APIClient
    APIClient -- "REST API (JSON over HTTPS)" --> FastAPIApp
    FastAPIApp --> SecurityMW
    SecurityMW --> Router
    Router --> MatchEngine
    Router --> Models
    
    FastAPIApp -- "Service Client / Anon Key" --> PostgresTables
    FastAPIApp -- "Token Introspection" --> AuthService
    UI -- "OAuth Redirect & Token Flow" --> AuthService
    PostgresTables --- RLS
```

---

## Core Components

### 1. Frontend Presentation Layer
- **Technology**: Vanilla HTML5, Modern CSS3 with custom properties (CSS variables), and Modular Vanilla JavaScript (ES6+).
- **Design Philosophy**: Zero bundler complexity, blazing-fast asset delivery, no framework overhead.
- **Key Modules**:
  - `api.js`: Centralized singleton `ApiClient` wrapping the browser's `fetch()` API. It automatically attaches Bearer tokens, handles global error interception, triggers 401 automatic session cleanup, and integrates non-blocking Toast alerts.
  - `auth.js`: Manages user authentication lifecycle, local storage persistence, and role-based route guarding.
  - `candidate.js`: Powers the seeker dashboard, skill tagging system, proficiency sliders, and application history.
  - `recruiter.js`: Manages job publication forms, multi-skill taggers with requirement toggles and weight sliders, and applicant ranking pipelines.
  - `matching.js`: Visualizes match score meters, progress rings, and color-coded skill gap badges.

### 2. Application & API Layer (FastAPI)
- **Framework**: Python 3.10+ / FastAPI, running on Uvicorn ASGI server.
- **Key Capabilities**:
  - **Asynchronous Execution**: Native `async`/`await` patterns for high-throughput I/O operations.
  - **Type Safety & Data Validation**: Pydantic v2 data models guarantee strict schema enforcement for all ingress payloads and egress responses.
  - **Dependency Injection**: Reusable FastAPI dependencies (`get_current_user`, `get_supabase_client`) provide stateless authentication verification and database client distribution.
  - **Automated Documentation**: OpenAPI 3.0 specs available dynamically at `/docs` (Swagger UI) and `/redoc`.

### 3. Persistence & Auth Layer (Supabase / PostgreSQL)
- **Database Engine**: Hosted PostgreSQL 15 via Supabase.
- **Relational Integrity**: Enforced through foreign key constraints (`ON DELETE CASCADE`) across user profiles, job postings, skills taxonomy, and applications.
- **Authentication**: Supabase Auth (GoTrue) handles password hashing, JWT signing, refresh token rotation, and Google OAuth 2.0 social authentication.
- **Row Level Security**: Database-level authorization rules prevent unauthorized reads or writes at the SQL query execution layer.

---

## Algorithmic Formulation: Skill-to-Job Matching Engine

The core differentiator of SkillBridge is its **deterministic, weighted dual-tier matching engine** (`app/services/matcher.py`). Rather than opaque heuristic keyword scraping, it applies structured mathematical scoring.

### Mathematical Model

The match percentage is calculated by evaluating mandatory (required) job competencies separately from optional (preferred) competencies:

$$\text{Match Score (\%)} = \left[ \left( W_{\text{req}} \times \frac{\sum (w_i \times m_i)}{\sum w_i} \right) + \left( W_{\text{pref}} \times \frac{\sum (w_j \times m_j)}{\sum w_j} \right) \right] \times 100$$

#### Variables & Parameters:
- $W_{\text{req}}$: Weight factor for required skills (**Default: 0.75** or 75% of the total score).
- $W_{\text{pref}}$: Weight factor for preferred skills (**Default: 0.25** or 25% of the total score).
- **Edge Case handling**: If a job listing specifies no preferred skills, $W_{\text{req}}$ automatically adapts to **1.00** (100%), preventing dilution of score.
- $w_i, w_j$: The recruiter-defined importance multiplier for skill $i$ or $j$ (range $0.5$ to $2.0$, default $1.0$).
- $m_i, m_j$: The candidate's proficiency or assessment multiplier for skill $i$ or $j$ (range $0.0$ to $1.0$).

### Proficiency & Assessment Multipliers ($m$)

SkillBridge evaluates proficiency through two vectors:

1. **Assessment Quiz Score (Highest Precedence)**:
   If the candidate has verified their competency via a skill assessment quiz:
   $$m = \frac{\text{quiz\_score}}{100.0}$$
   *(Example: A quiz score of 85 yields $m = 0.85$)*

2. **Self-Reported Proficiency Tier (Fallback)**:
   When no quiz score exists, the system maps the self-declared level:
   - **Beginner**: $0.25$
   - **Intermediate**: $0.50$
   - **Advanced**: $0.75$
   - **Expert**: $1.00$

### Competency Categorization

For every candidate-job pairing, the engine categorizes competencies into three clear buckets:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Candidate Skills vs Job Req                     │
├─────────────────────┬──────────────────────────┬───────────────────────┤
│    Matched Skills   │   Critical Skill Gaps    │  Bonus Competencies   │
│       (Green)       │          (Red)           │        (Blue)         │
├─────────────────────┼──────────────────────────┼───────────────────────┤
│ Required skills the │ Required skills missing  │ Preferred skills the  │
│ candidate possesses │ from candidate profile.  │ candidate possesses.  │
│ (Contributes to     │ Directly linked to the   │ Boosts overall score  │
│ required score)     │ interactive Roadmaps.    │ beyond baseline.      │
└─────────────────────┴──────────────────────────┴───────────────────────┘
```

---

## Sequence Workflows

### Authentication & Session Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Browser
    participant Client as Frontend (api.js / auth.js)
    participant API as FastAPI Backend
    participant Supabase as Supabase Auth & DB

    alt Standard Email/Password Login
        User->>Client: Enters email & password
        Client->>API: POST /api/v1/auth/login
        API->>Supabase: supabase.auth.sign_in_with_password()
        Supabase-->>API: Returns JWT & Session Object
        API-->>Client: Returns access_token, refresh_token, profile
        Client->>Client: Stores tokens in localStorage
        Client->>User: Redirects to Candidate or Recruiter Dashboard
    else Google OAuth 2.0 Flow
        User->>Client: Clicks "Continue with Google"
        Client->>API: GET /api/v1/auth/google
        API-->>Client: Returns Supabase OAuth URL
        Client->>Supabase: Redirects user to Google OAuth consent
        Supabase-->>Client: Redirects to auth-callback.html#access_token=...
        Client->>Client: Extracts tokens from URL hash fragment
        Client->>API: POST /api/v1/users/me/init-profile
        API->>Supabase: Ensures profiles record exists
        API-->>Client: Confirmed user profile
        Client->>User: Route to corresponding dashboard
    end
```

---

### Skill Matching & Gap Analysis Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Seeker as Job Seeker
    participant UI as Candidate Dashboard
    participant API as FastAPI Backend (/jobs/{id})
    participant Matcher as Matcher Service
    participant DB as Supabase PostgreSQL

    Seeker->>UI: Clicks on a Job Card to view details
    UI->>API: GET /api/v1/jobs/{job_id} (Bearer JWT)
    API->>DB: Query job details + job_skills
    DB-->>API: Returns job requirements
    API->>DB: Query candidate_skills for current_user.id
    DB-->>API: Returns candidate skills, proficiencies, quiz scores
    API->>Matcher: calculate_match_and_gap_analysis(...)
    Note over Matcher: Computes Dual-Tier Weighted Score<br/>Categorizes Matched, Gaps, and Bonuses
    Matcher-->>API: Returns GapAnalysisResult
    API-->>UI: Combined Job Detail + Gap Analysis Payload
    UI->>Seeker: Displays Match % Meter, Green/Red/Blue badges
    opt Candidate clicks "View Learning Roadmap"
        Seeker->>UI: Clicks missing skill badge
        UI->>UI: Opens roadmap.html?skill={name}
        UI->>Seeker: Curated video playlist & curriculum to close gap
    end
```

---

### Application & Recruiter Pipeline Management

```mermaid
sequenceDiagram
    autonumber
    actor Seeker as Job Seeker
    actor Recruiter as Hiring Recruiter
    participant UI as Web Frontend
    participant API as FastAPI Backend
    participant DB as Supabase PostgreSQL

    Seeker->>UI: Clicks "Apply Now" on Job Details
    UI->>API: POST /api/v1/jobs/{job_id}/apply
    API->>DB: Calculate & snapshot current match_score
    API->>DB: INSERT into applications (job_id, candidate_id, match_score, status='applied')
    DB-->>API: Confirmation
    API-->>UI: Application registered
    
    Note over Recruiter, DB: Recruiter reviews applicant pool
    Recruiter->>UI: Navigates to Recruiter Pipeline for Job
    UI->>API: GET /api/v1/jobs/{job_id}/candidates
    API->>DB: Verify recruiter owns job_id
    API->>DB: SELECT * FROM applications WHERE job_id = ... ORDER BY match_score DESC
    DB-->>API: Ranked candidate list
    API-->>UI: Render applicants sorted by highest skill compatibility
    Recruiter->>UI: Selects candidate and marks "Shortlist"
    UI->>API: PATCH /api/v1/jobs/{job_id}/applications/{candidate_id} (status: "shortlisted")
    API->>DB: UPDATE applications SET status = 'shortlisted'
    DB-->>API: Updated record
    API-->>UI: Instant visual update on applicant card
```

---

## Security, Authorization & RLS Model

1. **Stateless JWT Authentication**:
   - The FastAPI backend validates bearer tokens against Supabase's signing secret on every protected request.
   - User identity and permissions are injected into route handlers using FastAPI's dependency system (`Depends(get_current_user)`).

2. **Role-Based Access Control (RBAC)**:
   - System profiles enforce strict roles (`seeker`, `recruiter`, `admin`).
   - Route-level role guards prevent privilege escalation (e.g. seekers attempting to execute `POST /jobs` or recruiters viewing seeker-only skill endpoints).

3. **Row Level Security (RLS)**:
   - All tables (`profiles`, `skills`, `candidate_skills`, `jobs`, `job_skills`, `applications`) have PostgreSQL Row Level Security enabled.
   - Even in direct client integrations, users cannot access records outside their permission envelope.
