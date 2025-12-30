import jsPDF from 'jspdf';
import { supabase } from '../lib/supabase';

export interface CandidateProfile {
  name: string;
  position: string;
  experience_years: number;
  education: string;
  match_score?: number;
  strengths: string[];
  weaknesses?: string[];
  hr_comments: string;
  recommendation: 'highly_recommended' | 'recommended' | 'conditional' | 'not_recommended';
  salary_expectation?: string;
}

export interface MissionReportData {
  report_number: string;
  report_date: string;
  report_type: 'initial_analysis' | 'candidate_shortlist' | 'interview_summary' | 'final_recommendation' | 'post_placement_followup';
  mission_name: string;
  client_company: string;
  client_logo?: string;
  position_title?: string;
  positions_count?: number;
  executive_summary: string;
  candidates_evaluated: number;
  candidates_shortlisted: number;
  candidates_interviewed: number;
  candidate_profiles: CandidateProfile[];
  market_insights?: string;
  recommendations: string;
  next_steps?: string;
  consultant_name: string;
  consultant_title: string;
}

class MissionReportPDFService {
  private readonly PAGE_WIDTH = 210;
  private readonly MARGIN_LEFT = 20;
  private readonly MARGIN_RIGHT = 20;

  async generateReportPDF(reportId: string): Promise<{ success: boolean; pdfUrl?: string; error?: string }> {
    try {
      const { data: report, error } = await supabase
        .from('b2b_mission_reports')
        .select(`
          *,
          mission:b2b_missions(*),
          generated_by:profiles(full_name, email)
        `)
        .eq('id', reportId)
        .single();

      if (error || !report) {
        throw new Error('Rapport introuvable');
      }

      const reportData: MissionReportData = {
        report_number: `REP-${report.id.substring(0, 8).toUpperCase()}`,
        report_date: new Date(report.created_at).toLocaleDateString('fr-FR'),
        report_type: report.report_type,
        mission_name: report.mission?.mission_name || 'Mission RH',
        client_company: report.mission?.client_company || '',
        position_title: report.mission?.job_title,
        positions_count: report.mission?.positions_count,
        executive_summary: report.executive_summary || '',
        candidates_evaluated: report.candidates_evaluated || 0,
        candidates_shortlisted: report.candidates_shortlisted || 0,
        candidates_interviewed: report.candidates_interviewed || 0,
        candidate_profiles: report.candidate_profiles || [],
        market_insights: report.market_insights,
        recommendations: report.recommendations || '',
        next_steps: report.next_steps,
        consultant_name: report.generated_by?.full_name || 'Consultant JobGuinée',
        consultant_title: 'Consultant RH Senior'
      };

      const pdfBlob = this.createPDF(reportData);
      const fileName = `rapport_${reportData.report_number}.pdf`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('b2b-documents')
        .upload(`reports/${fileName}`, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('b2b-documents')
        .getPublicUrl(`reports/${fileName}`);

      await supabase
        .from('b2b_documents')
        .insert({
          mission_id: report.mission_id,
          document_type: 'mission_report',
          document_title: report.report_title,
          file_path: uploadData.path,
          file_name: fileName,
          mime_type: 'application/pdf',
          accessible_by_client: true
        });

      await supabase
        .from('b2b_mission_reports')
        .update({
          pdf_url: urlData.publicUrl,
          report_status: 'approved'
        })
        .eq('id', reportId);

      return { success: true, pdfUrl: urlData.publicUrl };
    } catch (error: any) {
      console.error('Error generating report PDF:', error);
      return { success: false, error: error.message };
    }
  }

  private createPDF(data: MissionReportData): Blob {
    const doc = new jsPDF();
    let yPos = 20;

    yPos = this.drawHeader(doc, data, yPos);

    yPos = this.drawExecutiveSummary(doc, data, yPos);

    yPos = this.drawStatistics(doc, data, yPos);

    if (data.candidate_profiles && data.candidate_profiles.length > 0) {
      yPos = this.drawCandidateProfiles(doc, data, yPos);
    }

    if (data.market_insights) {
      yPos = this.drawMarketInsights(doc, data, yPos);
    }

    yPos = this.drawRecommendations(doc, data, yPos);

    if (data.next_steps) {
      yPos = this.drawNextSteps(doc, data, yPos);
    }

    this.drawFooter(doc, data);

    return doc.output('blob');
  }

  private drawHeader(doc: jsPDF, data: MissionReportData, startY: number): number {
    let yPos = startY;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(14, 47, 86);
    doc.text('JOBGUINÉE', this.MARGIN_LEFT, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Externalisation RH - Expertise & Excellence', this.MARGIN_LEFT, yPos);
    yPos += 15;

    doc.setFillColor(14, 47, 86);
    doc.rect(0, yPos, this.PAGE_WIDTH, 25, 'F');

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    const reportTitle = this.getReportTypeTitle(data.report_type);
    doc.text(reportTitle, this.PAGE_WIDTH / 2, yPos + 10, { align: 'center' });
    doc.setFontSize(11);
    doc.text(data.mission_name, this.PAGE_WIDTH / 2, yPos + 18, { align: 'center' });
    yPos += 30;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Client: ${data.client_company}`, this.MARGIN_LEFT, yPos);
    doc.text(`Date: ${data.report_date}`, this.PAGE_WIDTH - this.MARGIN_RIGHT, yPos, { align: 'right' });
    yPos += 5;
    doc.text(`Rapport N°: ${data.report_number}`, this.MARGIN_LEFT, yPos);
    if (data.position_title) {
      yPos += 5;
      doc.text(`Poste: ${data.position_title}`, this.MARGIN_LEFT, yPos);
    }
    yPos += 15;

    return yPos;
  }

  private drawExecutiveSummary(doc: jsPDF, data: MissionReportData, startY: number): number {
    let yPos = startY;

    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor(245, 245, 245);
    doc.rect(this.MARGIN_LEFT, yPos - 3, this.PAGE_WIDTH - this.MARGIN_LEFT - this.MARGIN_RIGHT, 8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(14, 47, 86);
    doc.text('SYNTHÈSE EXÉCUTIVE', this.MARGIN_LEFT + 2, yPos + 3);
    yPos += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const summaryLines = doc.splitTextToSize(data.executive_summary, this.PAGE_WIDTH - this.MARGIN_LEFT - this.MARGIN_RIGHT);
    doc.text(summaryLines, this.MARGIN_LEFT, yPos);
    yPos += summaryLines.length * 5 + 10;

    return yPos;
  }

  private drawStatistics(doc: jsPDF, data: MissionReportData, startY: number): number {
    let yPos = startY;

    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor(245, 245, 245);
    doc.rect(this.MARGIN_LEFT, yPos - 3, this.PAGE_WIDTH - this.MARGIN_LEFT - this.MARGIN_RIGHT, 8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(14, 47, 86);
    doc.text('INDICATEURS CLÉS', this.MARGIN_LEFT + 2, yPos + 3);
    yPos += 12;

    const stats = [
      { label: 'Candidats évalués', value: data.candidates_evaluated, color: [59, 130, 246] },
      { label: 'Candidats présélectionnés', value: data.candidates_shortlisted, color: [16, 185, 129] },
      { label: 'Entretiens menés', value: data.candidates_interviewed, color: [245, 158, 11] }
    ];

    const boxWidth = 55;
    const boxHeight = 25;
    let xPos = this.MARGIN_LEFT;

    stats.forEach((stat, index) => {
      doc.setFillColor(...stat.color);
      doc.rect(xPos, yPos, boxWidth, boxHeight, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.text(stat.value.toString(), xPos + boxWidth / 2, yPos + 12, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(stat.label, xPos + boxWidth / 2, yPos + 20, { align: 'center' });

      xPos += boxWidth + 5;
    });

    yPos += boxHeight + 15;

    return yPos;
  }

  private drawCandidateProfiles(doc: jsPDF, data: MissionReportData, startY: number): number {
    let yPos = startY;

    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor(245, 245, 245);
    doc.rect(this.MARGIN_LEFT, yPos - 3, this.PAGE_WIDTH - this.MARGIN_LEFT - this.MARGIN_RIGHT, 8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(14, 47, 86);
    doc.text('PROFILS CANDIDATS', this.MARGIN_LEFT + 2, yPos + 3);
    yPos += 12;

    data.candidate_profiles.forEach((candidate, index) => {
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      const bgColor = this.getRecommendationColor(candidate.recommendation);
      doc.setFillColor(...bgColor);
      doc.roundedRect(this.MARGIN_LEFT, yPos, this.PAGE_WIDTH - this.MARGIN_LEFT - this.MARGIN_RIGHT, 5, 2, 2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text(`${index + 1}. ${candidate.name}`, this.MARGIN_LEFT + 3, yPos + 3.5);

      if (candidate.match_score) {
        doc.text(`${candidate.match_score}% match`, this.PAGE_WIDTH - this.MARGIN_RIGHT - 3, yPos + 3.5, { align: 'right' });
      }

      yPos += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text(`Poste actuel: ${candidate.position}`, this.MARGIN_LEFT + 2, yPos);
      yPos += 4;
      doc.text(`Expérience: ${candidate.experience_years} ans | Formation: ${candidate.education}`, this.MARGIN_LEFT + 2, yPos);
      yPos += 6;

      if (candidate.strengths && candidate.strengths.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('Points forts:', this.MARGIN_LEFT + 2, yPos);
        doc.setFont('helvetica', 'normal');
        yPos += 4;
        candidate.strengths.forEach(strength => {
          doc.text(`• ${strength}`, this.MARGIN_LEFT + 4, yPos);
          yPos += 4;
        });
        yPos += 2;
      }

      if (candidate.hr_comments) {
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 100, 100);
        const commentLines = doc.splitTextToSize(`Commentaire RH: ${candidate.hr_comments}`, this.PAGE_WIDTH - this.MARGIN_LEFT - this.MARGIN_RIGHT - 4);
        doc.text(commentLines, this.MARGIN_LEFT + 2, yPos);
        yPos += commentLines.length * 4 + 2;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      const recColor = this.getRecommendationTextColor(candidate.recommendation);
      doc.setTextColor(...recColor);
      doc.text(`Recommandation: ${this.getRecommendationLabel(candidate.recommendation)}`, this.MARGIN_LEFT + 2, yPos);
      yPos += 10;
    });

    return yPos;
  }

  private drawMarketInsights(doc: jsPDF, data: MissionReportData, startY: number): number {
    let yPos = startY;

    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor(245, 245, 245);
    doc.rect(this.MARGIN_LEFT, yPos - 3, this.PAGE_WIDTH - this.MARGIN_LEFT - this.MARGIN_RIGHT, 8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(14, 47, 86);
    doc.text('ANALYSE DU MARCHÉ', this.MARGIN_LEFT + 2, yPos + 3);
    yPos += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const insightLines = doc.splitTextToSize(data.market_insights!, this.PAGE_WIDTH - this.MARGIN_LEFT - this.MARGIN_RIGHT);
    doc.text(insightLines, this.MARGIN_LEFT, yPos);
    yPos += insightLines.length * 5 + 10;

    return yPos;
  }

  private drawRecommendations(doc: jsPDF, data: MissionReportData, startY: number): number {
    let yPos = startY;

    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor(255, 140, 0);
    doc.rect(this.MARGIN_LEFT, yPos - 3, this.PAGE_WIDTH - this.MARGIN_LEFT - this.MARGIN_RIGHT, 8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text('NOS RECOMMANDATIONS', this.MARGIN_LEFT + 2, yPos + 3);
    yPos += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const recLines = doc.splitTextToSize(data.recommendations, this.PAGE_WIDTH - this.MARGIN_LEFT - this.MARGIN_RIGHT);
    doc.text(recLines, this.MARGIN_LEFT, yPos);
    yPos += recLines.length * 5 + 10;

    return yPos;
  }

  private drawNextSteps(doc: jsPDF, data: MissionReportData, startY: number): number {
    let yPos = startY;

    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor(245, 245, 245);
    doc.rect(this.MARGIN_LEFT, yPos - 3, this.PAGE_WIDTH - this.MARGIN_LEFT - this.MARGIN_RIGHT, 8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(14, 47, 86);
    doc.text('PROCHAINES ÉTAPES', this.MARGIN_LEFT + 2, yPos + 3);
    yPos += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const stepsLines = doc.splitTextToSize(data.next_steps!, this.PAGE_WIDTH - this.MARGIN_LEFT - this.MARGIN_RIGHT);
    doc.text(stepsLines, this.MARGIN_LEFT, yPos);
    yPos += stepsLines.length * 5 + 10;

    return yPos;
  }

  private drawFooter(doc: jsPDF, data: MissionReportData): void {
    const footerY = 280;

    doc.setDrawColor(220, 220, 220);
    doc.line(this.MARGIN_LEFT, footerY - 5, this.PAGE_WIDTH - this.MARGIN_RIGHT, footerY - 5);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Rapport préparé par ${data.consultant_name}, ${data.consultant_title}`, this.MARGIN_LEFT, footerY);

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('JobGuinée - Externalisation RH | www.jobguinee.com | contact@jobguinee.com', this.PAGE_WIDTH / 2, footerY + 5, { align: 'center' });
  }

  private getReportTypeTitle(type: string): string {
    const titles: Record<string, string> = {
      initial_analysis: 'ANALYSE INITIALE DE MISSION',
      candidate_shortlist: 'SHORTLIST CANDIDATS',
      interview_summary: 'SYNTHÈSE DES ENTRETIENS',
      final_recommendation: 'RECOMMANDATION FINALE',
      post_placement_followup: 'SUIVI POST-PLACEMENT'
    };
    return titles[type] || 'RAPPORT RH';
  }

  private getRecommendationColor(rec: string): [number, number, number] {
    const colors: Record<string, [number, number, number]> = {
      highly_recommended: [16, 185, 129],
      recommended: [59, 130, 246],
      conditional: [245, 158, 11],
      not_recommended: [239, 68, 68]
    };
    return colors[rec] || [100, 100, 100];
  }

  private getRecommendationTextColor(rec: string): [number, number, number] {
    const colors: Record<string, [number, number, number]> = {
      highly_recommended: [5, 150, 105],
      recommended: [37, 99, 235],
      conditional: [217, 119, 6],
      not_recommended: [220, 38, 38]
    };
    return colors[rec] || [80, 80, 80];
  }

  private getRecommendationLabel(rec: string): string {
    const labels: Record<string, string> = {
      highly_recommended: 'Fortement recommandé',
      recommended: 'Recommandé',
      conditional: 'Recommandé sous conditions',
      not_recommended: 'Non recommandé'
    };
    return labels[rec] || rec;
  }

  async sendReportToClient(reportId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const pdfResult = await this.generateReportPDF(reportId);
      if (!pdfResult.success || !pdfResult.pdfUrl) {
        throw new Error('Échec de génération du PDF');
      }

      await supabase
        .from('b2b_mission_reports')
        .update({
          report_status: 'sent_to_client',
          sent_to_client_at: new Date().toISOString()
        })
        .eq('id', reportId);

      return { success: true };
    } catch (error: any) {
      console.error('Error sending report:', error);
      return { success: false, error: error.message };
    }
  }
}

export const missionReportPDFService = new MissionReportPDFService();
