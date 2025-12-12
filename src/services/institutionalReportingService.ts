import { supabase } from '../lib/supabase';
import jsPDF from 'jspdf';

export interface RecruitmentReport {
  job_id: string;
  job_title: string;
  company_name: string;
  period_start: string;
  period_end: string;
  total_applications: number;
  shortlisted_count: number;
  interviews_conducted: number;
  offers_made: number;
  hires_completed: number;
  average_ai_score: number;
  average_interview_score?: number;
  average_time_to_hire_days: number;
  top_candidates: Array<{
    candidate_name: string;
    ai_score?: number;
    interview_score?: number;
    recommendation?: string;
    status: string;
  }>;
  pipeline_breakdown: Record<string, number>;
}

export const institutionalReportingService = {
  async checkEnterpriseAccess(companyId: string): Promise<boolean> {
    try {
      const { data: subscription } = await supabase
        .from('enterprise_subscriptions')
        .select('subscription_type, features')
        .eq('company_id', companyId)
        .eq('status', 'active')
        .maybeSingle();

      if (!subscription) return false;

      const allowedTypes = ['ENTERPRISE_PRO', 'ENTERPRISE_GOLD', 'CABINET_RH'];
      return allowedTypes.includes(subscription.subscription_type);
    } catch (error) {
      console.error('Error checking enterprise access:', error);
      return false;
    }
  },

  async generateJobReport(jobId: string): Promise<RecruitmentReport | null> {
    try {
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select(`
          id,
          title,
          created_at,
          company:companies(
            id,
            name
          )
        `)
        .eq('id', jobId)
        .single();

      if (jobError || !job) {
        console.error('Error fetching job:', jobError);
        return null;
      }

      const companyId = (job.company as any).id;

      const hasAccess = await this.checkEnterpriseAccess(companyId);
      if (!hasAccess) {
        console.error('Enterprise access required for institutional reporting');
        return null;
      }

      const { data: applications } = await supabase
        .from('applications')
        .select(`
          id,
          candidate_id,
          ai_match_score,
          applied_at,
          workflow_stage,
          is_shortlisted,
          candidate:profiles!applications_candidate_id_fkey(full_name)
        `)
        .eq('job_id', jobId);

      const { data: interviews } = await supabase
        .from('interviews')
        .select(`
          id,
          application_id,
          status,
          completed_at,
          evaluation:interview_evaluations(
            overall_score,
            recommendation
          )
        `)
        .eq('job_id', jobId);

      const totalApplications = applications?.length || 0;
      const shortlistedCount = applications?.filter(a => a.is_shortlisted).length || 0;
      const interviewsConducted = interviews?.filter(i => i.status === 'completed').length || 0;

      const offersCount = applications?.filter(a => a.workflow_stage === 'offer_sent').length || 0;
      const hiresCount = applications?.filter(a => a.workflow_stage === 'hired').length || 0;

      const avgAiScore = applications && applications.length > 0
        ? applications.reduce((sum, a) => sum + (a.ai_match_score || 0), 0) / applications.length
        : 0;

      const evaluatedInterviews = interviews?.filter(i => i.evaluation && i.evaluation.length > 0) || [];
      const avgInterviewScore = evaluatedInterviews.length > 0
        ? evaluatedInterviews.reduce((sum, i) => sum + ((i.evaluation as any)[0]?.overall_score || 0), 0) / evaluatedInterviews.length
        : undefined;

      const hiredApplications = applications?.filter(a => a.workflow_stage === 'hired' && a.applied_at) || [];
      const avgTimeToHire = hiredApplications.length > 0
        ? hiredApplications.reduce((sum, a) => {
            const hiredDate = new Date();
            const appliedDate = new Date(a.applied_at);
            const days = Math.floor((hiredDate.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24));
            return sum + days;
          }, 0) / hiredApplications.length
        : 0;

      const topCandidates = applications
        ?.map(app => {
          const interview = interviews?.find(i => i.application_id === app.id && i.status === 'completed');
          const evaluation = interview?.evaluation ? (interview.evaluation as any)[0] : null;

          return {
            candidate_name: (app.candidate as any)?.full_name || 'Candidat anonyme',
            ai_score: app.ai_match_score,
            interview_score: evaluation?.overall_score,
            recommendation: evaluation?.recommendation,
            status: app.workflow_stage
          };
        })
        .sort((a, b) => {
          const scoreA = a.interview_score || a.ai_score || 0;
          const scoreB = b.interview_score || b.ai_score || 0;
          return scoreB - scoreA;
        })
        .slice(0, 10) || [];

      const pipelineBreakdown: Record<string, number> = {};
      applications?.forEach(app => {
        const stage = app.workflow_stage || 'unknown';
        pipelineBreakdown[stage] = (pipelineBreakdown[stage] || 0) + 1;
      });

      const report: RecruitmentReport = {
        job_id: jobId,
        job_title: job.title,
        company_name: (job.company as any).name,
        period_start: job.created_at,
        period_end: new Date().toISOString(),
        total_applications: totalApplications,
        shortlisted_count: shortlistedCount,
        interviews_conducted: interviewsConducted,
        offers_made: offersCount,
        hires_completed: hiresCount,
        average_ai_score: Math.round(avgAiScore),
        average_interview_score: avgInterviewScore ? Math.round(avgInterviewScore) : undefined,
        average_time_to_hire_days: Math.round(avgTimeToHire),
        top_candidates: topCandidates,
        pipeline_breakdown: pipelineBreakdown
      };

      return report;
    } catch (error) {
      console.error('Error generating job report:', error);
      return null;
    }
  },

  async generatePDF(report: RecruitmentReport): Promise<Blob> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = margin;

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Rapport de Recrutement', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(report.company_name, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Offre: ${report.job_title}`, margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const startDate = new Date(report.period_start).toLocaleDateString('fr-FR');
    const endDate = new Date(report.period_end).toLocaleDateString('fr-FR');
    doc.text(`Période: ${startDate} - ${endDate}`, margin, yPos);
    yPos += 15;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Statistiques Globales', margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const stats = [
      `Candidatures reçues: ${report.total_applications}`,
      `Shortlistés: ${report.shortlisted_count}`,
      `Entretiens réalisés: ${report.interviews_conducted}`,
      `Offres envoyées: ${report.offers_made}`,
      `Embauches: ${report.hires_completed}`,
      `Score IA moyen: ${report.average_ai_score}%`,
      report.average_interview_score ? `Score entretien moyen: ${report.average_interview_score}%` : null,
      `Délai moyen d'embauche: ${report.average_time_to_hire_days} jours`
    ].filter(Boolean);

    stats.forEach(stat => {
      if (stat) {
        doc.text(stat, margin + 5, yPos);
        yPos += 6;
      }
    });

    yPos += 10;

    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Répartition par Étape', margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    Object.entries(report.pipeline_breakdown).forEach(([stage, count]) => {
      doc.text(`${stage}: ${count}`, margin + 5, yPos);
      yPos += 6;

      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = margin;
      }
    });

    yPos += 10;

    if (yPos > pageHeight - 80) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Top 10 Candidats', margin, yPos);
    yPos += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    report.top_candidates.forEach((candidate, index) => {
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = margin;
      }

      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${candidate.candidate_name}`, margin + 5, yPos);
      yPos += 5;

      doc.setFont('helvetica', 'normal');
      const candidateInfo = [];
      if (candidate.ai_score) candidateInfo.push(`IA: ${candidate.ai_score}%`);
      if (candidate.interview_score) candidateInfo.push(`Entretien: ${candidate.interview_score}%`);
      if (candidate.recommendation) candidateInfo.push(`Recommandation: ${candidate.recommendation}`);
      candidateInfo.push(`Statut: ${candidate.status}`);

      doc.text(candidateInfo.join(' | '), margin + 10, yPos);
      yPos += 8;
    });

    yPos = pageHeight - 20;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} par JobGuinée`, pageWidth / 2, yPos, { align: 'center' });

    return doc.output('blob');
  },

  async downloadReport(jobId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const report = await this.generateJobReport(jobId);

      if (!report) {
        return { success: false, error: 'Impossible de générer le rapport' };
      }

      const pdfBlob = await this.generatePDF(report);

      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rapport-recrutement-${report.job_title.replace(/\s+/g, '-').toLowerCase()}-${new Date().getTime()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return { success: true };
    } catch (error: any) {
      console.error('Error downloading report:', error);
      return { success: false, error: error.message };
    }
  }
};
