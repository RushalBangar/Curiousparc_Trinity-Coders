# SkillBridge — Local Setup & Deployment Guide

This guide walks you through setting up the complete **SkillBridge** development environment locally, configuring Supabase, running the backend FastAPI service, and serving the frontend client.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Step 1: Clone the Repository](#step-1-clone-the-repository)
- [Step 2: Supabase Database Configuration](#step-2-supabase-database-configuration)
- [Step 3: Backend Setup & Python Environment](#step-3-backend-setup--python-environment)
- [Step 4: Database Seeding](#step-4-database-seeding)
- [Step 5: Frontend Client Setup](#step-5-frontend-client-setup)
- [Step 6: Running Tests](#step-6-running-tests)
- [Production Deployment](#production-deployment)
  - [Deploying Backend to Render](#deploying-backend-to-render)
  - [Deploying Frontend to Vercel / GitHub Pages](#deploying-frontend-to-vercel--github-pages)
- [Troubleshooting & FAQ](#troubleshooting--faq)

---

## Prerequisites

Before starting, ensure you have the following installed on your workstation:

- **Python**: Version 3.10 or higher (`python --version`)
- **Git**: Installed and configured
- **Web Browser**: Modern browser (Chrome, Firefox, Safari, Edge)
- **Supabase Account**: Free tier available at [supabase.com](https://supabase.com)
- **Local HTTP Server** *(optional)*: Python `http.server`, Node `npx serve`, or VS Code Live Server extension

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/RushalBangar/Curiousparc_Trinity-Coders.git skillbridge
cd skillbridge
```

---

## Step 2: Supabase Database Configuration

1. Log into your [Supabase Dashboard](https://app.supabase.com) and create a **New Project**.
2. Note your **Project URL** and **anon public API Key** under **Project Settings $\rightarrow$ API**.
3. Navigate to the **SQL Editor** tab in your Supabase project dashboard.
4. Open [`docs/schema.sql`](file:///d:/Web/SkillBridge/docs/schema.sql) from this repository, paste the entire SQL content into the editor, and click **Run**.
   - This creates all 6 core tables (`profiles`, `skills`, `candidate_skills`, `jobs`, `job_skills`, `applications`) with foreign key constraints, primary keys, and Row Level Security enabled.
5. *(Optional Google OAuth)*: Under **Authentication $\rightarrow$ Providers $\rightarrow$ Google**, enable Google sign-in and configure your Google Cloud Console Client ID and Client Secret. Add your redirect URI (e.g. `http://localhost:5500/auth-callback.html` or `http://127.0.0.1:8080/auth-callback.html`).

---

## Step 3: Backend Setup & Python Environment

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Create your `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

5. Open `backend/.env` and supply your actual Supabase credentials:
   ```env
   # Supabase Configuration
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_KEY=your-supabase-anon-key

   # Optional: Service Role Key for administrative tasks
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

   # JWT secret (from Supabase Project Settings -> API -> JWT Settings)
   JWT_SECRET=your-supabase-jwt-secret
   ```

6. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

7. Verify the API is running:
   - Open your browser to `http://localhost:8000/` $\rightarrow$ should return `{"message": "Welcome to the SkillBridge API"}`.
   - Access the interactive OpenAPI Swagger docs at `http://localhost:8000/docs`.

---

## Step 4: Database Seeding

To quickly populate the skills taxonomy and create sample job postings:

1. Register at least one user account through the frontend or via `POST /api/v1/auth/signup` to ensure a profile exists.
2. From the root directory with the virtual environment activated, run:
   ```bash
   python backend/seed_db.py
   ```
3. This seeds standard technical competencies (Python, React, FastAPI, Docker, Kubernetes, etc.) and sample employer postings.

---

## Step 5: Frontend Client Setup

The frontend is built using standard Vanilla HTML5, CSS3, and ES6+ JavaScript, requiring no bundlers (no webpack or vite setup required!).

### Running with Python HTTP Server:
From the root repository directory:
```bash
python -m http.server 5500 --directory frontend
```
Open `http://localhost:5500` in your web browser.

### Running with VS Code Live Server:
1. Open the project in VS Code.
2. Right-click on `frontend/index.html`.
3. Select **"Open with Live Server"**.

### API URL Resolution:
The frontend client automatically detects when it is running on `localhost` or `127.0.0.1` and points API requests to `http://localhost:8000/api/v1`. When hosted on a remote domain, it seamlessly falls back to the production API URL.

---

## Step 6: Running Tests

The matching algorithm includes an automated unit test suite covering full matches, partial matches, zero matches, and edge conditions:

```bash
pytest backend/tests/test_matcher.py -v
```

---

## Production Deployment

### Deploying Backend to Render

1. Create a **New Web Service** on [Render.com](https://render.com).
2. Connect your GitHub repository (`RushalBangar/Curiousparc_Trinity-Coders`).
3. Set the following build and run options:
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add the following **Environment Variables** in the Render dashboard:
   - `SUPABASE_URL` = `<your-supabase-url>`
   - `SUPABASE_KEY` = `<your-supabase-anon-key>`
   - `JWT_SECRET` = `<your-supabase-jwt-secret>`

### Deploying Frontend to Vercel / GitHub Pages

The `frontend/` directory contains pure static assets:
1. **GitHub Pages**:
   - In your repository settings $\rightarrow$ Pages $\rightarrow$ Deploy from a branch $\rightarrow$ specify root or `/frontend` folder.
2. **Vercel / Netlify**:
   - Set the publish/output directory to `frontend`.
   - Set redirect rules if necessary to route 404s to `index.html`.

---

## Troubleshooting & FAQ

### 1. CORS Errors in Browser Console
- Ensure the FastAPI server in `app/main.py` has `CORSMiddleware` configured. In development, `allow_origins=["*"]` allows requests from any local port (`5500`, `3000`, `8080`).

### 2. "Profile not found" on Google OAuth login
- If users authenticate via Google, ensure the callback triggers `POST /api/v1/users/me/init-profile` to create the profile entry if it doesn't already exist.

### 3. Missing `SUPABASE_URL` error
- Check that `backend/.env` is located in the working directory from which you launch `uvicorn`, or verify that `python-dotenv` loads from the expected path.
