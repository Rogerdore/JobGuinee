import { supabase } from '../lib/supabase';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { EnterpriseSubscriptionService } from './enterpriseSubscriptionService';

export interface ApplicationExportData {
  id: string;
  candidate_name: string;
  candidate_email: string;
  candidate_phone?: string;
  candidate_title?: string;
  experience_years?: number;
  education_level?: string;
  skills?: string[];
  ai_score: number;
  ai_category: string;
  workflow_stage: string;
  applied_at: string;
  cv_url?: string;
  cover_letter?: string;
}

export interface ExportOptions {
  jobId?: string;
  stage?: string;
  applicationIds?: string[];
  companyId?: string;
}

export const recruiterExportService = {
  async getApplicationsForExport(options: ExportOptions): Promise<ApplicationExportData[]> {
    try {
      let query = supabase
        .from('applications')
        .select(`
          id,
          ai_score,
          ai_category,
          workflow_stage,
          applied_at,
          cv_url,
          cover_letter,
          candidate:candidate_profiles!applications_candidate_id_fkey(
            title,
            years_of_experience,
            education,
            skills,
            profile:profiles!candidate_profiles_profile_id_fkey(
              full_name,
              email,
              phone
            )
          )
        `);

      if (options.jobId) {
        query = query.eq('job_id', options.jobId);
      }

      if (options.stage) {
        query = query.eq('workflow_stage', options.stage);
      }

      if (options.applicationIds && options.applicationIds.length > 0) {
        query = query.in('id', options.applicationIds);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching applications:', error);
        return [];
      }

      return (data || []).map((app: any) => ({
        id: app.id,
        candidate_name: app.candidate?.profile?.full_name || 'N/A',
        candidate_email: app.candidate?.profile?.email || 'N/A',
        candidate_phone: app.candidate?.profile?.phone,
        candidate_title: app.candidate?.title,
        experience_years: app.candidate?.years_of_experience,
        education_level: app.candidate?.education,
        skills: app.candidate?.skills || [],
        ai_score: app.ai_score || 0,
        ai_category: app.ai_category || 'non_evalue',
        workflow_stage: app.workflow_stage,
        applied_at: app.applied_at,
        cv_url: app.cv_url,
        cover_letter: app.cover_letter
      }));
    } catch (error) {
      console.error('Error in getApplicationsForExport:', error);
      return [];
    }
  },

  async exportToCSV(options: ExportOptions, filename: string = 'candidatures.csv'): Promise<void> {
    try {
      if (options.companyId) {
        const access = await EnterpriseSubscriptionService.checkFeatureAccess(
          options.companyId,
          'export' as any,
          1
        );
        if (!access.allowed) {
          alert(access.message || 'Accès aux exports limité. Veuillez upgrader votre pack.');
          return;
        }
      }

      const data = await this.getApplicationsForExport(options);

      if (data.length === 0) {
        alert('Aucune donnée à exporter');
        return;
      }

      const headers = [
        'Nom',
        'Email',
        'Téléphone',
        'Titre',
        'Expérience (années)',
        'Formation',
        'Compétences',
        'Score IA',
        'Catégorie IA',
        'Statut',
        'Date candidature'
      ];

      const rows = data.map(app => [
        app.candidate_name,
        app.candidate_email,
        app.candidate_phone || '',
        app.candidate_title || '',
        app.experience_years?.toString() || '',
        app.education_level || '',
        (app.skills || []).join(', '),
        app.ai_score.toString(),
        app.ai_category,
        app.workflow_stage,
        new Date(app.applied_at).toLocaleDateString('fr-FR')
      ]);

      const csvContent = [
        headers.join(';'),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
      ].join('\n');

      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, filename);

      if (options.companyId) {
        await EnterpriseSubscriptionService.trackUsage(
          options.companyId,
          'export',
          { format: 'csv', rows: data.length }
        );
      }
    } catch (error) {
      console.error('Error in exportToCSV:', error);
      alert('Erreur lors de l\'export CSV');
    }
  },

  async exportToExcel(options: ExportOptions, filename: string = 'candidatures.xlsx'): Promise<void> {
    try {
      if (options.companyId) {
        const access = await EnterpriseSubscriptionService.checkFeatureAccess(
          options.companyId,
          'export' as any,
          1
        );
        if (!access.allowed) {
          alert(access.message || 'Accès aux exports limité. Veuillez upgrader votre pack.');
          return;
        }
      }

      const data = await this.getApplicationsForExport(options);

      if (data.length === 0) {
        alert('Aucune donnée à exporter');
        return;
      }

      const headers = [
        'Nom',
        'Email',
        'Téléphone',
        'Titre',
        'Expérience',
        'Formation',
        'Compétences',
        'Score IA',
        'Catégorie',
        'Statut',
        'Date'
      ];

      const rows = data.map(app => [
        app.candidate_name,
        app.candidate_email,
        app.candidate_phone || '',
        app.candidate_title || '',
        app.experience_years?.toString() || '',
        app.education_level || '',
        (app.skills || []).join(', '),
        app.ai_score,
        app.ai_category,
        app.workflow_stage,
        new Date(app.applied_at).toLocaleDateString('fr-FR')
      ]);

      let csvContent = headers.join('\t') + '\n';
      rows.forEach(row => {
        csvContent += row.join('\t') + '\n';
      });

      const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel' });
      saveAs(blob, filename);

      if (options.companyId) {
        await EnterpriseSubscriptionService.trackUsage(
          options.companyId,
          'export',
          { format: 'excel', rows: data.length }
        );
      }
    } catch (error) {
      console.error('Error in exportToExcel:', error);
      alert('Erreur lors de l\'export Excel');
    }
  },

  async exportToPDF(options: ExportOptions, jobTitle: string, filename: string = 'rapport-candidatures.pdf'): Promise<void> {
    try {
      if (options.companyId) {
        const access = await EnterpriseSubscriptionService.checkFeatureAccess(
          options.companyId,
          'export' as any,
          1
        );
        if (!access.allowed) {
          alert(access.message || 'Accès aux exports limité. Veuillez upgrader votre pack.');
          return;
        }
      }

      const data = await this.getApplicationsForExport(options);

      if (data.length === 0) {
        alert('Aucune donnée à exporter');
        return;
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #0E2F56; border-bottom: 3px solid #FF8C00; padding-bottom: 10px; }
            .header { margin-bottom: 30px; }
            .stats { display: flex; gap: 20px; margin-bottom: 30px; }
            .stat-box { background: #f5f5f5; padding: 15px; border-radius: 8px; flex: 1; }
            .stat-box h3 { margin: 0; color: #0E2F56; font-size: 24px; }
            .stat-box p { margin: 5px 0 0 0; color: #666; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #0E2F56; color: white; padding: 12px; text-align: left; font-size: 12px; }
            td { padding: 10px; border-bottom: 1px solid #ddd; font-size: 11px; }
            tr:nth-child(even) { background: #f9f9f9; }
            .score-high { color: #10b981; font-weight: bold; }
            .score-medium { color: #f59e0b; font-weight: bold; }
            .score-low { color: #ef4444; font-weight: bold; }
            .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Rapport de Candidatures - ${jobTitle}</h1>
            <p>Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
          </div>

          <div class="stats">
            <div class="stat-box">
              <h3>${data.length}</h3>
              <p>Candidatures totales</p>
            </div>
            <div class="stat-box">
              <h3>${data.filter(a => a.ai_score >= 75).length}</h3>
              <p>Profils forts (≥75%)</p>
            </div>
            <div class="stat-box">
              <h3>${Math.round(data.reduce((acc, a) => acc + a.ai_score, 0) / data.length) || 0}%</h3>
              <p>Score moyen</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Candidat</th>
                <th>Email</th>
                <th>Titre</th>
                <th>Expérience</th>
                <th>Score IA</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(app => `
                <tr>
                  <td>${app.candidate_name}</td>
                  <td>${app.candidate_email}</td>
                  <td>${app.candidate_title || '-'}</td>
                  <td>${app.experience_years ? app.experience_years + ' ans' : '-'}</td>
                  <td class="${app.ai_score >= 75 ? 'score-high' : app.ai_score >= 50 ? 'score-medium' : 'score-low'}">
                    ${app.ai_score}%
                  </td>
                  <td>${app.workflow_stage}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>JobGuinée - Plateforme de recrutement intelligente</p>
          </div>
        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          if (options.companyId) {
            EnterpriseSubscriptionService.trackUsage(
              options.companyId,
              'export',
              { format: 'pdf', rows: data.length }
            );
          }
        }, 250);
      }
    } catch (error) {
      console.error('Error in exportToPDF:', error);
      alert('Erreur lors de l\'export PDF');
    }
  },

  async exportDocumentsToZIP(options: ExportOptions, filename: string = 'documents-candidatures.zip'): Promise<void> {
    try {
      if (options.companyId) {
        const access = await EnterpriseSubscriptionService.checkFeatureAccess(
          options.companyId,
          'export' as any,
          1
        );
        if (!access.allowed) {
          alert(access.message || 'Accès aux exports limité. Veuillez upgrader votre pack.');
          return;
        }
      }

      const data = await this.getApplicationsForExport(options);

      if (data.length === 0) {
        alert('Aucune donnée à exporter');
        return;
      }

      const zip = new JSZip();
      let fileCount = 0;

      for (const app of data) {
        if (app.cv_url) {
          try {
            const response = await fetch(app.cv_url);
            if (response.ok) {
              const blob = await response.blob();
              const extension = app.cv_url.split('.').pop() || 'pdf';
              const sanitizedName = app.candidate_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
              zip.file(`${sanitizedName}_cv.${extension}`, blob);
              fileCount++;
            }
          } catch (error) {
            console.error(`Failed to fetch CV for ${app.candidate_name}:`, error);
          }
        }

        if (app.cover_letter) {
          const sanitizedName = app.candidate_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
          zip.file(`${sanitizedName}_lettre.txt`, app.cover_letter);
          fileCount++;
        }
      }

      if (fileCount === 0) {
        alert('Aucun document à exporter');
        return;
      }

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, filename);

      if (options.companyId) {
        await EnterpriseSubscriptionService.trackUsage(
          options.companyId,
          'export',
          { format: 'zip', files: fileCount }
        );
      }
    } catch (error) {
      console.error('Error in exportDocumentsToZIP:', error);
      alert('Erreur lors de la création du fichier ZIP');
    }
  }
};
