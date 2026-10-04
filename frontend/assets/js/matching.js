/* ==========================================================================
   SkillBridge - Matching Engine UI Visualizer (matching.js)
   Renders animated score rings, gap breakdowns, and upskilling prompts
   ========================================================================== */

class MatchingUI {
    /**
     * Renders a gap analysis payload into a designated container
     * @param {Object} gapAnalysis - The gap analysis payload from backend
     * @param {HTMLElement} container - The DOM element to render into
     */
    static renderGapAnalysis(gapAnalysis, container) {
        if (!gapAnalysis) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📊</div>
                    <h4>No Match Data Available</h4>
                    <p>Add technical competencies to your profile to calculate compatibility with this role.</p>
                </div>
            `;
            return;
        }

        const score = Math.round((gapAnalysis.match_score_percentage || 0) * 10) / 10;
        let scoreTheme = 'var(--success)';
        let scorePillClass = 'badge-green';
        let feedbackMessage = 'Strong Candidate Fit! You meet the core requirements for this position.';

        if (score < 50) {
            scoreTheme = 'var(--warning)';
            scorePillClass = 'badge-red';
            feedbackMessage = 'Significant Skill Gap. Consider reviewing missing mandatory skills before applying.';
        } else if (score < 75) {
            scoreTheme = 'var(--info)';
            scorePillClass = 'badge-blue';
            feedbackMessage = 'Promising Potential. You meet several prerequisites with room for bonus skill alignment.';
        }

        let html = `
            <div class="match-meter" style="margin-bottom: 2rem; border-left: 5px solid ${scoreTheme}; background: var(--bg-surface); box-shadow: var(--shadow-sm);">
                <div class="match-dial" style="--score: ${score}; background: conic-gradient(${scoreTheme} calc(${score} * 1%), #e2e8f0 0);">
                    <div class="match-dial-inner">${score}%</div>
                </div>
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                        <h3 style="font-size: 1.2rem; color: var(--text-primary); margin-bottom: 0;">Compatibility Rating</h3>
                        <span class="badge ${scorePillClass}">${score}% Score</span>
                    </div>
                    <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.4rem;">
                        ${feedbackMessage}
                    </p>
                    <div style="font-size: 0.775rem; color: var(--text-muted);">
                        Formula: [75% × Mandatory Req Matched] + [25% × Preferred Pref Matched]
                    </div>
                </div>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 1.25rem;">
        `;
        
        // 1. Matched Skills
        if (gapAnalysis.matched_skills && gapAnalysis.matched_skills.length > 0) {
            html += `
                <div class="card" style="border-left: 4px solid var(--success); padding: 1.25rem 1.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <h4 style="font-size: 1rem; color: #065f46; display: flex; align-items: center; gap: 0.4rem;">
                            <span>✓</span> Verified Mandatory Matches (${gapAnalysis.matched_skills.length})
                        </h4>
                        <span class="badge badge-green">Satisfied</span>
                    </div>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.75rem;">You possess these core prerequisite skills demanded by the employer.</p>
                    <div class="skill-tags">
                        ${gapAnalysis.matched_skills.map(s => {
                            if (s.is_partial) {
                                return `<span class="badge badge-purple" style="padding: 0.4rem 0.85rem; font-size: 0.825rem;" title="Partial match via semantic equivalency">
                                    ✓ ${window.escapeHTML(s.skill.name)} (Partial)
                                </span>`;
                            }
                            return `<span class="badge badge-green" style="padding: 0.4rem 0.85rem; font-size: 0.825rem;">
                                ✓ ${window.escapeHTML(s.skill.name)}
                            </span>`;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        // 2. Critical Skill Gaps
        if (gapAnalysis.critical_skill_gaps && gapAnalysis.critical_skill_gaps.length > 0) {
            html += `
                <div class="card" style="border-left: 4px solid var(--danger); padding: 1.25rem 1.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <h4 style="font-size: 1rem; color: #991b1b; display: flex; align-items: center; gap: 0.4rem;">
                            <span>✗</span> Critical Skill Gaps (${gapAnalysis.critical_skill_gaps.length})
                        </h4>
                        <span class="badge badge-red">Missing Required</span>
                    </div>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.75rem;">
                        These mandatory skills are missing from your profile. Tagging them will substantially raise your match score.
                    </p>
                    <div class="skill-tags" style="display: flex; flex-wrap: wrap; gap: 0;">
                        ${gapAnalysis.critical_skill_gaps.map(s => `
                            <div style="display: inline-flex; align-items: stretch; border: 1px solid #fca5a5; border-radius: 9999px; overflow: hidden; background: #fef2f2; margin-right: 0.5rem; margin-bottom: 0.5rem;">
                                <span style="padding: 0.4rem 0.75rem; font-size: 0.825rem; color: #991b1b; font-weight: 500;">
                                    ✗ ${window.escapeHTML(s.skill.name)}
                                </span>
                                <a href="roadmap.html?skill=${encodeURIComponent(s.skill.name)}" target="_blank" style="padding: 0.4rem 0.75rem; font-size: 0.75rem; background: #fee2e2; color: #b91c1c; font-weight: 600; text-decoration: none; border-left: 1px solid #fca5a5; display: flex; align-items: center; gap: 0.25rem; transition: background 0.2s;" onmouseover="this.style.background='#fca5a5'; this.style.color='#7f1d1d'" onmouseout="this.style.background='#fee2e2'; this.style.color='#b91c1c'">
                                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                                        <path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445z"/>
                                    </svg>
                                    Roadmap
                                </a>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // 3. Bonus Competencies
        if (gapAnalysis.bonus_competencies && gapAnalysis.bonus_competencies.length > 0) {
            html += `
                <div class="card" style="border-left: 4px solid var(--info); padding: 1.25rem 1.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <h4 style="font-size: 1rem; color: #1e40af; display: flex; align-items: center; gap: 0.4rem;">
                            <span>★</span> Bonus Preferred Competencies (${gapAnalysis.bonus_competencies.length})
                        </h4>
                        <span class="badge badge-blue">+25% Boost</span>
                    </div>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.75rem;">
                        You have these preferred nice-to-have capabilities which set you apart from other applicants.
                    </p>
                    <div class="skill-tags">
                        ${gapAnalysis.bonus_competencies.map(s => {
                            if (s.is_partial) {
                                return `<span class="badge badge-purple" style="padding: 0.4rem 0.85rem; font-size: 0.825rem;" title="Partial match via semantic equivalency">
                                    ★ ${window.escapeHTML(s.skill.name)} (Partial)
                                </span>`;
                            }
                            return `<span class="badge badge-blue" style="padding: 0.4rem 0.85rem; font-size: 0.825rem;">
                                ★ ${window.escapeHTML(s.skill.name)}
                            </span>`;
                        }).join('')}
                    </div>
                </div>
            `;
        }
        
        html += `</div>`;
        container.innerHTML = html;
    }
}

window.MatchingUI = MatchingUI;
