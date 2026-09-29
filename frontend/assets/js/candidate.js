document.addEventListener('DOMContentLoaded', () => {
    window.Auth.protectRoute(['seeker']);
    
    // Set profile info
    const profile = window.Auth.getProfile();
    if (profile) {
        document.getElementById('profileName').textContent = profile.full_name;
        document.getElementById('profileHeadline').textContent = profile.headline || 'Candidate';
    }

    // Initialize data
    loadJobFeed();
    loadMySkills();
    loadAllSkillsToDropdown();

    // Setup forms
    document.getElementById('addSkillForm').addEventListener('submit', handleAddSkill);
});

let currentJobId = null;

async function loadJobFeed() {
    try {
        const jobs = await window.ApiClient.get('/jobs/feed');
        const container = document.getElementById('jobFeedContainer');
        
        if (jobs.length === 0) {
            container.innerHTML = '<p>No jobs found right now.</p>';
            return;
        }

        container.innerHTML = jobs.map(job => `
            <div class="job-card">
                <div class="job-header">
                    <div>
                        <h3>${job.title}</h3>
                        <p style="color: var(--text-muted);">${job.company_name} • ${job.location} • ${job.employment_type}</p>
                    </div>
                    <button class="btn-primary" onclick="viewJobDetail('${job.id}')">View & Match</button>
                </div>
                <p style="font-size: 0.9rem; color: var(--text-main);">${job.description.substring(0, 150)}...</p>
            </div>
        `).join('');
    } catch (error) {
        console.error("Failed to load jobs", error);
    }
}

async function viewJobDetail(jobId) {
    currentJobId = jobId;
    try {
        const jobDetail = await window.ApiClient.get(`/jobs/${jobId}`);
        const modal = document.getElementById('jobDetailModal');
        
        document.getElementById('modalJobTitle').textContent = jobDetail.title;
        
        const gapAnalysis = jobDetail.gap_analysis;
        if (gapAnalysis) {
            document.getElementById('modalMatchScore').textContent = `${gapAnalysis.match_score_percentage}%`;
            
            // Render Gap Analysis
            let gapHtml = '';
            
            if (gapAnalysis.matched_skills.length > 0) {
                gapHtml += `<h4>Verified Matches</h4><div class="skill-tags" style="margin-bottom: 1rem;">`;
                gapAnalysis.matched_skills.forEach(s => {
                    gapHtml += `<span class="badge badge-green">✓ ${s.skill.name}</span>`;
                });
                gapHtml += `</div>`;
            }

            if (gapAnalysis.critical_skill_gaps.length > 0) {
                gapHtml += `<h4>Missing Required Skills</h4><div class="skill-tags" style="margin-bottom: 1rem;">`;
                gapAnalysis.critical_skill_gaps.forEach(s => {
                    gapHtml += `<span class="badge badge-red">✗ ${s.skill.name}</span>`;
                });
                gapHtml += `</div>`;
            }

            if (gapAnalysis.bonus_competencies.length > 0) {
                gapHtml += `<h4>Bonus Competencies</h4><div class="skill-tags">`;
                gapAnalysis.bonus_competencies.forEach(s => {
                    gapHtml += `<span class="badge badge-blue">★ ${s.skill.name}</span>`;
                });
                gapHtml += `</div>`;
            }
            
            document.getElementById('gapAnalysisContent').innerHTML = gapHtml;
        }

        modal.style.display = 'flex';
    } catch (error) {
        alert("Failed to load job details.");
    }
}

async function applyForJob() {
    if (!currentJobId) return;
    
    const btn = document.getElementById('applyBtn');
    btn.textContent = 'Applying...';
    btn.disabled = true;

    try {
        await window.ApiClient.post(`/jobs/${currentJobId}/apply`, {});
        alert('Application submitted successfully!');
        document.getElementById('jobDetailModal').style.display = 'none';
    } catch (error) {
        alert('Failed to apply: ' + error.message);
    } finally {
        btn.textContent = 'Apply Now';
        btn.disabled = false;
    }
}

async function loadAllSkillsToDropdown() {
    try {
        const skills = await window.ApiClient.get('/skills');
        const select = document.getElementById('skillSelect');
        select.innerHTML = '<option value="">Select a skill...</option>' + 
            skills.map(s => `<option value="${s.id}">${s.name} (${s.category})</option>`).join('');
    } catch (error) {
        console.error("Failed to load standard skills", error);
    }
}

async function loadMySkills() {
    try {
        const mySkills = await window.ApiClient.get('/users/me/skills');
        const container = document.getElementById('mySkillsContainer');
        
        if (mySkills.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">You haven\'t added any skills yet. Add some above to improve your job match scores!</p>';
            return;
        }

        container.innerHTML = mySkills.map(ms => `
            <span class="badge badge-neutral" style="padding: 0.5rem 1rem;">
                ${ms.skill.name} <span style="font-weight: normal; margin-left: 0.5rem; color: var(--text-muted);">(${ms.proficiency_level}, ${ms.years_experience}yrs)</span>
            </span>
        `).join('');
    } catch (error) {
        console.error("Failed to load my skills", error);
    }
}

async function handleAddSkill(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.disabled = true;

    const payload = {
        skill_id: document.getElementById('skillSelect').value,
        proficiency_level: document.getElementById('proficiency').value,
        years_experience: parseFloat(document.getElementById('yearsExp').value)
    };

    try {
        await window.ApiClient.post('/users/me/skills', payload);
        // Refresh skill list
        await loadMySkills();
        e.target.reset();
    } catch (error) {
        alert("Failed to add skill: " + error.message);
    } finally {
        btn.disabled = false;
    }
}
