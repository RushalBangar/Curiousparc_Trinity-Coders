/* ==========================================================================
   SkillBridge - Recruiter Dashboard Logic (recruiter.js)
   Posting management, draft skill builder, candidate ranking pipeline
   ========================================================================== */

let draftSkills = [];
let allSkillsMap = {};

document.addEventListener('DOMContentLoaded', () => {
    window.Auth.protectRoute(['recruiter']);
    
    // Set profile info
    const profile = window.Auth.getProfile();
    if (profile) {
        document.getElementById('profileName').textContent = profile.full_name || 'Recruiter';
        document.getElementById('profileHeadline').textContent = profile.headline || 'Talent Acquisition';

        const initials = (profile.full_name || 'R').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        document.getElementById('avatarInitials').textContent = initials;
    }

    // Initialize data
    loadRecruiterJobs();
    loadAllSkillsToDropdown();

    // Setup forms
    document.getElementById('postJobForm').addEventListener('submit', handlePostJob);

    // Modal Accessibility
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeApplicantsModal();
        }
    });

    window.addEventListener('click', (e) => {
        const modal = document.getElementById('applicantsModal');
        if (e.target === modal) {
            closeApplicantsModal();
        }
    });
});

async function loadRecruiterJobs() {
    const container = document.getElementById('recruiterJobsContainer');
    try {
        const myJobs = await window.ApiClient.get('/jobs/my-jobs');
        
        document.getElementById('sidebarJobCount').textContent = myJobs.length;
        document.getElementById('statTotalJobs').textContent = myJobs.length;

        if (myJobs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📝</div>
                    <h4>No Roles Published Yet</h4>
                    <p>Create your first job posting to start receiving ranked applicants based on competency matching.</p>
                    <button class="btn-primary" onclick="showTab('postJob')">+ Create First Job</button>
                </div>
            `;
            return;
        }

        container.innerHTML = myJobs.map(job => `
            <div class="job-card">
                <div class="job-card-header">
                    <div>
                        <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.25rem;">
                            ${escapeHTML(job.title)}
                        </h3>
                        <div class="job-meta-row">
                            <span class="meta-pill">🏢 ${escapeHTML(job.company_name) || 'Acme'}</span>
                            <span class="meta-pill">📍 ${escapeHTML(job.location)}</span>
                            <span class="meta-pill">⏱️ ${escapeHTML(job.employment_type)}</span>
                            <span class="badge badge-green">Active</span>
                        </div>
                    </div>
                    <button class="btn-primary" onclick="viewApplicants('${job.id}', '${encodeURIComponent(job.title)}')">
                        <span>Candidate Pipeline</span> →
                    </button>
                </div>
                <p style="font-size: 0.925rem; color: var(--text-secondary); line-height: 1.6;">
                    ${escapeHTML(job.description || '').substring(0, 160)}...
                </p>
            </div>
        `).join('');
    } catch (error) {
        console.error("Failed to load recruiter jobs", error);
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <h4>Unable to Load Roles</h4>
                <p>${error.message || 'Check connection to backend server.'}</p>
            </div>
        `;
    }
}

async function viewApplicants(jobId, jobTitleEncoded) {
    const jobTitle = decodeURIComponent(jobTitleEncoded || 'Job');
    try {
        const candidates = await window.ApiClient.get(`/jobs/${jobId}/candidates`);
        const modal = document.getElementById('applicantsModal');
        const container = document.getElementById('applicantsContainer');
        
        if (!candidates || candidates.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="padding: 2.5rem 1rem;">
                    <div class="empty-state-icon">👥</div>
                    <h4>No Candidates In Pipeline Yet</h4>
                    <p>Qualified candidates will appear here ranked by their dual-tier algorithm score once they apply.</p>
                </div>
            `;
        } else {
            // Sort by match_score descending
            candidates.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));

            container.innerHTML = `
                <div style="margin-bottom: 1rem; font-size: 0.9rem; color: var(--text-muted);">
                    Showing <strong>${candidates.length}</strong> applicants sorted by mathematical compatibility for <strong>${jobTitle}</strong>:
                </div>
                ` + candidates.map((app, idx) => {
                    const score = Math.round((app.match_score || 0) * 10) / 10;
                    const scoreClass = score >= 75 ? 'score-high' : score >= 50 ? 'score-med' : 'score-low';
                    const rankLabel = idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`;
                    const rankClass = idx === 0 ? 'top-1' : '';

                    const applicantName = app.profiles ? escapeHTML(app.profiles.full_name) : 'Candidate';
                    const applicantEmail = app.profiles ? escapeHTML(app.profiles.email) : 'hidden@skillbridge.io';

                    return `
                        <div class="candidate-row-card">
                            <div style="display: flex; align-items: center; gap: 1rem;">
                                <div class="candidate-rank ${rankClass}">${rankLabel}</div>
                                <div>
                                    <h4 style="font-size: 1.05rem; margin-bottom: 0.15rem; color: var(--text-primary);">${applicantName}</h4>
                                    <p style="font-size: 0.85rem; color: var(--text-muted);">${applicantEmail}</p>
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 1rem;">
                                <div class="score-badge ${scoreClass}">
                                    ⚡ ${score}% Match
                                </div>
                                <select onchange="updateApplicationStatus('${jobId}', '${app.candidate_id}', this.value, '${jobTitleEncoded}')" style="padding: 0.35rem 0.5rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); background: var(--bg-surface); font-size: 0.85rem; color: var(--text-primary); cursor: pointer; text-transform: capitalize;">
                                    <option value="applied" ${app.status === 'applied' ? 'selected' : ''}>Applied</option>
                                    <option value="reviewing" ${app.status === 'reviewing' ? 'selected' : ''}>Reviewing</option>
                                    <option value="shortlisted" ${app.status === 'shortlisted' ? 'selected' : ''}>Shortlisted</option>
                                    <option value="rejected" ${app.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                                </select>
                            </div>
                        </div>
                    `;
                }).join('');
        }

        modal.style.display = 'flex';
    } catch (error) {
        window.Toast.error(error.message || "Failed to load candidate pipeline.", "Error");
    }
}

async function updateApplicationStatus(jobId, candidateId, newStatus, jobTitleEncoded) {
    try {
        await window.ApiClient.patch(`/jobs/${jobId}/applications/${candidateId}`, { status: newStatus });
        window.Toast.success(`Candidate status updated to ${newStatus}.`, "Status Saved");
        // Reload the modal to reflect potential UI styling changes (optional, but good for consistency)
        viewApplicants(jobId, jobTitleEncoded);
    } catch (error) {
        window.Toast.error(error.message || "Failed to update status.", "Error");
    }
}

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

function addSkillToDraft() {
    const select = document.getElementById('jobSkillSelect');
    const requiredSelect = document.getElementById('jobSkillRequired');
    
    if (!select.value) {
        window.Toast.info("Please select a competency from the dropdown.", "Notice");
        return;
    }
    
    // Check if already added
    if (draftSkills.some(s => s.skill_id === select.value)) {
        window.Toast.warning("Competency already added to draft requirements.", "Notice");
        return;
    }
    
    const isReq = requiredSelect.value === 'true';
    draftSkills.push({
        skill_id: select.value,
        is_required: isReq,
        weight: isReq ? 2.0 : 1.0
    });
    
    renderDraftSkills();
    window.Toast.success(`Added ${allSkillsMap[select.value]} to job draft`, "Competency Added");
}

function removeDraftSkill(id) {
    draftSkills = draftSkills.filter(s => s.skill_id !== id);
    renderDraftSkills();
}

function renderDraftSkills() {
    const container = document.getElementById('selectedSkillsContainer');
    if (draftSkills.length === 0) {
        container.innerHTML = '<span style="color: var(--text-muted); font-size: 0.85rem; font-style: italic;">No skills attached yet. Select below to add.</span>';
        return;
    }

    container.innerHTML = draftSkills.map(s => `
        <span class="badge ${s.is_required ? 'badge-red' : 'badge-blue'}" style="padding: 0.45rem 0.85rem; font-size: 0.825rem;">
            ${s.is_required ? 'Req (75%):' : 'Pref (25%):'} ${allSkillsMap[s.skill_id] || 'Skill'} 
            <button type="button" style="background:none; border:none; margin-left:6px; cursor:pointer; color:inherit; font-weight:bold;" onclick="removeDraftSkill('${s.skill_id}')">✕</button>
        </span>
    `).join('');
}

async function handlePostJob(e) {
    e.preventDefault();
    const btn = document.getElementById('publishJobBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span>Publishing Role...</span>';
    btn.disabled = true;

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
        window.Toast.success('Job posting published and active in matching feed!', 'Job Published');
        e.target.reset();
        draftSkills = [];
        renderDraftSkills();
        
        // Switch tab back to my jobs & refresh
        showTab('myJobs');
        await loadRecruiterJobs();
    } catch (error) {
        window.Toast.error(error.message || "Failed to post job.", "Error");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}
