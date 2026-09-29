document.addEventListener('DOMContentLoaded', () => {
    window.Auth.protectRoute(['recruiter']);
    
    // Set profile info
    const profile = window.Auth.getProfile();
    if (profile) {
        document.getElementById('profileName').textContent = profile.full_name;
        document.getElementById('profileHeadline').textContent = profile.headline || 'Recruiter';
    }

    // Initialize data
    loadRecruiterJobs();
    loadAllSkillsToDropdown();

    // Setup forms
    document.getElementById('postJobForm').addEventListener('submit', handlePostJob);
});

let draftSkills = [];
let allSkillsMap = {};

async function loadRecruiterJobs() {
    try {
        // Technically we should have a /jobs/me endpoint, but for now we'll just filter /jobs/feed locally, 
        // or since the recruiter wants to see their jobs, they might need a specific endpoint. 
        // We'll use the feed for now and filter by recruiter_id to save time if we don't have a /jobs/me endpoint.
        const jobs = await window.ApiClient.get('/jobs/feed');
        const profile = window.Auth.getProfile();
        
        const myJobs = jobs.filter(j => j.recruiter_id === profile.id);
        const container = document.getElementById('recruiterJobsContainer');
        
        if (myJobs.length === 0) {
            container.innerHTML = '<p>You haven\'t posted any jobs yet.</p>';
            return;
        }

        container.innerHTML = myJobs.map(job => `
            <div class="job-card">
                <div class="job-header">
                    <div>
                        <h3>${job.title}</h3>
                        <p style="color: var(--text-muted);">${job.location} • ${job.employment_type}</p>
                    </div>
                    <button class="btn-primary" onclick="viewApplicants('${job.id}')">View Candidates</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error("Failed to load jobs", error);
    }
}

async function viewApplicants(jobId) {
    try {
        const candidates = await window.ApiClient.get(`/jobs/${jobId}/candidates`);
        const modal = document.getElementById('applicantsModal');
        const container = document.getElementById('applicantsContainer');
        
        if (candidates.length === 0) {
            container.innerHTML = '<p>No candidates have applied yet.</p>';
        } else {
            container.innerHTML = candidates.map(app => `
                <div class="candidate-card" style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h4 style="margin-bottom: 0;">${app.profiles.full_name}</h4>
                        <p style="font-size: 0.9rem; color: var(--text-muted);">${app.profiles.email}</p>
                    </div>
                    <div style="text-align: right;">
                        <div class="match-score-text" style="font-size: 1.5rem;">${app.match_score}%</div>
                        <span class="badge badge-neutral">${app.status}</span>
                    </div>
                </div>
            `).join('');
        }

        modal.style.display = 'flex';
    } catch (error) {
        alert("Failed to load candidates.");
    }
}

async function loadAllSkillsToDropdown() {
    try {
        const skills = await window.ApiClient.get('/skills');
        const select = document.getElementById('jobSkillSelect');
        
        skills.forEach(s => allSkillsMap[s.id] = s.name);
        
        select.innerHTML = '<option value="">Select a skill...</option>' + 
            skills.map(s => `<option value="${s.id}">${s.name} (${s.category})</option>`).join('');
    } catch (error) {
        console.error("Failed to load standard skills", error);
    }
}

function addSkillToDraft() {
    const select = document.getElementById('jobSkillSelect');
    const requiredSelect = document.getElementById('jobSkillRequired');
    
    if (!select.value) return;
    
    // Check if already added
    if (draftSkills.some(s => s.skill_id === select.value)) {
        alert("Skill already added");
        return;
    }
    
    draftSkills.push({
        skill_id: select.value,
        is_required: requiredSelect.value === 'true',
        weight: 1.0 // Default weight
    });
    
    renderDraftSkills();
}

function removeDraftSkill(id) {
    draftSkills = draftSkills.filter(s => s.skill_id !== id);
    renderDraftSkills();
}

function renderDraftSkills() {
    const container = document.getElementById('selectedSkillsContainer');
    container.innerHTML = draftSkills.map(s => `
        <span class="badge ${s.is_required ? 'badge-red' : 'badge-blue'}">
            ${s.is_required ? 'Req:' : 'Pref:'} ${allSkillsMap[s.skill_id]} 
            <button type="button" style="background:none; border:none; margin-left:5px; cursor:pointer;" onclick="removeDraftSkill('${s.skill_id}')">×</button>
        </span>
    `).join('');
}

async function handlePostJob(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;

    const payload = {
        title: document.getElementById('jobTitle').value,
        company_name: document.getElementById('companyName').value,
        location: document.getElementById('jobLocation').value,
        employment_type: document.getElementById('employmentType').value,
        description: document.getElementById('jobDescription').value,
        is_active: true,
        skills: draftSkills
    };

    try {
        await window.ApiClient.post('/jobs', payload);
        alert('Job posted successfully!');
        e.target.reset();
        draftSkills = [];
        renderDraftSkills();
        
        // Switch tab back
        showTab('myJobs');
        loadRecruiterJobs();
    } catch (error) {
        alert("Failed to post job: " + error.message);
    } finally {
        btn.disabled = false;
    }
}
