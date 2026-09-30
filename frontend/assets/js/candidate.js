/* ==========================================================================
   SkillBridge - Candidate Dashboard Logic (candidate.js)
   Feed filtering, Gap analysis modal, Skill management
   ========================================================================== */

let allJobsCache = [];
let currentJobId = null;

document.addEventListener('DOMContentLoaded', () => {
    window.Auth.protectRoute(['seeker']);
    
    // Set profile info
    const profile = window.Auth.getProfile();
    if (profile) {
        document.getElementById('profileName').textContent = profile.full_name || 'Candidate';
        document.getElementById('profileHeadline').textContent = profile.role === 'seeker' ? 'Verified Candidate' : 'Job Seeker';
        
        // Avatar initials
        const initials = (profile.full_name || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        document.getElementById('avatarInitials').textContent = initials;
    }

    // Initialize data
    loadJobFeed();
    loadMySkills();
    loadAllSkillsToDropdown();

    // Setup forms
    document.getElementById('addSkillForm').addEventListener('submit', handleAddSkill);
});

async function loadJobFeed() {
    const container = document.getElementById('jobFeedContainer');
    try {
        const jobs = await window.ApiClient.get('/jobs/feed');
        allJobsCache = jobs || [];
        
        document.getElementById('statJobsCount').textContent = allJobsCache.length;

        renderJobs(allJobsCache);
    } catch (error) {
        console.error("Failed to load jobs", error);
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <h4>Unable to Load Job Feed</h4>
                <p>${error.message || 'Make sure the backend API server is active.'}</p>
            </div>
        `;
    }
}

function filterJobs(query) {
    const q = (query || '').toLowerCase().trim();
    if (!q) {
        renderJobs(allJobsCache);
        return;
    }

    const filtered = allJobsCache.filter(j => 
        (j.title && j.title.toLowerCase().includes(q)) ||
        (j.company_name && j.company_name.toLowerCase().includes(q)) ||
        (j.location && j.location.toLowerCase().includes(q)) ||
        (j.description && j.description.toLowerCase().includes(q))
    );

    renderJobs(filtered);
}

function renderJobs(jobs) {
    const container = document.getElementById('jobFeedContainer');
    
    if (!jobs || jobs.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">💼</div>
                <h4>No Matching Positions Found</h4>
                <p>Try adjusting your search criteria or check back later for new company postings.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = jobs.map(job => `
        <div class="job-card">
            <div class="job-card-header">
                <div>
                    <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.25rem;">
                        ${job.title}
                    </h3>
                    <div class="job-meta-row">
                        <span class="meta-pill">🏢 ${job.company_name}</span>
                        <span class="meta-pill">📍 ${job.location}</span>
                        <span class="meta-pill">⏱️ ${job.employment_type}</span>
                    </div>
                </div>
                <button class="btn-primary" onclick="viewJobDetail('${job.id}')">
                    <span>Analyze & Match</span> →
                </button>
            </div>
            <p style="font-size: 0.925rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 0.85rem;">
                ${(job.description || '').substring(0, 180)}...
            </p>
        </div>
    `).join('');
}

async function viewJobDetail(jobId) {
    currentJobId = jobId;
    try {
        const jobDetail = await window.ApiClient.get(`/jobs/${jobId}`);
        const modal = document.getElementById('jobDetailModal');
        
        document.getElementById('modalJobTitle').textContent = jobDetail.title;
        document.getElementById('modalJobSubtitle').textContent = `${jobDetail.company_name} • ${jobDetail.location} • ${jobDetail.employment_type}`;
        
        const gapContainer = document.getElementById('gapAnalysisContent');
        if (window.MatchingUI) {
            window.MatchingUI.renderGapAnalysis(jobDetail.gap_analysis, gapContainer);
        }

        modal.style.display = 'flex';
    } catch (error) {
        window.Toast.error(error.message || "Failed to load job analysis.", "Error");
    }
}

async function applyForJob() {
    if (!currentJobId) return;
    
    const btn = document.getElementById('applyBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = 'Submitting...';
    btn.disabled = true;

    try {
        await window.ApiClient.post(`/jobs/${currentJobId}/apply`, {});
        window.Toast.success('Application submitted with verified score lock!', 'Success');
        document.getElementById('jobDetailModal').style.display = 'none';
        
        // Update applications container if on that tab
        loadMyApplications();
    } catch (error) {
        window.Toast.error(error.message || 'Failed to submit application.', 'Application Failed');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function loadAllSkillsToDropdown() {
    try {
        const skills = await window.ApiClient.get('/skills');
        const select = document.getElementById('skillSelect');
        if (!skills || skills.length === 0) {
            select.innerHTML = '<option value="">No skills found in database</option>';
            return;
        }
        select.innerHTML = '<option value="">Select competency to add...</option>' + 
            skills.map(s => `<option value="${s.id}">${s.name} (${s.category})</option>`).join('');
    } catch (error) {
        console.error("Failed to load skills taxonomy", error);
    }
}

async function loadMySkills() {
    try {
        const mySkills = await window.ApiClient.get('/users/me/skills');
        const container = document.getElementById('mySkillsContainer');
        const count = mySkills ? mySkills.length : 0;
        
        document.getElementById('sidebarSkillCount').textContent = count;
        document.getElementById('statSkillCount').textContent = count;
        document.getElementById('currentSkillsCountBadge').textContent = `${count} Skills Tagged`;

        if (!mySkills || mySkills.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="padding: 2rem 1rem; width: 100%;">
                    <div class="empty-state-icon">⚡</div>
                    <h4>No Competencies Tagged Yet</h4>
                    <p>Add technical skills using the form above to boost your candidate match scores.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = mySkills.map(ms => {
            const scoreDisplay = ms.quiz_score !== null && ms.quiz_score !== undefined 
                ? `<span style="color: var(--success); font-weight: 700; margin-left: 0.35rem;">✓ ${Math.round(ms.quiz_score)}%</span>`
                : '';
            
            return `
            <span class="badge badge-neutral" style="padding: 0.5rem 0.95rem; font-size: 0.85rem; border: 1px solid var(--border-subtle);">
                <strong>${ms.skill ? ms.skill.name : 'Skill'}</strong>
                <span style="font-weight: 500; color: var(--text-muted); margin-left: 0.35rem;">
                    • ${ms.proficiency_level} (${ms.years_experience}y)
                </span>
                ${scoreDisplay}
            </span>
            `;
        }).join('');
    } catch (error) {
        console.error("Failed to load user skills", error);
    }
}

// Basic mock questions for the demo
const mockQuestions = [
    { q: "What is the primary purpose of version control?", options: ["Track changes", "Compile code", "Deploy servers", "Write documentation"], ans: 0 },
    { q: "Which of the following is a NoSQL database?", options: ["PostgreSQL", "MySQL", "MongoDB", "Oracle"], ans: 2 },
    { q: "What does API stand for?", options: ["Application Programming Interface", "Advanced Protocol Integration", "Automated Process Interaction", "Application Process Integration"], ans: 0 }
];

let pendingSkillPayload = null;

async function handleAddSkill(e) {
    e.preventDefault();
    
    const skillSelect = document.getElementById('skillSelect');
    const skillName = skillSelect.options[skillSelect.selectedIndex].text;
    
    pendingSkillPayload = {
        skill_id: skillSelect.value,
        proficiency_level: document.getElementById('proficiency').value,
        years_experience: parseFloat(document.getElementById('yearsExp').value)
    };

    // Render Quiz
    document.getElementById('quizSubtitle').textContent = `Answer these questions to verify your competency in ${skillName}`;
    const container = document.getElementById('quizQuestionsContainer');
    
    container.innerHTML = mockQuestions.map((mq, qIdx) => `
        <div class="quiz-question-block" style="background: var(--bg-muted); padding: 1rem; border-radius: var(--radius-md);">
            <p style="font-weight: 600; margin-bottom: 0.75rem; color: var(--text-primary);">${qIdx + 1}. ${mq.q}</p>
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                ${mq.options.map((opt, oIdx) => `
                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.9rem;">
                        <input type="radio" name="q${qIdx}" value="${oIdx}">
                        ${opt}
                    </label>
                `).join('')}
            </div>
        </div>
    `).join('');
    
    document.getElementById('quizModal').style.display = 'flex';
}

async function submitQuiz() {
    if (!pendingSkillPayload) return;
    
    const btn = document.getElementById('submitQuizBtn');
    btn.innerHTML = 'Verifying...';
    btn.disabled = true;
    
    // Calculate Score
    let correct = 0;
    mockQuestions.forEach((mq, qIdx) => {
        const selected = document.querySelector(`input[name="q${qIdx}"]:checked`);
        if (selected && parseInt(selected.value) === mq.ans) {
            correct++;
        }
    });
    
    const scorePercentage = (correct / mockQuestions.length) * 100;
    pendingSkillPayload.quiz_score = scorePercentage;
    
    try {
        await window.ApiClient.post('/users/me/skills', pendingSkillPayload);
        window.Toast.success(`Skill verified! You scored ${Math.round(scorePercentage)}% on the assessment.`, 'Competency Saved');
        
        document.getElementById('quizModal').style.display = 'none';
        await loadMySkills();
        
        document.getElementById('addSkillForm').reset();
        document.getElementById('yearsExp').value = "2";
    } catch (error) {
        window.Toast.error(error.message || "Failed to add skill.", "Error");
    } finally {
        btn.innerHTML = 'Submit Answers & Add Skill';
        btn.disabled = false;
        pendingSkillPayload = null;
    }
}

async function loadMyApplications() {
    // Optional application tracking helper
}
