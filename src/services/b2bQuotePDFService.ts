import jsPDF from 'jspdf';
import { supabase } from '../lib/supabase';

export interface QuoteLineItem {
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface QuotePDFData {
  quote_number: string;
  quote_date: string;
  validity_days: number;
  client_company: string;
  client_contact: string;
  client_email: string;
  client_phone?: string;
  quote_title: string;
  quote_description?: string;
  line_items: QuoteLineItem[];
  subtotal: number;
  discount_percentage?: number;
  discount_amount?: number;
  tax_percentage?: number;
  tax_amount?: number;
  total_amount: number;
  currency: string;
  payment_terms?: string;
  delivery_timeline?: string;
  terms_and_conditions?: string;
}

class B2BQuotePDFService {
  private readonly LOGO_HEIGHT = 20;
  private readonly PAGE_WIDTH = 210;
  private readonly MARGIN_LEFT = 20;
  private readonly MARGIN_RIGHT = 20;

  async generateQuotePDF(quoteId: string): Promise<{ success: boolean; pdfUrl?: string; error?: string }> {
    try {
      const { data: quote, error } = await supabase
        .from('b2b_quotes')
        .select(`
          *,
          lead:b2b_leads(*),
          pipeline:b2b_pipeline(*)
        `)
        .eq('id', quoteId)
        .single();

      if (error || !quote) {
        throw new Error('Devis introuvable');
      }

      const pdfData: QuotePDFData = {
        quote_number: quote.quote_number,
        quote_date: new Date(quote.created_at).toLocaleDateString('fr-FR'),
        validity_days: quote.validity_days || 30,
        client_company: quote.lead?.organization_name || '',
        client_contact: quote.lead?.contact_name || '',
        client_email: quote.lead?.contact_email || '',
        client_phone: quote.lead?.contact_phone,
        quote_title: quote.quote_title,
        quote_description: quote.quote_description,
        line_items: quote.services || [],
        subtotal: quote.subtotal,
        discount_percentage: quote.discount_percentage,
        discount_amount: quote.discount_amount,
        tax_percentage: quote.tax_percentage,
        tax_amount: quote.tax_amount,
        total_amount: quote.total_amount,
        currency: quote.currency || 'GNF',
        payment_terms: quote.payment_terms,
        delivery_timeline: quote.delivery_timeline,
        terms_and_conditions: quote.terms_and_conditions
      };

      const pdfBlob = this.createPDF(pdfData);
      const fileName = `devis_${quote.quote_number}.pdf`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('b2b-documents')
        .upload(`quotes/${fileName}`, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('b2b-documents')
        .getPublicUrl(`quotes/${fileName}`);

      await supabase
        .from('b2b_documents')
        .insert({
          pipeline_id: quote.pipeline_id,
          lead_id: quote.lead_id,
          quote_id: quote.id,
          document_type: 'quote_pdf',
          document_title: `Devis ${quote.quote_number}`,
          file_path: uploadData.path,
          file_name: fileName,
          mime_type: 'application/pdf',
          accessible_by_client: true
        });

      return { success: true, pdfUrl: urlData.publicUrl };
    } catch (error: any) {
      console.error('Error generating quote PDF:', error);
      return { success: false, error: error.message };
    }
  }

  private createPDF(data: QuotePDFData): Blob {
    const doc = new jsPDF();
    let yPos = 20;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(14, 47, 86);
    doc.text('JOBGUINÉE', this.MARGIN_LEFT, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Solutions RH Professionnelles', this.MARGIN_LEFT, yPos);
    yPos += 15;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 140, 0);
    doc.text('DEVIS', this.MARGIN_LEFT, yPos);
    yPos += 3;
    doc.setLineWidth(0.5);
    doc.setDrawColor(255, 140, 0);
    doc.line(this.MARGIN_LEFT, yPos, 80, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`N° ${data.quote_number}`, this.MARGIN_LEFT, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Date: ${data.quote_date}`, this.MARGIN_LEFT, yPos);
    yPos += 5;
    doc.text(`Valable ${data.validity_days} jours`, this.MARGIN_LEFT, yPos);
    yPos += 15;

    doc.setFillColor(245, 245, 245);
    doc.rect(this.MARGIN_LEFT, yPos - 5, this.PAGE_WIDTH - this.MARGIN_LEFT - this.MARGIN_RIGHT, 35, 'F');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(14, 47, 86);
    doc.text('CLIENT', this.MARGIN_LEFT + 5, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(data.client_company, this.MARGIN_LEFT + 5, yPos);
    yPos += 5;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(data.client_contact, this.MARGIN_LEFT + 5, yPos);
    yPos += 5;
    doc.text(data.client_email, this.MARGIN_LEFT + 5, yPos);
    if (data.client_phone) {
      yPos += 5;
      doc.text(data.client_phone, this.MARGIN_LEFT + 5, yPos);
    }
    yPos += 15;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(14, 47, 86);
    doc.text(data.quote_title, this.MARGIN_LEFT, yPos);
    yPos += 7;

    if (data.quote_description) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      const descLines = doc.splitTextToSize(data.quote_description, this.PAGE_WIDTH - this.MARGIN_LEFT - this.MARGIN_RIGHT);
      doc.text(descLines, this.MARGIN_LEFT, yPos);
      yPos += descLines.length * 5 + 5;
    }

    doc.setFillColor(14, 47, 86);
    doc.rect(this.MARGIN_LEFT, yPos, this.PAGE_WIDTH - this.MARGIN_LEFT - this.MARGIN_RIGHT, 8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('DÉSIGNATION', this.MARGIN_LEFT + 2, yPos + 5.5);
    doc.text('QTÉ', 110, yPos + 5.5);
    doc.text('P.U.', 130, yPos + 5.5);
    doc.text('TOTAL', 160, yPos + 5.5, { align: 'right' });
    yPos += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);

    data.line_items.forEach((item, index) => {
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }

      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(this.MARGIN_LEFT, yPos - 3, this.PAGE_WIDTH - this.MARGIN_LEFT - this.MARGIN_RIGHT, 12, 'F');
      }

      doc.setFont('helvetica', 'bold');
      doc.text(item.name, this.MARGIN_LEFT + 2, yPos);
      yPos += 4;

      if (item.description) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        const descLines = doc.splitTextToSize(item.description, 90);
        doc.text(descLines, this.MARGIN_LEFT + 2, yPos);
        yPos += descLines.length * 3;
      }

      yPos -= item.description ? descLines.length * 3 + 4 : 4;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text(item.quantity.toString(), 110, yPos + 4);
      doc.text(this.formatCurrency(item.unit_price, data.currency), 130, yPos + 4);
      doc.text(this.formatCurrency(item.total, data.currency), 160, yPos + 4, { align: 'right' });

      yPos += item.description ? descLines.length * 3 + 4 : 8;
    });

    yPos += 5;
    doc.setDrawColor(220, 220, 220);
    doc.line(this.MARGIN_LEFT, yPos, this.PAGE_WIDTH - this.MARGIN_RIGHT, yPos);
    yPos += 7;

    const summaryX = 120;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Sous-total:', summaryX, yPos);
    doc.text(this.formatCurrency(data.subtotal, data.currency), 160, yPos, { align: 'right' });
    yPos += 6;

    if (data.discount_amount && data.discount_amount > 0) {
      doc.setTextColor(0, 150, 0);
      doc.text(`Remise (${data.discount_percentage}%):`, summaryX, yPos);
      doc.text(`- ${this.formatCurrency(data.discount_amount, data.currency)}`, 160, yPos, { align: 'right' });
      doc.setTextColor(0, 0, 0);
      yPos += 6;
    }

    if (data.tax_amount && data.tax_amount > 0) {
      doc.text(`TVA (${data.tax_percentage}%):`, summaryX, yPos);
      doc.text(this.formatCurrency(data.tax_amount, data.currency), 160, yPos, { align: 'right' });
      yPos += 6;
    }

    doc.setLineWidth(0.5);
    doc.line(summaryX, yPos, 170, yPos);
    yPos += 7;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(255, 140, 0);
    doc.text('TOTAL:', summaryX, yPos);
    doc.text(this.formatCurrency(data.total_amount, data.currency), 160, yPos, { align: 'right' });
    yPos += 15;

    if (data.payment_terms || data.delivery_timeline) {
      doc.setFillColor(250, 250, 250);
      doc.rect(this.MARGIN_LEFT, yPos - 3, this.PAGE_WIDTH - this.MARGIN_LEFT - this.MARGIN_RIGHT, 20, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(14, 47, 86);
      doc.text('CONDITIONS', this.MARGIN_LEFT + 2, yPos);
      yPos += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      if (data.payment_terms) {
        doc.text(`Paiement: ${data.payment_terms}`, this.MARGIN_LEFT + 2, yPos);
        yPos += 5;
      }
      if (data.delivery_timeline) {
        doc.text(`Délai: ${data.delivery_timeline}`, this.MARGIN_LEFT + 2, yPos);
        yPos += 5;
      }
      yPos += 10;
    }

    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    if (data.terms_and_conditions) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(14, 47, 86);
      doc.text('CONDITIONS GÉNÉRALES', this.MARGIN_LEFT, yPos);
      yPos += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      const lines = doc.splitTextToSize(data.terms_and_conditions, this.PAGE_WIDTH - this.MARGIN_LEFT - this.MARGIN_RIGHT);
      doc.text(lines, this.MARGIN_LEFT, yPos);
      yPos += lines.length * 4;
    }

    const footerY = 280;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('JobGuinée - Solutions RH Professionnelles | www.jobguinee.com | contact@jobguinee.com', 105, footerY, { align: 'center' });

    return doc.output('blob');
  }

  private formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency === 'GNF' ? 'GNF' : 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  async sendQuoteToClient(quoteId: string, clientEmail: string): Promise<{ success: boolean; error?: string }> {
    try {
      const pdfResult = await this.generateQuotePDF(quoteId);
      if (!pdfResult.success || !pdfResult.pdfUrl) {
        throw new Error('Échec de génération du PDF');
      }

      await supabase
        .from('b2b_quotes')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', quoteId);

      return { success: true };
    } catch (error: any) {
      console.error('Error sending quote:', error);
      return { success: false, error: error.message };
    }
  }
}

export const b2bQuotePDFService = new B2BQuotePDFService();
