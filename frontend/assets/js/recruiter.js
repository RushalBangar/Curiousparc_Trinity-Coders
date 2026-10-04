/* ==========================================================================
   SkillBridge - Recruiter Dashboard Logic (recruiter.js)
   Posting management, draft skill builder, candidate ranking pipeline
   ========================================================================== */

let draftSkills = [];
let allSkillsMap = {};
let activeRequirementLevel = 'mandatory';

/* ─── GLOBAL ONCLICK HANDLERS ─── */
window.setRequirementLevel = function(level) {
    activeRequirementLevel = level;
    const tabM = document.getElementById('tab-mandatory');
    const tabP = document.getElementById('tab-preferred');
    const activeClass = 'flex-1 py-2 px-3 rounded-lg font-label-sm text-label-sm font-bold bg-surface-container-lowest text-primary shadow-sm flex items-center justify-center gap-1.5 transition-all';
    const inactiveClass = 'flex-1 py-2 px-3 rounded-lg font-label-sm text-label-sm font-semibold text-on-surface-variant hover:text-on-surface flex items-center justify-center gap-1.5 transition-all';

    tabM.className = level === 'mandatory' ? activeClass : inactiveClass;
    tabP.className = level === 'preferred' ? activeClass : inactiveClass;
};

window.addCompetencyChip = function() {
    const select = document.getElementById('jobSkillSelect');
    if (!select.value) {
        showToast('Please select a competency from the dropdown.', 'info');
        return;
    }
    if (draftSkills.some(s => s.skill_id === select.value)) {
        showToast('Competency already added to draft.', 'warning');
        return;
    }
    const isReq = activeRequirementLevel === 'mandatory';
    draftSkills.push({ skill_id: select.value, is_required: isReq, weight: isReq ? 2.0 : 1.0 });
    renderDraftSkills();
    showToast(`Added ${allSkillsMap[select.value]}`, 'success');
    select.value = '';
};

window.removeDraftSkill = function(id) {
    draftSkills = draftSkills.filter(s => s.skill_id !== id);
    renderDraftSkills();
};

/* ─── TOAST SYSTEM (lightweight, no dependency) ─── */
function showToast(message, type = 'info') {
    // Use window.Toast if available (from auth.js), fallback to inline
    if (window.Toast) {
        if (type === 'success') window.Toast.success(message, 'Success');
        else if (type === 'error') window.Toast.error(message, 'Error');
        else if (type === 'warning') window.Toast.warning(message, 'Notice');
        else window.Toast.info(message, 'Notice');
        return;
    }
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const colors = {
        success: 'bg-tertiary-fixed text-on-tertiary-fixed',
        error: 'bg-error-container text-on-error-container',
        warning: 'bg-secondary-fixed text-on-secondary-fixed',
        info: 'bg-surface-container-high text-on-surface'
    };
    const icons = { success: 'check_circle', error: 'error', warning: 'warning', info: 'info' };
    const toast = document.createElement('div');
    toast.className = `toast-item flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg font-label-sm text-label-sm ${colors[type] || colors.info}`;
    toast.innerHTML = `<span class="material-symbols-outlined text-[16px]">${icons[type] || 'info'}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 3500);
}

/* ─── INIT ─── */
document.addEventListener('DOMContentLoaded', () => {
    window.Auth.protectRoute(['recruiter']);

    const profile = window.Auth.getProfile();
    if (profile) {
        const name = profile.full_name || 'Recruiter';
        document.getElementById('profileName').textContent = name;
        document.getElementById('profileGreeting').textContent = 'Welcome back, ' + name;
        document.getElementById('profileHeadline').textContent = profile.headline || 'Talent Acquisition';

        const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        document.getElementById('avatarInitials').textContent = initials;
        const bigAvatar = document.getElementById('avatarInitialsBig');
        if (bigAvatar) bigAvatar.textContent = initials;
    }

    loadRecruiterJobs();
    loadAllSkillsToDropdown();
    document.getElementById('postJobForm').addEventListener('submit', handlePostJob);
});

/* ─── JOB ICON PICKER ─── */
function getJobIcon(title) {
    const t = (title || '').toLowerCase();
    if (t.includes('backend') || t.includes('full-stack') || t.includes('engineer')) return 'terminal';
    if (t.includes('cloud') || t.includes('infra') || t.includes('devops')) return 'cloud';
    if (t.includes('ui') || t.includes('frontend') || t.includes('design')) return 'design_services';
    if (t.includes('data') || t.includes('ml') || t.includes('ai')) return 'analytics';
    if (t.includes('mobile') || t.includes('ios') || t.includes('android')) return 'phone_iphone';
    if (t.includes('security') || t.includes('cyber')) return 'security';
    if (t.includes('lead') || t.includes('manager') || t.includes('director')) return 'supervisor_account';
    return 'work';
}

function getJobIconColor(title) {
    const t = (title || '').toLowerCase();
    if (t.includes('cloud') || t.includes('infra')) return 'bg-tertiary/8 text-tertiary';
    if (t.includes('ui') || t.includes('design')) return 'bg-surface-tint/8 text-surface-tint';
    if (t.includes('data') || t.includes('ml')) return 'bg-secondary/10 text-secondary';
    return 'bg-primary/8 text-primary';
}

/* ─── LOAD RECRUITER JOBS ─── */
async function loadRecruiterJobs() {
    const container = document.getElementById('recruiterJobsContainer');
    try {
        const myJobs = await window.ApiClient.get('/jobs/my-jobs');

        document.getElementById('managedRolesCount').textContent = myJobs.length;
        document.getElementById('statTotalJobs').textContent = myJobs.length + ' Published';
        document.getElementById('statTotalApplicants').textContent = 'Active';

        if (myJobs.length === 0) {
            container.innerHTML = `
                <div class="p-10 rounded-2xl bg-surface-container-lowest shadow-sm flex flex-col items-center justify-center gap-4 text-center">
                    <div class="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center text-on-surface-variant">
                        <span class="material-symbols-outlined text-[32px]">inbox</span>
                    </div>
                    <div>
                        <h4 class="font-headline-sm text-headline-sm text-on-surface font-bold">No Roles Published Yet</h4>
                        <p class="font-body-md text-body-md text-on-surface-variant max-w-sm mt-1">Create your first job posting to start receiving ranked applicants.</p>
                    </div>
                    <button class="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-semibold shadow-md hover:shadow-lg transition-all" onclick="switchTab('publish')">+ Create First Job</button>
                </div>`;
            return;
        }

        container.innerHTML = myJobs.map(job => {
            const reqSkills = (job.skills || []).filter(s => s.is_required).map(s => s.skill ? s.skill.name : 'Unknown');
            const prefSkills = (job.skills || []).filter(s => !s.is_required).map(s => s.skill ? s.skill.name : 'Unknown');
            const icon = getJobIcon(job.title);
            const iconColor = getJobIconColor(job.title);

            const reqPills = reqSkills.length > 0
                ? reqSkills.map(s => `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-lowest border border-primary/10 font-label-sm text-[11px] text-on-surface shadow-sm"><span class="w-1.5 h-1.5 rounded-full bg-primary"></span>${escapeHTML(s)}<span class="font-bold text-primary ml-0.5">75%</span></span>`).join('')
                : '<span class="text-[11px] text-on-surface-variant italic">None</span>';

            const prefPills = prefSkills.length > 0
                ? prefSkills.map(s => `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-lowest border border-outline-variant/15 font-label-sm text-[11px] text-on-surface shadow-sm"><span class="w-1.5 h-1.5 rounded-full bg-secondary"></span>${escapeHTML(s)}<span class="font-semibold text-on-surface-variant ml-0.5">25%</span></span>`).join('')
                : '<span class="text-[11px] text-on-surface-variant italic">None</span>';

            return `
            <div class="p-5 rounded-2xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-all flex flex-col gap-4 group">
                <!-- Top Row: Icon + Title + CTA -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div class="flex items-start gap-3 min-w-0">
                        <div class="w-11 h-11 rounded-xl ${iconColor} flex items-center justify-center shrink-0 shadow-sm">
                            <span class="material-symbols-outlined text-[24px]">${icon}</span>
                        </div>
                        <div class="flex flex-col min-w-0">
                            <div class="flex flex-wrap items-center gap-2">
                                <span class="font-headline-md text-headline-md text-on-surface font-bold truncate">${escapeHTML(job.title)}</span>
                                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary-fixed/30 text-tertiary font-label-sm text-[10px] font-bold">
                                    <span class="w-1.5 h-1.5 rounded-full bg-tertiary"></span>Active
                                </span>
                            </div>
                            <div class="flex flex-wrap items-center gap-2 text-on-surface-variant font-body-sm text-[12px] mt-0.5">
                                <span class="font-medium">${escapeHTML(job.company_name) || 'Organization'}</span>
                                <span class="text-outline-variant">•</span>
                                <span class="flex items-center gap-0.5"><span class="material-symbols-outlined text-[13px]">location_on</span>${escapeHTML(job.location)}</span>
                                <span class="text-outline-variant">•</span>
                                <span class="px-1.5 py-0.5 rounded-lg bg-surface-container text-on-surface font-label-sm text-[10px] font-semibold">${escapeHTML(job.employment_type)}</span>
                            </div>
                        </div>
                    </div>
                    <button class="px-4 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary-container transition-all flex items-center gap-1.5 shadow-sm hover:shadow-md shrink-0 self-start md:self-center" onclick="viewApplicants('${job.id}', '${encodeURIComponent(job.title)}')">
                        <span class="material-symbols-outlined text-[16px]">visibility</span>
                        <span>View Pipeline</span>
                    </button>
                </div>

                <!-- Competency Weights Grid -->
                <div class="p-4 rounded-xl bg-surface-container-low/40 border border-outline-variant/8 flex flex-col gap-3">
                    <div class="flex items-center justify-between">
                        <span class="font-label-sm text-[10px] text-on-surface font-bold flex items-center gap-1.5 uppercase tracking-wider">
                            <span class="material-symbols-outlined text-primary text-[14px]">functions</span>Competency Weights
                        </span>
                        <span class="font-body-sm text-[10px] text-on-surface-variant font-medium">75 / 25 Split</span>
                    </div>
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <div class="flex flex-col gap-1.5">
                            <span class="font-label-sm text-[10px] text-primary uppercase font-bold tracking-wider flex items-center gap-1">
                                <span class="material-symbols-outlined text-[12px]">lock</span>Mandatory (75%)
                            </span>
                            <div class="flex flex-wrap gap-1.5">${reqPills}</div>
                        </div>
                        <div class="flex flex-col gap-1.5">
                            <span class="font-label-sm text-[10px] text-on-surface-variant uppercase font-bold tracking-wider flex items-center gap-1">
                                <span class="material-symbols-outlined text-[12px]">star</span>Preferred (25%)
                            </span>
                            <div class="flex flex-wrap gap-1.5">${prefPills}</div>
                        </div>
                    </div>
                </div>
            </div>`;
        }).join('');
    } catch (error) {
        console.error("Failed to load recruiter jobs", error);
        container.innerHTML = `
            <div class="p-8 rounded-2xl bg-error-container/30 border border-error/10 text-center flex flex-col items-center gap-3">
                <span class="material-symbols-outlined text-error text-[28px]">error</span>
                <h4 class="font-headline-sm text-headline-sm text-on-surface font-bold">Unable to Load Roles</h4>
                <p class="font-body-sm text-body-sm text-on-surface-variant">${error.message || 'Check your connection.'}</p>
            </div>`;
    }
}

/* ─── VIEW CANDIDATE PIPELINE ─── */
async function viewApplicants(jobId, jobTitleEncoded) {
    const jobTitle = decodeURIComponent(jobTitleEncoded || 'Job');
    try {
        const candidates = await window.ApiClient.get(`/jobs/${jobId}/candidates`);
        const section = document.getElementById('candidate-dossier-section');
        const container = document.getElementById('applicantsContainer');

        document.getElementById('dossierJobTitle').textContent = `Role: ${jobTitle}`;

        if (!candidates || candidates.length === 0) {
            container.innerHTML = `
                <div class="p-10 rounded-2xl bg-surface-container-low/40 flex flex-col items-center justify-center gap-4 text-center">
                    <div class="w-14 h-14 rounded-2xl bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                        <span class="material-symbols-outlined text-[28px]">groups</span>
                    </div>
                    <div>
                        <h4 class="font-headline-sm text-headline-sm text-on-surface font-bold">No Candidates Yet</h4>
                        <p class="font-body-sm text-body-sm text-on-surface-variant max-w-sm mt-1">Candidates will appear here ranked by their algorithm match score once they apply.</p>
                    </div>
                </div>`;
        } else {
            candidates.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));

            container.innerHTML = candidates.map((app, idx) => {
                const score = Math.round((app.match_score || 0) * 10) / 10;
                const rankNum = idx + 1;

                // Tiered styling
                let scoreBg, scoreText, rankBg, rankIcon;
                if (score >= 80) { scoreBg = 'bg-tertiary-fixed/30'; scoreText = 'text-tertiary'; rankBg = 'bg-tertiary/10 text-tertiary'; rankIcon = 'grade'; }
                else if (score >= 60) { scoreBg = 'bg-primary-fixed/30'; scoreText = 'text-primary'; rankBg = 'bg-primary/8 text-primary'; rankIcon = 'verified'; }
                else { scoreBg = 'bg-surface-container'; scoreText = 'text-on-surface-variant'; rankBg = 'bg-surface-container text-on-surface'; rankIcon = 'pending'; }

                const applicantName = app.profiles ? escapeHTML(app.profiles.full_name) : 'Candidate';
                const applicantEmail = app.profiles ? escapeHTML(app.profiles.email) : 'hidden@skillbridge.io';
                const initial = applicantName.charAt(0).toUpperCase();

                // Status badge color
                const statusColors = {
                    applied: 'bg-secondary-fixed/50 text-on-secondary-fixed',
                    reviewing: 'bg-primary-fixed/30 text-primary',
                    shortlisted: 'bg-tertiary-fixed/30 text-tertiary',
                    rejected: 'bg-error-container/50 text-on-error-container'
                };
                const currentStatus = app.status || 'applied';
                const statusColor = statusColors[currentStatus] || statusColors.applied;

                return `
                <div class="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative overflow-hidden animate-fade-in" style="animation-delay: ${idx * 60}ms">
                    <!-- Left: Rank + Avatar + Info -->
                    <div class="flex items-start gap-3 min-w-0 flex-1">
                        <!-- Rank Badge -->
                        <div class="w-9 h-9 rounded-xl ${rankBg} flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                            #${rankNum}
                        </div>
                        <!-- Avatar -->
                        <div class="w-12 h-12 rounded-full bg-gradient-to-br from-surface-container-high to-surface-container flex items-center justify-center shrink-0 font-headline-sm text-on-surface font-bold shadow-sm">
                            ${initial}
                        </div>
                        <!-- Details -->
                        <div class="flex flex-col min-w-0 flex-1">
                            <div class="flex flex-wrap items-center gap-2">
                                <span class="font-headline-sm text-headline-sm text-on-surface font-bold truncate">${applicantName}</span>
                                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary-fixed/20 text-tertiary font-label-sm text-[10px] font-bold">
                                    <span class="material-symbols-outlined text-[11px]">verified</span>Verified
                                </span>
                            </div>
                            <div class="flex flex-wrap items-center gap-2 mt-0.5 text-on-surface-variant font-body-sm text-[12px]">
                                <span class="flex items-center gap-0.5"><span class="material-symbols-outlined text-[13px]">mail</span>${applicantEmail}</span>
                                ${app.learning_commitment ? `
                                    <span class="text-outline-variant">•</span>
                                    <span class="text-tertiary font-semibold flex items-center gap-0.5">
                                        <span class="material-symbols-outlined text-[13px]">auto_stories</span>${escapeHTML(app.learning_commitment)}
                                    </span>
                                ` : ''}
                            </div>
                            <!-- Status Selector -->
                            <div class="flex items-center gap-2 mt-2.5">
                                <select onchange="updateApplicationStatus('${jobId}', '${app.candidate_id}', this.value, '${jobTitleEncoded}')"
                                    class="px-2.5 py-1 rounded-lg ${statusColor} font-label-sm text-[11px] font-semibold border-0 focus:outline-none cursor-pointer transition-all">
                                    <option value="applied" ${currentStatus === 'applied' ? 'selected' : ''}>📋 Applied</option>
                                    <option value="reviewing" ${currentStatus === 'reviewing' ? 'selected' : ''}>🔍 Reviewing</option>
                                    <option value="shortlisted" ${currentStatus === 'shortlisted' ? 'selected' : ''}>⭐ Shortlisted</option>
                                    <option value="rejected" ${currentStatus === 'rejected' ? 'selected' : ''}>✗ Rejected</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <!-- Right: Score Display -->
                    <div class="flex items-center gap-3 shrink-0 lg:pl-4">
                        <div class="flex flex-col items-end text-right">
                            <span class="font-data-metric text-[28px] sm:text-[32px] ${scoreText} font-extrabold leading-none tracking-tight">${score}%</span>
                            <span class="font-label-sm text-[10px] text-on-surface-variant font-medium mt-0.5">Match Score</span>
                        </div>
                        <div class="w-11 h-11 rounded-xl ${scoreBg} flex items-center justify-center shadow-sm">
                            <span class="material-symbols-outlined ${scoreText} text-[22px]">${rankIcon}</span>
                        </div>
                    </div>
                </div>`;
            }).join('');
        }

        section.classList.remove('hidden');
        setTimeout(() => section.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (error) {
        showToast(error.message || "Failed to load candidate pipeline.", 'error');
    }
}

/* ─── UPDATE APPLICATION STATUS ─── */
async function updateApplicationStatus(jobId, candidateId, newStatus, jobTitleEncoded) {
    try {
        await window.ApiClient.patch(`/jobs/${jobId}/applications/${candidateId}`, { status: newStatus });
        showToast(`Status updated → ${newStatus}`, 'success');
        viewApplicants(jobId, jobTitleEncoded);
    } catch (error) {
        showToast(error.message || "Failed to update status.", 'error');
    }
}

/* ─── LOAD SKILLS DROPDOWN ─── */
async function loadAllSkillsToDropdown() {
    try {
        const skills = await window.ApiClient.get('/skills');
        const select = document.getElementById('jobSkillSelect');

        allSkillsMap = {};
        if (skills && skills.length > 0) {
            skills.forEach(s => allSkillsMap[s.id] = s.name);
            select.innerHTML = '<option value="">Select competency...</option>' +
                skills.map(s => `<option value="${s.id}">${s.name} (${s.category})</option>`).join('');
        } else {
            select.innerHTML = '<option value="">No skills available</option>';
        }
    } catch (error) {
        console.error("Failed to load skills taxonomy", error);
    }
}

/* ─── RENDER DRAFT SKILL CHIPS ─── */
function renderDraftSkills() {
    const container = document.getElementById('competency-chips-container');
    if (draftSkills.length === 0) {
        container.innerHTML = '<span class="font-body-sm text-body-sm text-on-surface-variant italic">No skills attached yet.</span>';
        return;
    }

    container.innerHTML = draftSkills.map(s => {
        const isReq = s.is_required;
        const dotColor = isReq ? 'bg-primary' : 'bg-secondary';
        const weightColor = isReq ? 'font-bold text-primary' : 'font-semibold text-on-surface-variant';
        const borderColor = isReq ? 'border-primary/10' : 'border-outline-variant/15';
        return `
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-lowest border ${borderColor} font-label-sm text-[11px] text-on-surface shadow-sm transition-all hover:shadow-md">
                <span class="w-1.5 h-1.5 rounded-full ${dotColor}"></span>
                <span class="font-medium">${allSkillsMap[s.skill_id] || 'Skill'}</span>
                <span class="${weightColor}">${isReq ? '75%' : '25%'}</span>
                <button type="button" class="text-on-surface-variant hover:text-error ml-0.5 font-bold text-xs leading-none" onclick="removeDraftSkill('${s.skill_id}')">✕</button>
            </span>`;
    }).join('');
}

/* ─── HANDLE POST JOB ─── */
async function handlePostJob(e) {
    e.preventDefault();
    const btn = document.getElementById('publishJobBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">progress_activity</span><span>Publishing...</span>';
    btn.disabled = true;
    btn.classList.add('opacity-70');

    const payload = {
        title: document.getElementById('jobTitle').value.trim(),
        company_name: document.getElementById('companyName').value.trim(),
        location: document.getElementById('jobLocation').value.trim(),
        employment_type: document.getElementById('employmentType').value,
        description: document.getElementById('jobDescription').value.trim(),
        is_active: true,
        skills: draftSkills
    };

    try {
        await window.ApiClient.post('/jobs', payload);
        showToast('Job published! Candidates can now be matched.', 'success');
        e.target.reset();
        draftSkills = [];
        renderDraftSkills();
        switchTab('managed');
        await loadRecruiterJobs();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        showToast(error.message || "Failed to post job.", 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
        btn.classList.remove('opacity-70');
    }
}
