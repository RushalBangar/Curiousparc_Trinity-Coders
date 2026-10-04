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
    loadMyApplications();

    // Setup forms
    document.getElementById('addSkillForm').addEventListener('submit', handleAddSkill);

    // Modal Accessibility
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (typeof closeJobModal === 'function') closeJobModal();
            if (typeof closeQuizModal === 'function') closeQuizModal();
        }
    });

    window.addEventListener('click', (e) => {
        const jobModal = document.getElementById('jobDetailModal');
        const quizModal = document.getElementById('quizModal');
        if (e.target === jobModal) closeJobModal();
        if (e.target === quizModal) closeQuizModal();
    });
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
                        ${escapeHTML(job.title)}
                    </h3>
                    <div class="job-meta-row">
                        <span class="meta-pill">🏢 ${escapeHTML(job.company_name)}</span>
                        <span class="meta-pill">📍 ${escapeHTML(job.location)}</span>
                        <span class="meta-pill">⏱️ ${escapeHTML(job.employment_type)}</span>
                    </div>
                </div>
                <button class="btn-primary" onclick="viewJobDetail('${job.id}')">
                    <span>Analyze & Match</span> →
                </button>
            </div>
            <p style="font-size: 0.925rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 0.85rem;">
                ${escapeHTML(job.description || '').substring(0, 180)}...
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

        const commitmentSection = document.getElementById('learningCommitmentSection');
        const commitmentText = document.getElementById('learningCommitmentText');
        if (commitmentSection && commitmentText) {
            commitmentText.value = '';
            if (jobDetail.gap_analysis && jobDetail.gap_analysis.critical_skill_gaps && jobDetail.gap_analysis.critical_skill_gaps.length > 0) {
                commitmentSection.style.display = 'block';
            } else {
                commitmentSection.style.display = 'none';
            }
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

    const commitmentText = document.getElementById('learningCommitmentText');
    const payload = {};
    if (commitmentText && commitmentText.value.trim() !== '' && document.getElementById('learningCommitmentSection').style.display !== 'none') {
        payload.learning_commitment = commitmentText.value.trim();
    }

    try {
        await window.ApiClient.post(`/jobs/${currentJobId}/apply`, payload);
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
            const skillName = ms.skill ? ms.skill.name : 'Skill';
            const safeSkillName = window.escapeHTML(skillName);
            const jsSafeSkillName = skillName.replace(/'/g, "\\'").replace(/"/g, "&quot;");
            const scoreDisplay = ms.quiz_score !== null && ms.quiz_score !== undefined 
                ? `<span style="color: var(--success); font-weight: 700; margin-left: 0.35rem;" title="Verified Assessment Score">✓ ${Math.round(ms.quiz_score)}%</span>`
                : `<button type="button" class="btn-ghost" style="padding: 0.15rem 0.45rem; font-size: 0.75rem; margin-left: 0.4rem; border: 1px solid var(--primary-400); color: var(--primary-600); border-radius: var(--radius-sm);" onclick="startDirectSkillQuiz('${ms.skill_id}', '${jsSafeSkillName}', '${ms.proficiency_level}', ${ms.years_experience})">Verify</button>`;
            
            return `
            <span class="badge badge-neutral" style="padding: 0.5rem 0.95rem; font-size: 0.85rem; border: 1px solid var(--border-subtle); display: inline-flex; align-items: center;">
                <strong>${safeSkillName}</strong>
                <span style="font-weight: 500; color: var(--text-muted); margin-left: 0.35rem;">
                    • ${ms.proficiency_level} (${ms.years_experience}y)
                </span>
                ${scoreDisplay}
                <button type="button" onclick="removeSkill('${ms.skill_id}')" style="background: none; border: none; margin-left: 0.5rem; cursor: pointer; color: var(--text-muted); font-weight: bold; font-size: 1rem;" title="Remove Skill">×</button>
            </span>
            `;
        }).join('');
    } catch (error) {
        console.error("Failed to load user skills", error);
    }
}

async function removeSkill(skillId) {
    if (!confirm("Are you sure you want to remove this verified skill from your profile?")) return;
    
    try {
        await window.ApiClient.delete(`/users/me/skills/${skillId}`);
        window.Toast.success("Skill removed from your profile.");
        await loadMySkills();
    } catch (error) {
        window.Toast.error(error.message || "Failed to remove skill.", "Error");
    }
}

// ==========================================================================
// Advanced AI Proctored Assessment Engine
// ==========================================================================
let pendingSkillPayload = null;

let currentQuiz = {
    skillName: '',
    questions: [],
    currentIndex: 0,
    answers: {},
    timer: null,
    timeRemaining: 600, // 10 minutes for 10 questions
    isSubmitted: false
};

/**
 * Initiates assessment directly from an existing profile skill tag
 */
function startDirectSkillQuiz(skillId, skillName, proficiencyLevel, yearsExp) {
    pendingSkillPayload = {
        skill_id: skillId,
        proficiency_level: proficiencyLevel,
        years_experience: parseFloat(yearsExp)
    };
    prepareQuizPreCheck(skillName);
}

/**
 * Handles "Add to Profile" submission from the form
 */
async function handleAddSkill(e) {
    e.preventDefault();
    
    const skillSelect = document.getElementById('skillSelect');
    const skillName = skillSelect.options[skillSelect.selectedIndex].text;
    
    pendingSkillPayload = {
        skill_id: skillSelect.value,
        proficiency_level: document.getElementById('proficiency').value,
        years_experience: parseFloat(document.getElementById('yearsExp').value)
    };

    prepareQuizPreCheck(skillName);
}

/**
 * Sets up Pre-Check screen and preloads AI proctoring model in background
 */
function prepareQuizPreCheck(skillName) {
    currentQuiz.skillName = skillName;

    // Reset views
    document.getElementById('quizPreCheckView').style.display = 'block';
    document.getElementById('quizActiveView').style.display = 'none';
    document.getElementById('quizResultsView').style.display = 'none';
    document.getElementById('quizViolationBanner').style.display = 'none';

    document.getElementById('preCheckSkillBadge').textContent = `${skillName} Assessment`;
    document.getElementById('proctorConsentCheck').checked = false;
    document.getElementById('preCheckStatus').textContent = "Camera permission & identity verification required before questions are unlocked.";
    document.getElementById('startProctorQuizBtn').disabled = false;
    document.getElementById('startProctorQuizBtn').innerHTML = "<span>🎥 Enable Camera & Start Assessment</span>";

    // Asynchronously begin preloading detection model so it is warm
    if (window.QuizProctor && window.QuizProctor.loadDetectionModel) {
        window.QuizProctor.loadDetectionModel().catch(e => console.warn("Model pre-load note:", e));
    }

    document.getElementById('quizModal').style.display = 'flex';
}

/**
 * Starts camera, verifies identity, locks tab, and renders Question 1
 */
async function initiateProctoredExam() {
    const consent = document.getElementById('proctorConsentCheck');
    if (!consent || !consent.checked) {
        alert("Please check the agreement box acknowledging the proctoring security rules and camera requirement.");
        return;
    }

    const startBtn = document.getElementById('startProctorQuizBtn');
    startBtn.disabled = true;
    startBtn.innerHTML = "<span>⏳ Connecting Camera & Arming AI Shield...</span>";

    try {
        const videoEl = document.getElementById('proctorVideo');
        const canvasEl = document.getElementById('proctorCanvas');
        const profile = window.Auth.getProfile();
        const userEmail = (profile && profile.email) || "candidate@skillbridge.io";

        // Start live camera and anti-cheat proctoring
        await window.QuizProctor.startSession({
            videoElement: videoEl,
            canvasElement: canvasEl,
            candidateEmail: userEmail,
            onViolation: handleProctorViolation,
            onStatusUpdate: (msg, level) => {
                const badge = document.getElementById('proctorShieldStatus');
                if (badge) {
                    badge.textContent = `AI Shield: ${msg}`;
                    badge.className = `badge badge-${level === 'danger' ? 'red' : level === 'warning' ? 'yellow' : 'green'}`;
                }
            }
        });

        // Fetch 10 randomized technical questions for this skill
        const questions = window.QuizBank.getSkillQuizQuestions(currentQuiz.skillName, 10);
        currentQuiz.questions = questions;
        currentQuiz.currentIndex = 0;
        currentQuiz.answers = {};
        currentQuiz.timeRemaining = 600; // 10 minutes
        currentQuiz.isSubmitted = false;

        // Configure anti-lens dynamic watermark
        const wmText = `SKILLBRIDGE SECURE PROCTOR • ${userEmail.toUpperCase()} • DO NOT PHOTOGRAPH • `;
        document.getElementById('quizWatermarkText').textContent = wmText;
        document.getElementById('quizActiveSkillBadge').textContent = currentQuiz.skillName;

        // Switch to active exam view
        document.getElementById('quizPreCheckView').style.display = 'none';
        document.getElementById('quizActiveView').style.display = 'block';

        // Render Question 1 and question palette
        renderCurrentQuestion();
        renderQuizPalette();
        startQuizTimer();

    } catch (error) {
        console.error("Failed to start proctored assessment:", error);
        alert(error.message || "Failed to start camera or initialize proctoring. Please ensure camera permissions are allowed.");
        startBtn.disabled = false;
        startBtn.innerHTML = "<span>🎥 Enable Camera & Start Assessment</span>";
    }
}

/**
 * Renders the currently selected question
 */
function renderCurrentQuestion() {
    const q = currentQuiz.questions[currentQuiz.currentIndex];
    if (!q) return;

    // Counter & Progress
    const total = currentQuiz.questions.length;
    document.getElementById('questionCounterTitle').textContent = `Question ${currentQuiz.currentIndex + 1} of ${total}`;
    const percent = ((currentQuiz.currentIndex + 1) / total) * 100;
    document.getElementById('quizProgressFill').style.width = `${percent}%`;

    // Question Text
    document.getElementById('currentQuestionText').textContent = `${currentQuiz.currentIndex + 1}. ${q.q}`;

    // Options List
    const optionsContainer = document.getElementById('currentOptionsList');
    const selectedAns = currentQuiz.answers[currentQuiz.currentIndex];

    optionsContainer.innerHTML = q.options.map((opt, oIdx) => {
        const isChecked = selectedAns === oIdx;
        return `
            <div class="quiz-option-card ${isChecked ? 'selected' : ''}" onclick="selectOption(${oIdx})">
                <input type="radio" name="activeQuizOption" value="${oIdx}" class="quiz-option-radio" ${isChecked ? 'checked' : ''} onchange="selectOption(${oIdx})">
                <span style="line-height: 1.4;">${opt}</span>
            </div>
        `;
    }).join('');

    // Previous / Next Buttons
    const prevBtn = document.getElementById('prevQuestionBtn');
    const nextBtn = document.getElementById('nextQuestionBtn');
    prevBtn.disabled = currentQuiz.currentIndex === 0;
    
    if (currentQuiz.currentIndex === total - 1) {
        nextBtn.textContent = "Review & Submit";
        nextBtn.onclick = confirmAndSubmitQuiz;
    } else {
        nextBtn.textContent = "Next →";
        nextBtn.onclick = () => navQuestion(1);
    }

    // Update Palette active state
    updatePaletteActiveState();
}

/**
 * Renders the 10 question selector buttons (1..10)
 */
function renderQuizPalette() {
    const container = document.getElementById('quizPaletteContainer');
    container.innerHTML = currentQuiz.questions.map((q, idx) => `
        <button type="button" class="quiz-palette-btn ${idx === currentQuiz.currentIndex ? 'active' : ''} ${currentQuiz.answers[idx] !== undefined ? 'answered' : ''}" id="paletteBtn_${idx}" onclick="goToQuestion(${idx})">
            ${idx + 1}
        </button>
    `).join('');
}

function updatePaletteActiveState() {
    currentQuiz.questions.forEach((q, idx) => {
        const btn = document.getElementById(`paletteBtn_${idx}`);
        if (btn) {
            btn.classList.toggle('active', idx === currentQuiz.currentIndex);
            btn.classList.toggle('answered', currentQuiz.answers[idx] !== undefined);
        }
    });
}

function selectOption(optIndex) {
    if (currentQuiz.isSubmitted) return;
    currentQuiz.answers[currentQuiz.currentIndex] = optIndex;
    renderCurrentQuestion();
    updatePaletteActiveState();
}

function navQuestion(delta) {
    const newIdx = currentQuiz.currentIndex + delta;
    if (newIdx >= 0 && newIdx < currentQuiz.questions.length) {
        currentQuiz.currentIndex = newIdx;
        renderCurrentQuestion();
    }
}

function goToQuestion(idx) {
    if (idx >= 0 && idx < currentQuiz.questions.length) {
        currentQuiz.currentIndex = idx;
        renderCurrentQuestion();
    }
}

/**
 * Starts 10-minute exam countdown timer
 */
function startQuizTimer() {
    if (currentQuiz.timer) clearInterval(currentQuiz.timer);

    const timerText = document.getElementById('quizTimerText');
    const timerDisplay = document.getElementById('quizTimerDisplay');

    const updateTimer = () => {
        if (currentQuiz.timeRemaining <= 0) {
            clearInterval(currentQuiz.timer);
            alert("Time limit reached! Your assessment will now be automatically submitted.");
            submitQuiz(false);
            return;
        }

        currentQuiz.timeRemaining--;
        const mins = Math.floor(currentQuiz.timeRemaining / 60);
        const secs = currentQuiz.timeRemaining % 60;
        timerText.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        if (currentQuiz.timeRemaining < 120) {
            timerDisplay.classList.add('urgent');
        } else {
            timerDisplay.classList.remove('urgent');
        }
    };

    updateTimer();
    currentQuiz.timer = setInterval(updateTimer, 1000);
}

/**
 * Handles immediate proctoring security violation (e.g. Smartphone detected, Tab switch)
 */
function handleProctorViolation(details) {
    if (currentQuiz.isSubmitted) return;

    // Freeze exam
    currentQuiz.isSubmitted = true;
    if (currentQuiz.timer) clearInterval(currentQuiz.timer);

    // Show Alarm Banner
    const banner = document.getElementById('quizViolationBanner');
    document.getElementById('violationTitle').textContent = `🚨 ${details.title || 'SECURITY VIOLATION'}`;
    document.getElementById('violationMessage').textContent = details.message;
    banner.style.display = 'block';

    // Disable all options and buttons
    document.querySelectorAll('.quiz-option-card').forEach(c => c.style.pointerEvents = 'none');
    document.getElementById('prevQuestionBtn').disabled = true;
    document.getElementById('nextQuestionBtn').disabled = true;
    document.getElementById('submitQuizBtn').disabled = true;

    // Automatically submit with 0% score after brief alarm delay
    setTimeout(() => {
        submitQuiz(true, details.message);
    }, 1200);
}

function toggleTestSecurityMenu() {
    const menu = document.getElementById('testSecurityMenu');
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

/**
 * Prompts confirmation if questions remain unanswered, then submits
 */
function confirmAndSubmitQuiz() {
    const answeredCount = Object.keys(currentQuiz.answers).length;
    const total = currentQuiz.questions.length;
    
    if (answeredCount < total) {
        const proceed = confirm(`You have answered ${answeredCount} of ${total} questions. Are you sure you want to finish and submit now?`);
        if (!proceed) return;
    }

    submitQuiz(false);
}

/**
 * Finalizes assessment, calculates score, shuts down camera, and updates profile
 */
async function submitQuiz(isViolation = false, violationReason = "") {
    if (currentQuiz.timer) clearInterval(currentQuiz.timer);
    
    // Stop live proctoring & camera immediately
    if (window.QuizProctor) {
        window.QuizProctor.stopSession();
    }

    let scorePercentage = 0;

    if (isViolation) {
        scorePercentage = 0; // Immediate failure on security violation
    } else {
        let correct = 0;
        currentQuiz.questions.forEach((q, idx) => {
            if (currentQuiz.answers[idx] !== undefined && currentQuiz.answers[idx] === q.ans) {
                correct++;
            }
        });
        scorePercentage = (correct / currentQuiz.questions.length) * 100;
    }

    if (pendingSkillPayload) {
        pendingSkillPayload.quiz_score = scorePercentage;
        
        try {
            await window.ApiClient.post('/users/me/skills', pendingSkillPayload);
            if (isViolation) {
                window.Toast.error(`Assessment terminated: ${violationReason}`, "Proctoring Violation");
            } else {
                window.Toast.success(`Assessment verified! You scored ${Math.round(scorePercentage)}% in ${currentQuiz.skillName}.`, 'Competency Saved');
            }
            await loadMySkills();
        } catch (error) {
            console.error("Failed to register score", error);
            window.Toast.error(error.message || "Failed to save verified skill score.", "Error");
        }
    }

    // Display Results View
    document.getElementById('quizPreCheckView').style.display = 'none';
    document.getElementById('quizActiveView').style.display = 'none';
    const resultsView = document.getElementById('quizResultsView');
    resultsView.style.display = 'block';

    const resultsIcon = document.getElementById('resultsIcon');
    const resultsTitle = document.getElementById('resultsTitle');
    const resultsSubtitle = document.getElementById('resultsSubtitle');
    const resultsScore = document.getElementById('resultsScorePercentage');
    const resultsFeedback = document.getElementById('resultsFeedback');

    if (isViolation) {
        resultsIcon.textContent = "🚨";
        resultsTitle.textContent = "Assessment Terminated";
        resultsTitle.style.color = "#ef4444";
        resultsSubtitle.textContent = "Auto-submitted due to proctoring security violation";
        resultsScore.textContent = "0%";
        resultsScore.style.color = "#ef4444";
        resultsFeedback.innerHTML = `<strong>Violation Reason:</strong> ${violationReason}<br><br>The proctoring system detected an unauthorized device or activity. A 0% verification score was registered. You may retake the assessment adhering to integrity protocols.`;
    } else {
        resultsIcon.textContent = scorePercentage >= 70 ? "🏆" : "📊";
        resultsTitle.textContent = scorePercentage >= 70 ? "Competency Verified!" : "Assessment Completed";
        resultsTitle.style.color = "var(--text-primary)";
        resultsSubtitle.textContent = `10-question evaluation for ${currentQuiz.skillName}`;
        resultsScore.textContent = `${Math.round(scorePercentage)}%`;
        resultsScore.style.color = scorePercentage >= 70 ? "var(--success)" : "var(--primary-600)";
        resultsFeedback.innerHTML = `You answered <strong>${Math.round((scorePercentage / 100) * currentQuiz.questions.length)} of ${currentQuiz.questions.length}</strong> questions correctly.<br>This verified quiz multiplier is now factored directly into your dual-tier job matching algorithms!`;
    }
}

/**
 * Closes modal and resets state cleanly
 */
function closeQuizModal() {
    if (window.QuizProctor) {
        window.QuizProctor.stopSession();
    }
    if (currentQuiz.timer) {
        clearInterval(currentQuiz.timer);
    }
    document.getElementById('quizModal').style.display = 'none';
    pendingSkillPayload = null;
    currentQuiz.isSubmitted = false;
}

function closeQuizModalAndRefresh() {
    closeQuizModal();
    const form = document.getElementById('addSkillForm');
    if (form) form.reset();
    const yearsExp = document.getElementById('yearsExp');
    if (yearsExp) yearsExp.value = "2";
}

async function loadMyApplications() {
    try {
        const apps = await window.ApiClient.get('/users/me/applications');
        const container = document.getElementById('applicationsContainer');
        
        if (!apps || apps.length === 0) {
            document.getElementById('statAvgScore').textContent = '--%';
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <h4>No Applications Yet</h4>
                    <p>Explore recommended jobs in your feed and apply with your real-time compatibility score.</p>
                    <button class="btn-secondary" onclick="showTab('jobs')">Browse Recommended Jobs</button>
                </div>
            `;
            return;
        }

        let totalMatch = 0;
        apps.forEach(app => {
            totalMatch += app.match_score || 0;
        });
        const avgMatch = Math.round(totalMatch / apps.length);
        document.getElementById('statAvgScore').textContent = `${avgMatch}%`;

        container.innerHTML = apps.map(app => `
            <div class="job-card">
                <div class="job-card-header">
                    <div>
                        <h3 class="job-title">${app.jobs ? escapeHTML(app.jobs.title) : 'Job'}</h3>
                        <div class="job-meta">
                            <span>🏢 ${app.jobs ? escapeHTML(app.jobs.company_name) : ''}</span>
                            <span>📍 ${app.jobs ? escapeHTML(app.jobs.location) : ''}</span>
                        </div>
                    </div>
                    <span class="badge badge-neutral" style="text-transform: capitalize; font-size: 0.9rem;">${app.status || 'Applied'}</span>
                </div>
                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-size: 0.85rem; color: var(--text-muted);">
                        Applied on ${new Date(app.created_at).toLocaleDateString()}
                    </div>
                    <div class="badge badge-purple" style="font-weight: 600;">
                        ${Math.round((app.match_score || 0) * 10) / 10}% Score Locked
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error("Failed to load applications", error);
    }
}

async function handleResumeUpload(event) {
    const fileInput = event.target;
    if (!fileInput.files || fileInput.files.length === 0) return;
    
    const file = fileInput.files[0];
    if (file.type !== 'application/pdf') {
        window.Toast.error("Only PDF files are supported.");
        return;
    }
    
    const statusText = document.getElementById('resumeUploadStatus');
    statusText.textContent = `Parsing ${file.name}...`;
    statusText.style.color = 'var(--primary-600)';
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch(`${API_BASE_URL}/resumes/parse`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.detail || "Failed to parse resume");
        }
        
        statusText.textContent = `Extracted ${data.extracted_skills.length} skills!`;
        statusText.style.color = 'var(--success)';
        
        if (data.extracted_skills && data.extracted_skills.length > 0) {
            // Auto-add skills to the user's profile
            let addedCount = 0;
            for (const skill of data.extracted_skills) {
                try {
                    await window.ApiClient.post('/users/me/skills', {
                        skill_id: skill.id,
                        proficiency_level: 'intermediate',
                        years_experience: 1.0
                    });
                    addedCount++;
                } catch (e) {
                    // Might already exist
                }
            }
            window.Toast.success(`Successfully extracted and added ${addedCount} new skills from your resume!`);
            await loadMySkills();
        } else {
            window.Toast.info("No matching technical skills found in your resume.");
        }
    } catch (error) {
        console.error("Resume parsing error:", error);
        window.Toast.error(error.message);
        statusText.textContent = "Upload failed";
        statusText.style.color = 'var(--danger)';
    } finally {
        fileInput.value = '';
    }
}
