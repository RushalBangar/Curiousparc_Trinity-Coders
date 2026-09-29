class MatchingUI {
    /**
     * Renders a gap analysis payload into a designated container
     * @param {Object} gapAnalysis - The gap analysis payload from backend
     * @param {HTMLElement} container - The DOM element to render into
     */
    static renderGapAnalysis(gapAnalysis, container) {
        if (!gapAnalysis) {
            container.innerHTML = '<p>No matching data available.</p>';
            return;
        }

        let html = `
            <div class="match-score-container" style="margin-bottom: 1.5rem; padding: 1.5rem; background: var(--neutral-bg); border-radius: 8px;">
                <div style="flex-grow: 1;">
                    <h3 style="margin-bottom: 0.5rem; color: var(--text-main);">Overall Match Score</h3>
                    <div style="width: 100%; background-color: #E2E8F0; border-radius: 9999px; height: 10px; overflow: hidden;">
                        <div style="width: ${gapAnalysis.match_score_percentage}%; background-color: var(--success); height: 100%; transition: width 1s ease-in-out;"></div>
                    </div>
                </div>
                <div style="font-size: 2rem; font-weight: bold; color: var(--success); margin-left: 1.5rem;">
                    ${gapAnalysis.match_score_percentage}%
                </div>
            </div>
            
            <div class="gap-details">
        `;
        
        if (gapAnalysis.matched_skills.length > 0) {
            html += `
                <div class="card" style="margin-bottom: 1rem; border-left: 4px solid var(--success);">
                    <h4>Verified Matches</h4>
                    <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.5rem;">You meet these required skills for the role.</p>
                    <div class="skill-tags">
                        ${gapAnalysis.matched_skills.map(s => `<span class="badge badge-green">✓ ${s.skill.name}</span>`).join('')}
                    </div>
                </div>
            `;
        }

        if (gapAnalysis.critical_skill_gaps.length > 0) {
            html += `
                <div class="card" style="margin-bottom: 1rem; border-left: 4px solid var(--warning);">
                    <h4>Missing Required Skills</h4>
                    <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.5rem;">Consider upskilling in these areas to improve your chances.</p>
                    <div class="skill-tags">
                        ${gapAnalysis.critical_skill_gaps.map(s => `<span class="badge badge-red">✗ ${s.skill.name}</span>`).join('')}
                    </div>
                </div>
            `;
        }

        if (gapAnalysis.bonus_competencies.length > 0) {
            html += `
                <div class="card" style="margin-bottom: 1rem; border-left: 4px solid var(--primary-brand);">
                    <h4>Bonus Competencies</h4>
                    <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.5rem;">You have these preferred skills that make your profile stand out.</p>
                    <div class="skill-tags">
                        ${gapAnalysis.bonus_competencies.map(s => `<span class="badge badge-blue">★ ${s.skill.name}</span>`).join('')}
                    </div>
                </div>
            `;
        }
        
        html += `</div>`;
        container.innerHTML = html;
    }
}

window.MatchingUI = MatchingUI;
