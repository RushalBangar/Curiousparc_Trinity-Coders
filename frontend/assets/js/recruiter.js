/* ==========================================================================
   SkillBridge - Recruiter Dashboard Logic (recruiter.js)
   Posting management, draft skill builder, candidate ranking pipeline
   ========================================================================== */

let draftSkills = [];
let allSkillsMap = {};
let activeRequirementLevel = 'mandatory';

// Make requirement toggle globally accessible for onclick
window.setRequirementLevel = function(level) {
    activeRequirementLevel = level;
    const tabM = document.getElementById('tab-mandatory');
    const tabP = document.getElementById('tab-preferred');

    if (level === 'mandatory') {
        tabM.className = 'flex-1 py-1 px-2 rounded font-label-sm text-label-sm font-semibold bg-surface-container-lowest text-primary shadow-sm flex items-center justify-center gap-1 transition-all';
        tabP.className = 'flex-1 py-1 px-2 rounded font-label-sm text-label-sm font-semibold text-on-surface-variant hover:text-on-surface flex items-center justify-center gap-1 transition-all';
    } else {
        tabP.className = 'flex-1 py-1 px-2 rounded font-label-sm text-label-sm font-semibold bg-surface-container-lowest text-primary shadow-sm flex items-center justify-center gap-1 transition-all';
        tabM.className = 'flex-1 py-1 px-2 rounded font-label-sm text-label-sm font-semibold text-on-surface-variant hover:text-on-surface flex items-center justify-center gap-1 transition-all';
    }
};

window.addCompetencyChip = function() {
    const select = document.getElementById('jobSkillSelect');
    
    if (!select.value) {
        window.Toast.info("Please select a competency from the dropdown.", "Notice");
        return;
    }
    
    // Check if already added
    if (draftSkills.some(s => s.skill_id === select.value)) {
        window.Toast.warning("Competency already added to draft requirements.", "Notice");
        return;
    }
    
    const isReq = activeRequirementLevel === 'mandatory';
    draftSkills.push({
        skill_id: select.value,
        is_required: isReq,
        weight: isReq ? 2.0 : 1.0
    });
    
    renderDraftSkills();
    window.Toast.success(`Added ${allSkillsMap[select.value]} to job draft`, "Competency Added");
};

window.removeDraftSkill = function(id) {
    draftSkills = draftSkills.filter(s => s.skill_id !== id);
    renderDraftSkills();
};

document.addEventListener('DOMContentLoaded', () => {
    window.Auth.protectRoute(['recruiter']);
    
    // Set profile info
    const profile = window.Auth.getProfile();
    if (profile) {
        document.getElementById('profileName').textContent = profile.full_name || 'Recruiter';
        document.getElementById('profileGreeting').textContent = 'Welcome back, ' + (profile.full_name || 'Recruiter');
        document.getElementById('profileHeadline').textContent = profile.headline || 'Talent Acquisition';

        const initials = (profile.full_name || 'R').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        document.getElementById('avatarInitials').textContent = initials;
        if(document.getElementById('avatarInitialsBig')) {
            document.getElementById('avatarInitialsBig').textContent = initials;
        }
    }

    // Initialize data
    loadRecruiterJobs();
    loadAllSkillsToDropdown();

    // Setup forms
    document.getElementById('postJobForm').addEventListener('submit', handlePostJob);
});

async function loadRecruiterJobs() {
    const container = document.getElementById('recruiterJobsContainer');
    try {
        const myJobs = await window.ApiClient.get('/jobs/my-jobs');
        
        document.getElementById('managedRolesCount').textContent = `${myJobs.length} Total`;
        document.getElementById('statTotalJobs').textContent = `${myJobs.length} Published`;

        if (myJobs.length === 0) {
            container.innerHTML = `
                <div class="p-space-xl rounded-xl bg-surface-container-lowest shadow-sm flex flex-col items-center justify-center gap-space-md text-center">
                    <div class="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant">
                        <span class="material-symbols-outlined text-[26px]">inbox</span>
                    </div>
                    <div>
                        <h4 class="font-headline-sm text-headline-sm text-on-surface">No Roles Published Yet</h4>
                        <p class="font-body-sm text-body-sm text-on-surface-variant max-w-md mt-1">Create your first job posting to start receiving ranked applicants based on competency matching.</p>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = myJobs.map(job => {
            const reqSkills = (job.skills || []).filter(s => s.is_required).map(s => s.skill ? s.skill.name : 'Unknown');
            const prefSkills = (job.skills || []).filter(s => !s.is_required).map(s => s.skill ? s.skill.name : 'Unknown');
            
            return `
            <div class="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-space-md relative overflow-hidden transition-all hover:shadow-md">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
                    <div class="flex items-start gap-space-md">
                        <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <span class="material-symbols-outlined text-primary text-[26px]">terminal</span>
                        </div>
                        <div class="flex flex-col">
                            <div class="flex flex-wrap items-center gap-2">
                                <span class="font-headline-md text-headline-md text-on-surface">${escapeHTML(job.title)}</span>
                                <span class="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold flex items-center gap-1">
                                    <span class="w-1.5 h-1.5 rounded-full bg-tertiary"></span> Active
                                </span>
                            </div>
                            <div class="flex flex-wrap items-center gap-space-sm text-on-surface-variant font-body-sm text-body-sm mt-1">
                                <span>${escapeHTML(job.company_name) || 'TechCorp Labs'}</span>
                                <span>•</span>
                                <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[15px]">location_on</span> ${escapeHTML(job.location)}</span>
                                <span>•</span>
                                <span class="px-1.5 py-0.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm">${escapeHTML(job.employment_type)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-space-xs self-start md:self-center">
                        <button class="px-space-md py-space-sm rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-colors flex items-center gap-1.5 shadow-sm" onclick="viewApplicants('${job.id}', '${encodeURIComponent(job.title)}')">
                            <span class="material-symbols-outlined text-[16px]">visibility</span>
                            <span>View Ranked Pipeline</span>
                        </button>
                    </div>
                </div>
                
                <div class="p-space-md rounded-lg bg-surface-container-low flex flex-col gap-space-sm">
                    <div class="flex items-center justify-between">
                        <span class="font-label-sm text-label-sm text-on-surface font-semibold flex items-center gap-1.5">
                            <span class="material-symbols-outlined text-primary text-[16px]">functions</span> Attached Mathematical Competency Weights
                        </span>
                        <span class="font-body-sm text-body-sm text-on-surface-variant">Deterministic 75 / 25 Split</span>
                    </div>
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-space-md">
                        <div class="flex flex-col gap-1.5">
                            <span class="font-label-sm text-label-sm text-primary uppercase font-bold tracking-wider flex items-center gap-1">
                                <span class="material-symbols-outlined text-[14px]">lock</span> Mandatory Core (75% Weight)
                            </span>
                            <div class="flex flex-wrap gap-1.5">
                                ${reqSkills.length > 0 ? reqSkills.map(s => `<span class="px-2.5 py-1 rounded-full bg-surface-container-lowest font-label-sm text-label-sm text-on-surface flex items-center gap-1 shadow-sm"><span>${escapeHTML(s)}</span><span class="font-bold text-primary">75%</span></span>`).join('') : '<span class="text-xs text-on-surface-variant">None set</span>'}
                            </div>
                        </div>
                        <div class="flex flex-col gap-1.5">
                            <span class="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold tracking-wider flex items-center gap-1">
                                <span class="material-symbols-outlined text-[14px]">add_task</span> Preferred Bonus (25% Weight)
                            </span>
                            <div class="flex flex-wrap gap-1.5">
                                ${prefSkills.length > 0 ? prefSkills.map(s => `<span class="px-2.5 py-1 rounded-full bg-surface-container-lowest font-label-sm text-label-sm text-on-surface flex items-center gap-1 shadow-sm"><span>${escapeHTML(s)}</span><span class="font-semibold text-on-surface-variant">25%</span></span>`).join('') : '<span class="text-xs text-on-surface-variant">None set</span>'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            `;
        }).join('');
    } catch (error) {
        console.error("Failed to load recruiter jobs", error);
        container.innerHTML = `
            <div class="p-space-xl rounded-xl bg-error-container text-on-error-container text-center">
                <span class="material-symbols-outlined text-[26px]">error</span>
                <h4 class="font-headline-sm text-headline-sm">Unable to Load Roles</h4>
                <p class="font-body-sm text-body-sm">${error.message || 'Check connection to backend server.'}</p>
            </div>
        `;
    }
}

async function viewApplicants(jobId, jobTitleEncoded) {
    const jobTitle = decodeURIComponent(jobTitleEncoded || 'Job');
    try {
        const candidates = await window.ApiClient.get(`/jobs/${jobId}/candidates`);
        const section = document.getElementById('candidate-dossier-section');
        const container = document.getElementById('applicantsContainer');
        
        document.getElementById('dossierJobTitle').textContent = `Role: ${jobTitle}`;
        
        if (!candidates || candidates.length === 0) {
            container.innerHTML = `
                <div class="p-space-xl rounded-xl bg-surface-container-low shadow-sm flex flex-col items-center justify-center gap-space-md text-center">
                    <div class="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                        <span class="material-symbols-outlined text-[26px]">groups</span>
                    </div>
                    <div>
                        <h4 class="font-headline-sm text-headline-sm text-on-surface">No Candidates In Pipeline Yet</h4>
                        <p class="font-body-sm text-body-sm text-on-surface-variant max-w-md mt-1">Qualified candidates will appear here ranked by their dual-tier algorithm score once they apply.</p>
                    </div>
                </div>
            `;
        } else {
            // Sort by match_score descending
            candidates.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));

            container.innerHTML = candidates.map((app, idx) => {
                    const score = Math.round((app.match_score || 0) * 10) / 10;
                    const rankLabel = '#' + (idx + 1);
                    
                    // Style by score
                    let scoreColorClass = score >= 75 ? 'text-tertiary' : score >= 50 ? 'text-primary' : 'text-on-surface-variant';
                    let rankBgClass = score >= 75 ? 'bg-tertiary/10 text-tertiary' : score >= 50 ? 'bg-primary/10 text-primary' : 'bg-surface-container text-on-surface';

                    const applicantName = app.profiles ? escapeHTML(app.profiles.full_name) : 'Candidate';
                    const applicantEmail = app.profiles ? escapeHTML(app.profiles.email) : 'hidden@skillbridge.io';

                    return `
                        <div class="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow flex flex-col lg:flex-row lg:items-center justify-between gap-space-lg relative overflow-hidden">
                            <div class="flex items-start gap-space-md">
                                <div class="w-10 h-10 rounded-xl ${rankBgClass} flex flex-col items-center justify-center font-headline-sm text-headline-sm font-bold shrink-0">
                                    ${rankLabel}
                                </div>
                                <div class="relative w-14 h-14 rounded-full bg-surface-container flex items-center justify-center shrink-0 overflow-hidden font-headline-md text-on-surface">
                                    ${applicantName.charAt(0).toUpperCase()}
                                </div>
                                <div class="flex flex-col">
                                    <div class="flex flex-wrap items-center gap-2">
                                        <span class="font-headline-sm text-headline-sm text-on-surface">${applicantName}</span>
                                        <span class="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold flex items-center gap-1">
                                            <span class="material-symbols-outlined text-[13px]">verified</span> Proctored Verified
                                        </span>
                                    </div>
                                    <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-on-surface-variant font-body-sm text-body-sm">
                                        <span class="text-on-surface flex items-center gap-1">
                                            <span class="material-symbols-outlined text-[15px] text-on-surface-variant">mail</span> ${applicantEmail}
                                        </span>
                                        ${app.learning_commitment ? `
                                            <span class="text-tertiary font-semibold flex items-center gap-1">
                                                <span class="material-symbols-outlined text-[15px]">auto_stories</span> Plan: ${escapeHTML(app.learning_commitment)}
                                            </span>
                                        ` : ''}
                                    </div>
                                    
                                    <div class="flex items-center gap-2 mt-2">
                                        <select onchange="updateApplicationStatus('${jobId}', '${app.candidate_id}', this.value, '${jobTitleEncoded}')" class="px-2 py-0.5 rounded bg-surface-container-low text-on-surface font-label-sm text-label-sm border border-outline-variant/30 focus:outline-none cursor-pointer">
                                            <option value="applied" ${app.status === 'applied' ? 'selected' : ''}>Applied</option>
                                            <option value="reviewing" ${app.status === 'reviewing' ? 'selected' : ''}>Reviewing</option>
                                            <option value="shortlisted" ${app.status === 'shortlisted' ? 'selected' : ''}>Shortlisted</option>
                                            <option value="rejected" ${app.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-space-md shrink-0">
                                <div class="flex items-center gap-3">
                                    <div class="flex flex-col text-right">
                                        <span class="font-data-metric text-data-metric ${scoreColorClass} leading-none">${score}%</span>
                                        <span class="font-label-sm text-label-sm text-on-surface-variant">Affinity Match</span>
                                    </div>
                                    <div class="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant">
                                        <span class="material-symbols-outlined text-[26px]">grade</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
        }
        
        // Show the section and scroll to it
        section.classList.remove('hidden');
        section.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        window.Toast.error(error.message || "Failed to load candidate pipeline.", "Error");
    }
}

async function updateApplicationStatus(jobId, candidateId, newStatus, jobTitleEncoded) {
    try {
        await window.ApiClient.patch(`/jobs/${jobId}/applications/${candidateId}`, { status: newStatus });
        window.Toast.success(`Candidate status updated to ${newStatus}.`, "Status Saved");
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

function renderDraftSkills() {
    const container = document.getElementById('competency-chips-container');
    if (draftSkills.length === 0) {
        container.innerHTML = '<span class="font-body-sm text-body-sm text-on-surface-variant italic">No skills attached yet. Select above to add.</span>';
        return;
    }

    container.innerHTML = draftSkills.map(s => `
        <span class="px-2.5 py-1 rounded-full bg-surface-container-lowest text-on-surface font-label-sm text-label-sm flex items-center gap-1.5 shadow-sm">
            <span class="w-2 h-2 rounded-full ${s.is_required ? 'bg-primary' : 'bg-secondary'}"></span>
            <span>${allSkillsMap[s.skill_id] || 'Skill'}</span>
            <span class="${s.is_required ? 'font-bold text-primary' : 'font-semibold text-on-surface-variant'}">${s.is_required ? '75%' : '25%'}</span>
            <button type="button" class="text-on-surface-variant hover:text-error ml-0.5 font-bold" onclick="removeDraftSkill('${s.skill_id}')">✕</button>
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
        
        await loadRecruiterJobs();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        window.Toast.error(error.message || "Failed to post job.", "Error");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}
