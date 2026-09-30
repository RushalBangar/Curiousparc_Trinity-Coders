# SkillBridge — REST API Documentation

SkillBridge exposes a modern, high-performance RESTful API powered by **FastAPI**. All API endpoints are organized under the `/api/v1` prefix and adhere to REST conventions, returning standard JSON payloads and HTTP status codes.

---

## Table of Contents

- [Overview & Base URLs](#overview--base-urls)
- [Authentication & Headers](#authentication--headers)
- [Standard Response Formats & Error Codes](#standard-response-formats--error-codes)
- [Endpoint Specifications](#endpoint-specifications)
  - [1. Authentication (`/auth`)](#1-authentication-auth)
    - [POST /auth/signup](#post-authsignup)
    - [POST /auth/login](#post-authlogin)
    - [GET /auth/google](#get-authgoogle)
  - [2. User Profiles & Skills (`/users`)](#2-user-profiles--skills-users)
    - [GET /users/me](#get-usersme)
    - [POST /users/me/init-profile](#post-usersmeinit-profile)
    - [GET /users/me/skills](#get-usersmeskills)
    - [POST /users/me/skills](#post-usersmeskills)
    - [DELETE /users/me/skills/{skill_id}](#delete-usersmeskillsskill_id)
    - [GET /users/me/applications](#get-usersmeapplications)
  - [3. Skills Taxonomy (`/skills`)](#3-skills-taxonomy-skills)
    - [GET /skills](#get-skills)
  - [4. Jobs & Matching Engine (`/jobs`)](#4-jobs--matching-engine-jobs)
    - [POST /jobs](#post-jobs)
    - [GET /jobs/feed](#get-jobsfeed)
    - [GET /jobs/{job_id}](#get-jobsjob_id)
    - [POST /jobs/{job_id}/apply](#post-jobsjob_idapply)
    - [GET /jobs/{job_id}/candidates](#get-jobsjob_idcandidates)
    - [PATCH /jobs/{job_id}/applications/{candidate_id}](#patch-jobsjob_idapplicationscandidate_id)

---

## Overview & Base URLs

| Environment | Base URL |
| :--- | :--- |
| **Local Development** | `http://localhost:8000/api/v1` |
| **Interactive Docs (Swagger UI)** | `http://localhost:8000/docs` |
| **Alternative Docs (ReDoc)** | `http://localhost:8000/redoc` |
| **Production API (Render)** | `https://curiousparc-trinity-coders.onrender.com/api/v1` |

---

## Authentication & Headers

Protected routes require a JSON Web Token (JWT) issued by Supabase Auth upon successful login or registration. The JWT must be supplied in the HTTP `Authorization` header using the `Bearer` scheme:

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

If an invalid, expired, or missing token is provided on a protected endpoint, the server responds with `401 Unauthorized`.

---

## Standard Response Formats & Error Codes

### Standard Error Response Body
```json
{
  "detail": "Descriptive error message explaining the failure reason"
}
```

### Common HTTP Status Codes
| Code | Meaning | Typical Trigger |
| :--- | :--- | :--- |
| `200 OK` | Request succeeded | Standard GET or successful operation |
| `201 Created` | Resource created | Successful registration, job posting, or skill creation |
| `400 Bad Request` | Client validation failure | Malformed JSON, missing fields, or DB constraint violation |
| `401 Unauthorized` | Authentication failure | Missing, expired, or invalid JWT |
| `403 Forbidden` | Authorization failure | Insufficient permissions (e.g. candidate trying to post jobs) |
| `404 Not Found` | Resource not found | Invalid user ID, job ID, or skill ID |
| `500 Internal Server Error` | Server failure | Uncaught backend exception |

---

## Endpoint Specifications

### 1. Authentication (`/auth`)

#### `POST /auth/signup`
Registers a new user account with Supabase Auth and provisions an associated profile entry in the database.

- **Access Level**: Public
- **Request Body**:
```json
{
  "email": "sarah.dev@example.com",
  "password": "SecurePassword123!",
  "full_name": "Sarah Connor",
  "role": "seeker",
  "bio": "Passionate full-stack developer with 3+ years building Python & React apps.",
  "headline": "Full-Stack Software Engineer",
  "location": "San Francisco, CA",
  "resume_url": "https://example.com/resumes/sarah.pdf"
}
```

- **Response (`201 Created`)**:
```json
{
  "message": "User registered successfully",
  "user_id": "8f3b2e54-5b6d-4c3e-8f2a-1c3e4b5a6c7d",
  "session": {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "expires_in": 3600,
    "refresh_token": "d8e3..."
  }
}
```

---

#### `POST /auth/login`
Authenticates existing users via email and password credentials, returning valid JWT session tokens.

- **Access Level**: Public
- **Request Body**:
```json
{
  "email": "sarah.dev@example.com",
  "password": "SecurePassword123!"
}
```

- **Response (`200 OK`)**:
```json
{
  "message": "Login successful",
  "access_token": "eyJhbGciOi...",
  "refresh_token": "d8e3...",
  "user": {
    "id": "8f3b2e54-5b6d-4c3e-8f2a-1c3e4b5a6c7d",
    "email": "sarah.dev@example.com",
    "role": "authenticated"
  }
}
```

---

#### `GET /auth/google`
Generates an OAuth 2.0 authorization URL to initiate Google Single Sign-On (SSO) via Supabase Implicit Flow.

- **Access Level**: Public
- **Query Parameters**:
  - `redirect_url` *(optional, string)*: Frontend URL to handle the OAuth callback hash fragment. Defaults to `https://curiousparc-trinity-coders.onrender.com/auth-callback.html`.
- **Response (`200 OK`)**:
```json
{
  "url": "https://<supabase-project>.supabase.co/auth/v1/authorize?provider=google&redirect_to=https%3A%2F%2Fcuriousparc-trinity-coders.onrender.com%2Fauth-callback.html"
}
```

---

### 2. User Profiles & Skills (`/users`)

#### `GET /users/me`
Retrieves the profile information of the currently authenticated user.

- **Access Level**: Authenticated (`seeker`, `recruiter`, `admin`)
- **Headers**: `Authorization: Bearer <token>`
- **Response (`200 OK`)**:
```json
{
  "id": "8f3b2e54-5b6d-4c3e-8f2a-1c3e4b5a6c7d",
  "email": "sarah.dev@example.com",
  "full_name": "Sarah Connor",
  "role": "seeker",
  "bio": "Passionate full-stack developer with 3+ years building Python & React apps.",
  "headline": "Full-Stack Software Engineer",
  "location": "San Francisco, CA",
  "resume_url": "https://example.com/resumes/sarah.pdf",
  "created_at": "2026-03-15T10:30:00Z"
}
```

---

#### `POST /users/me/init-profile`
Initializes or claims a profile for third-party OAuth sign-ins (e.g. Google Login).

- **Access Level**: Authenticated
- **Request Body**:
```json
{
  "role": "seeker"
}
```
- **Response (`200 OK`)**: Returns the initialized `Profile` object.

---

#### `GET /users/me/skills`
Retrieves all competencies registered on the authenticated candidate's profile, including proficiency tier, years of experience, and quiz assessment scores.

- **Access Level**: Candidate (`role: seeker`)
- **Response (`200 OK`)**:
```json
[
  {
    "skill_id": "c1f73b64-5847-4b78-9e6b-0bfa7c588e31",
    "proficiency_level": "advanced",
    "years_experience": 3.5,
    "quiz_score": 90.0,
    "skill": {
      "id": "c1f73b64-5847-4b78-9e6b-0bfa7c588e31",
      "name": "Python",
      "category": "Languages"
    }
  }
]
```

---

#### `POST /users/me/skills`
Upserts a competency onto the candidate profile. If the skill already exists for the user, its proficiency level and scores are updated.

- **Access Level**: Candidate (`role: seeker`)
- **Request Body**:
```json
{
  "skill_id": "c1f73b64-5847-4b78-9e6b-0bfa7c588e31",
  "proficiency_level": "expert",
  "years_experience": 4.0,
  "quiz_score": 95.0
}
```
- **Response (`201 Created`)**:
```json
{
  "message": "Skill added/updated successfully",
  "data": [
    {
      "candidate_id": "8f3b2e54-5b6d-4c3e-8f2a-1c3e4b5a6c7d",
      "skill_id": "c1f73b64-5847-4b78-9e6b-0bfa7c588e31",
      "proficiency_level": "expert",
      "years_experience": 4.0,
      "quiz_score": 95.0
    }
  ]
}
```

---

#### `DELETE /users/me/skills/{skill_id}`
Removes a specific competency from the authenticated candidate's profile.

- **Access Level**: Candidate (`role: seeker`)
- **Response (`200 OK`)**:
```json
{
  "message": "Skill removed successfully"
}
```

---

#### `GET /users/me/applications`
Fetches a list of all jobs the authenticated candidate has applied to, with recorded match scores and current application statuses.

- **Access Level**: Candidate (`role: seeker`)
- **Response (`200 OK`)**:
```json
[
  {
    "id": "a91b2c3d-e4f5-4a6b-7c8d-9e0f1a2b3c4d",
    "job_id": "550e8400-e29b-41d4-a716-446655440000",
    "candidate_id": "8f3b2e54-5b6d-4c3e-8f2a-1c3e4b5a6c7d",
    "match_score": 87.5,
    "status": "shortlisted",
    "created_at": "2026-03-20T14:20:00Z",
    "jobs": {
      "title": "Senior Full Stack Engineer",
      "company_name": "TechFlow Innovations",
      "location": "Remote - US"
    }
  }
]
```

---

### 3. Skills Taxonomy (`/skills`)

#### `GET /skills`
Searches and queries the platform's standardized skill taxonomy catalog.

- **Access Level**: Authenticated
- **Query Parameters**:
  - `category` *(optional, string)*: Filter by domain (e.g. `Languages`, `Frameworks`, `Databases`, `DevOps`).
  - `search` *(optional, string)*: Case-insensitive substring match for skill names.
- **Response (`200 OK`)**:
```json
[
  {
    "id": "c1f73b64-5847-4b78-9e6b-0bfa7c588e31",
    "name": "Python",
    "category": "Languages"
  },
  {
    "id": "d2e84c75-6958-4c89-af7c-1cfa8d699f42",
    "name": "PostgreSQL",
    "category": "Databases"
  }
]
```

---

### 4. Jobs & Matching Engine (`/jobs`)

#### `POST /jobs`
Publishes a new job listing with weighted mandatory and preferred skill requirements.

- **Access Level**: Recruiter (`role: recruiter`)
- **Request Body**:
```json
{
  "title": "Senior Backend Engineer",
  "company_name": "CloudScale Systems",
  "description": "Architect high-scale microservices using FastAPI, Redis, and Kubernetes.",
  "location": "Remote - Global",
  "employment_type": "full-time",
  "is_active": true,
  "skills": [
    {
      "skill_id": "c1f73b64-5847-4b78-9e6b-0bfa7c588e31",
      "is_required": true,
      "weight": 1.5
    },
    {
      "skill_id": "a4b5c6d7-e8f9-4012-8345-6789abcdef01",
      "is_required": true,
      "weight": 1.0
    },
    {
      "skill_id": "b5c6d7e8-f9a0-4123-9456-7890abcdef12",
      "is_required": false,
      "weight": 0.8
    }
  ]
}
```
- **Response (`201 Created`)**: Returns the created `Job` object.

---

#### `GET /jobs/feed`
Retrieves a paginated list of active job postings.

- **Access Level**: Authenticated
- **Query Parameters**:
  - `skip` *(optional, int, default: 0)*: Number of jobs to skip.
  - `limit` *(optional, int, default: 10)*: Number of jobs to return.
- **Response (`200 OK`)**:
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "recruiter_id": "3c4d5e6f-7a8b-4c9d-0e1f-2a3b4c5d6e7f",
    "title": "Senior Backend Engineer",
    "company_name": "CloudScale Systems",
    "description": "Architect high-scale microservices...",
    "location": "Remote - Global",
    "employment_type": "full-time",
    "is_active": true,
    "created_at": "2026-03-22T08:15:00Z"
  }
]
```

---

#### `GET /jobs/{job_id}`
Fetches full details of a specific job posting. When invoked by a candidate (`role: seeker`), the endpoint dynamically calculates a real-time **Skill Gap Analysis** and **Match Percentage**.

- **Access Level**: Authenticated
- **Response (`200 OK`)**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "recruiter_id": "3c4d5e6f-7a8b-4c9d-0e1f-2a3b4c5d6e7f",
  "title": "Senior Backend Engineer",
  "company_name": "CloudScale Systems",
  "description": "Architect high-scale microservices...",
  "location": "Remote - Global",
  "employment_type": "full-time",
  "is_active": true,
  "created_at": "2026-03-22T08:15:00Z",
  "job_skills": [
    {
      "skill_id": "c1f73b64-5847-4b78-9e6b-0bfa7c588e31",
      "is_required": true,
      "weight": 1.5,
      "skills": {
        "name": "Python",
        "category": "Languages"
      }
    }
  ],
  "gap_analysis": {
    "job_id": "550e8400-e29b-41d4-a716-446655440000",
    "candidate_id": "8f3b2e54-5b6d-4c3e-8f2a-1c3e4b5a6c7d",
    "match_score_percentage": 82.5,
    "matched_skills": [
      {
        "skill": {
          "id": "c1f73b64-5847-4b78-9e6b-0bfa7c588e31",
          "name": "Python",
          "category": "Languages"
        },
        "is_required": true,
        "weight": 1.5
      }
    ],
    "critical_skill_gaps": [
      {
        "skill": {
          "id": "a4b5c6d7-e8f9-4012-8345-6789abcdef01",
          "name": "Kubernetes",
          "category": "DevOps"
        },
        "is_required": true,
        "weight": 1.0
      }
    ],
    "bonus_competencies": [
      {
        "skill": {
          "id": "b5c6d7e8-f9a0-4123-9456-7890abcdef12",
          "name": "Redis",
          "category": "Databases"
        },
        "is_required": false,
        "weight": 0.8
      }
    ]
  }
}
```

---

#### `POST /jobs/{job_id}/apply`
Submits a job application for the authenticated candidate. The server evaluates the candidate's skills against job requirements at application time and writes the computed snapshot score into the database.

- **Access Level**: Candidate (`role: seeker`)
- **Response (`200 OK`)**:
```json
{
  "message": "Application submitted successfully",
  "data": {
    "id": "771e8400-e29b-41d4-a716-446655440099",
    "job_id": "550e8400-e29b-41d4-a716-446655440000",
    "candidate_id": "8f3b2e54-5b6d-4c3e-8f2a-1c3e4b5a6c7d",
    "match_score": 82.5,
    "status": "applied",
    "created_at": "2026-03-24T11:00:00Z"
  }
}
```

---

#### `GET /jobs/{job_id}/candidates`
Retrieves a ranked pipeline of all applicants for a job posting owned by the authenticated recruiter, ordered descending by `match_score`.

- **Access Level**: Recruiter (Must own the job posting)
- **Response (`200 OK`)**:
```json
[
  {
    "id": "771e8400-e29b-41d4-a716-446655440099",
    "job_id": "550e8400-e29b-41d4-a716-446655440000",
    "candidate_id": "8f3b2e54-5b6d-4c3e-8f2a-1c3e4b5a6c7d",
    "match_score": 82.5,
    "status": "applied",
    "created_at": "2026-03-24T11:00:00Z",
    "profiles": {
      "full_name": "Sarah Connor",
      "email": "sarah.dev@example.com",
      "headline": "Full-Stack Software Engineer",
      "resume_url": "https://example.com/resumes/sarah.pdf"
    }
  }
]
```

---

#### `PATCH /jobs/{job_id}/applications/{candidate_id}`
Updates the status of a specific applicant inside the recruiter's candidate pipeline.

- **Access Level**: Recruiter (Must own the job posting)
- **Request Body**:
```json
{
  "status": "shortlisted"
}
```
*(Valid status values: `"applied"`, `"reviewing"`, `"shortlisted"`, `"rejected"`)*

- **Response (`200 OK`)**:
```json
{
  "message": "Status updated successfully",
  "application": {
    "id": "771e8400-e29b-41d4-a716-446655440099",
    "job_id": "550e8400-e29b-41d4-a716-446655440000",
    "candidate_id": "8f3b2e54-5b6d-4c3e-8f2a-1c3e4b5a6c7d",
    "status": "shortlisted"
  }
}
```
