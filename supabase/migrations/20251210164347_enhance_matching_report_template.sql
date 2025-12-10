/*
  # Enhance Matching Report Template

  Update template for better visualization of 8-axis matching scores
  with detailed sub-scores, strengths, gaps, and recommendations
*/

UPDATE ia_service_templates
SET
  template_structure = '<div class="matching-report" style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; background: #f8f9fa; border-radius: 12px;">

  <!-- HEADER -->
  <div style="background: linear-gradient(135deg, #0E2F56 0%, #1e5a96 100%); color: white; padding: 40px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="margin: 0 0 10px 0; font-size: 28px; font-weight: 700;">Analyse de Compatibilité</h1>
    <p style="margin: 0; opacity: 0.9;">Matching Candidat - Offre d''emploi</p>
  </div>

  <!-- MAIN SCORE -->
  <div style="background: white; padding: 30px; border-bottom: 2px solid #e0e0e0; text-align: center;">
    <div style="display: flex; align-items: center; justify-content: center; gap: 20px;">
      <div style="flex-shrink: 0;">
        <div style="width: 120px; height: 120px; border-radius: 50%; background: conic-gradient(#10b981 {{score_global}}%, #e5e7eb {{score_global}}%); display: flex; align-items: center; justify-content: center;">
          <div style="width: 110px; height: 110px; border-radius: 50%; background: white; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <span style="font-size: 36px; font-weight: 700; color: #0E2F56;">{{score_global}}</span>
            <span style="font-size: 12px; color: #666;">/100</span>
          </div>
        </div>
      </div>
      <div style="flex-grow: 1; text-align: left;">
        <p style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #0E2F56;">Niveau: <span style="{{#if niveau}}{{#eq niveau ''Excellent''}}color: #10b981{{/eq}}{{#eq niveau ''Très fort''}}color: #3b82f6{{/eq}}{{#eq niveau ''Bon''}}color: #f59e0b{{/eq}}{{#eq niveau ''Moyen''}}color: #ef4444{{/eq}}{{#eq niveau ''Faible''}}color: #7c3aed{{/eq}}{{/if}}">{{niveau}}</span></p>
        <p style="margin: 0; color: #666; font-size: 14px;">{{hiring_risk_level}} - {{hiring_risk_reason}}</p>
        <p style="margin: 8px 0 0 0; color: #666; font-size: 14px;">Potentiel développement: {{potential_development}}</p>
      </div>
    </div>
  </div>

  <!-- 8 AXIS SUB-SCORES -->
  <div style="background: white; padding: 30px; border-bottom: 2px solid #e0e0e0;">
    <h2 style="margin: 0 0 20px 0; font-size: 20px; font-weight: 600; color: #1f2937;">Évaluation par Axe (8 Critères)</h2>
    
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
      <!-- Skills -->
      <div style="padding: 15px; background: #f0f4ff; border-left: 4px solid #3b82f6; border-radius: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-weight: 600; color: #1f2937;">Compétences</span>
          <span style="font-weight: 700; color: #3b82f6;">{{sub_scores.skills}}/100</span>
        </div>
        <div style="height: 6px; background: #dbeafe; border-radius: 3px; overflow: hidden;">
          <div style="height: 100%; background: #3b82f6; width: {{sub_scores.skills}}%; transition: width 0.3s;"></div>
        </div>
      </div>

      <!-- Experience -->
      <div style="padding: 15px; background: #f0fdf4; border-left: 4px solid #10b981; border-radius: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-weight: 600; color: #1f2937;">Expérience</span>
          <span style="font-weight: 700; color: #10b981;">{{sub_scores.experience}}/100</span>
        </div>
        <div style="height: 6px; background: #dcfce7; border-radius: 3px; overflow: hidden;">
          <div style="height: 100%; background: #10b981; width: {{sub_scores.experience}}%; transition: width 0.3s;"></div>
        </div>
      </div>

      <!-- Education -->
      <div style="padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-weight: 600; color: #1f2937;">Formation</span>
          <span style="font-weight: 700; color: #f59e0b;">{{sub_scores.education}}/100</span>
        </div>
        <div style="height: 6px; background: #fde68a; border-radius: 3px; overflow: hidden;">
          <div style="height: 100%; background: #f59e0b; width: {{sub_scores.education}}%; transition: width 0.3s;"></div>
        </div>
      </div>

      <!-- Tools -->
      <div style="padding: 15px; background: #f3e8ff; border-left: 4px solid #8b5cf6; border-radius: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-weight: 600; color: #1f2937;">Outils/Tech</span>
          <span style="font-weight: 700; color: #8b5cf6;">{{sub_scores.tools}}/100</span>
        </div>
        <div style="height: 6px; background: #ede9fe; border-radius: 3px; overflow: hidden;">
          <div style="height: 100%; background: #8b5cf6; width: {{sub_scores.tools}}%; transition: width 0.3s;"></div>
        </div>
      </div>

      <!-- Soft Skills -->
      <div style="padding: 15px; background: #fce7f3; border-left: 4px solid #ec4899; border-radius: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-weight: 600; color: #1f2937;">Soft Skills</span>
          <span style="font-weight: 700; color: #ec4899;">{{sub_scores.soft_skills}}/100</span>
        </div>
        <div style="height: 6px; background: #fbcfe8; border-radius: 3px; overflow: hidden;">
          <div style="height: 100%; background: #ec4899; width: {{sub_scores.soft_skills}}%; transition: width 0.3s;"></div>
        </div>
      </div>

      <!-- Languages -->
      <div style="padding: 15px; background: #dbeafe; border-left: 4px solid #06b6d4; border-radius: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-weight: 600; color: #1f2937;">Langues</span>
          <span style="font-weight: 700; color: #06b6d4;">{{sub_scores.languages}}/100</span>
        </div>
        <div style="height: 6px; background: #cffafe; border-radius: 3px; overflow: hidden;">
          <div style="height: 100%; background: #06b6d4; width: {{sub_scores.languages}}%; transition: width 0.3s;"></div>
        </div>
      </div>

      <!-- Location -->
      <div style="padding: 15px; background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-weight: 600; color: #1f2937;">Localisation</span>
          <span style="font-weight: 700; color: #ef4444;">{{sub_scores.location}}/100</span>
        </div>
        <div style="height: 6px; background: #fee2e2; border-radius: 3px; overflow: hidden;">
          <div style="height: 100%; background: #ef4444; width: {{sub_scores.location}}%; transition: width 0.3s;"></div>
        </div>
      </div>

      <!-- Salary -->
      <div style="padding: 15px; background: #f0fdfa; border-left: 4px solid: #14b8a6; border-radius: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-weight: 600; color: #1f2937;">Salaire</span>
          <span style="font-weight: 700; color: #14b8a6;">{{sub_scores.salary_match}}/100</span>
        </div>
        <div style="height: 6px; background: #ccfbf1; border-radius: 3px; overflow: hidden;">
          <div style="height: 100%; background: #14b8a6; width: {{sub_scores.salary_match}}%; transition: width 0.3s;"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- STRENGTHS -->
  {{#if strengths}}
  <div style="background: white; padding: 30px; border-bottom: 2px solid #e0e0e0;">
    <h2 style="margin: 0 0 15px 0; font-size: 18px; font-weight: 600; color: #10b981;">✓ Points Forts</h2>
    <ul style="margin: 0; padding-left: 20px; list-style: none;">
      {{#each strengths}}
      <li style="margin: 10px 0; color: #374151; padding-left: 20px; position: relative;">
        <span style="position: absolute; left: 0; color: #10b981; font-weight: 700;">→</span>
        {{this}}
      </li>
      {{/each}}
    </ul>
  </div>
  {{/if}}

  <!-- GAPS -->
  {{#if gaps}}
  <div style="background: white; padding: 30px; border-bottom: 2px solid #e0e0e0;">
    <h2 style="margin: 0 0 15px 0; font-size: 18px; font-weight: 600; color: #ef4444;">✗ Lacunes Identifiées</h2>
    <ul style="margin: 0; padding-left: 20px; list-style: none;">
      {{#each gaps}}
      <li style="margin: 10px 0; color: #374151; padding-left: 20px; position: relative;">
        <span style="position: absolute; left: 0; color: #ef4444; font-weight: 700;">→</span>
        {{this}}
      </li>
      {{/each}}
    </ul>
  </div>
  {{/if}}

  <!-- MATCHED SKILLS -->
  {{#if skills_matched}}
  <div style="background: white; padding: 30px; border-bottom: 2px solid #e0e0e0;">
    <h2 style="margin: 0 0 15px 0; font-size: 18px; font-weight: 600; color: #0E2F56;">Compétences Correspondantes</h2>
    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
      {{#each skills_matched}}
      <span style="background: #dbeafe; color: #1e40af; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 500;">{{this}}</span>
      {{/each}}
    </div>
  </div>
  {{/if}}

  <!-- MISSING SKILLS -->
  {{#if skills_missing}}
  <div style="background: white; padding: 30px; border-bottom: 2px solid #e0e0e0;">
    <h2 style="margin: 0 0 15px 0; font-size: 18px; font-weight: 600; color: #0E2F56;">Compétences Manquantes</h2>
    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
      {{#each skills_missing}}
      <span style="background: #fee2e2; color: #991b1b; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 500;">{{this}}</span>
      {{/each}}
    </div>
  </div>
  {{/if}}

  <!-- IMPROVEMENTS -->
  {{#if improvement_suggestions}}
  <div style="background: white; padding: 30px; border-bottom: 2px solid #e0e0e0;">
    <h2 style="margin: 0 0 15px 0; font-size: 18px; font-weight: 600; color: #f59e0b;">Suggestions d''Amélioration</h2>
    <ul style="margin: 0; padding-left: 20px; list-style: none;">
      {{#each improvement_suggestions}}
      <li style="margin: 10px 0; color: #374151; padding-left: 20px; position: relative;">
        <span style="position: absolute; left: 0; color: #f59e0b; font-weight: 700;">→</span>
        {{this}}
      </li>
      {{/each}}
    </ul>
  </div>
  {{/if}}

  <!-- TRAINING RECOMMENDATIONS -->
  {{#if training_recommendations}}
  <div style="background: white; padding: 30px; border-bottom: 2px solid #e0e0e0;">
    <h2 style="margin: 0 0 15px 0; font-size: 18px; font-weight: 600; color: #8b5cf6;">Formations Recommandées</h2>
    <ul style="margin: 0; padding-left: 20px; list-style: none;">
      {{#each training_recommendations}}
      <li style="margin: 10px 0; color: #374151; padding-left: 20px; position: relative;">
        <span style="position: absolute; left: 0; color: #8b5cf6; font-weight: 700;">→</span>
        {{this}}
      </li>
      {{/each}}
    </ul>
  </div>
  {{/if}}

  <!-- NEGOTIATION POINTS -->
  {{#if negotiation_points}}
  <div style="background: white; padding: 30px; border-bottom: 2px solid #e0e0e0;">
    <h2 style="margin: 0 0 15px 0; font-size: 18px; font-weight: 600; color: #0E2F56;">Points de Négociation</h2>
    <ul style="margin: 0; padding-left: 20px; list-style: none;">
      {{#each negotiation_points}}
      <li style="margin: 10px 0; color: #374151; padding-left: 20px; position: relative;">
        <span style="position: absolute; left: 0; color: #06b6d4; font-weight: 700;">→</span>
        {{this}}
      </li>
      {{/each}}
    </ul>
  </div>
  {{/if}}

  <!-- FOOTER -->
  <div style="background: #f3f4f6; padding: 20px; border-radius: 0 0 12px 12px; text-align: center; color: #666; font-size: 12px;">
    <p style="margin: 0;">Rapport généré par JobGuinée IA Matching Service</p>
    <p style="margin: 5px 0 0 0; color: #999;">Analyse détaillée basée sur profil complet + CV + offre d''emploi</p>
  </div>

</div>'
WHERE service_code = 'ai_matching'
AND template_name = 'Rapport Compatibilite';
