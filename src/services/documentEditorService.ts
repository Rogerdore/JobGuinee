import { supabase } from '../lib/supabase';
import mammoth from 'mammoth';
import { CandidateDocument, DocumentType } from './candidateDocumentService';

export interface DocumentContent {
  raw: string;
  html: string;
  format: 'html' | 'text' | 'pdf' | 'docx' | 'unknown';
  editable: boolean;
}

export interface SaveDocumentOptions {
  documentId: string;
  content: string;
  createNewVersion?: boolean;
  metadata?: Record<string, any>;
}

class DocumentEditorService {
  async fetchDocumentContent(document: CandidateDocument): Promise<DocumentContent> {
    const fileType = document.file_type?.toLowerCase() || '';
    const fileName = document.file_name.toLowerCase();

    if (fileType.includes('pdf') || fileName.endsWith('.pdf')) {
      return {
        raw: '',
        html: '<p>Les fichiers PDF ne peuvent pas être édités directement. Veuillez télécharger le fichier et le modifier avec un logiciel approprié.</p>',
        format: 'pdf',
        editable: false
      };
    }

    if (fileType.includes('image') || /\.(jpg|jpeg|png|gif)$/i.test(fileName)) {
      return {
        raw: '',
        html: '<p>Les images ne peuvent pas être éditées ici. Utilisez un logiciel de retouche d\'images.</p>',
        format: 'unknown',
        editable: false
      };
    }

    if (
      fileType.includes('wordprocessingml') ||
      fileType.includes('msword') ||
      fileName.endsWith('.docx') ||
      fileName.endsWith('.doc')
    ) {
      try {
        const bucket = this.getBucket(document.document_type);
        const filePath = this.extractFilePath(document.file_url);

        console.log('DOCX Editor Debug:', {
          bucket,
          filePath,
          originalUrl: document.file_url,
          documentType: document.document_type
        });

        const { data, error } = await supabase.storage
          .from(bucket)
          .download(filePath);

        if (error) {
          console.error('Supabase Storage Error:', error);
          throw new Error(`Erreur de téléchargement: ${error.message}`);
        }

        if (!data) {
          throw new Error('Aucune donnée reçue du storage');
        }

        console.log('File downloaded successfully, size:', data.size);

        const arrayBuffer = await data.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });

        console.log('Conversion successful, HTML length:', result.value?.length);

        if (!result.value || result.value.trim() === '') {
          return {
            raw: '',
            html: '<p>Le document semble vide. Vérifiez que le fichier contient du texte.</p>',
            format: 'docx',
            editable: false
          };
        }

        return {
          raw: '',
          html: result.value,
          format: 'docx',
          editable: true
        };
      } catch (error: any) {
        console.error('Error converting DOCX:', error);
        const errorMessage = error?.message || 'Erreur inconnue';
        return {
          raw: '',
          html: `<div style="padding: 20px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #991b1b;">
            <h3 style="margin: 0 0 10px 0;">Erreur de conversion du document</h3>
            <p style="margin: 0;">${errorMessage}</p>
            <p style="margin: 10px 0 0 0; font-size: 0.875rem; color: #dc2626;">
              Si le problème persiste, téléchargez le fichier et modifiez-le avec Microsoft Word ou LibreOffice.
            </p>
          </div>`,
          format: 'docx',
          editable: false
        };
      }
    }

    if (fileType.includes('text') || fileName.endsWith('.txt')) {
      try {
        const bucket = this.getBucket(document.document_type);
        const filePath = this.extractFilePath(document.file_url);

        const { data, error } = await supabase.storage
          .from(bucket)
          .download(filePath);

        if (error || !data) {
          throw new Error('Impossible de télécharger le fichier');
        }

        const text = await data.text();

        const htmlContent = text
          .split('\n')
          .map(line => `<p>${line || '<br>'}</p>`)
          .join('');

        return {
          raw: text,
          html: htmlContent,
          format: 'text',
          editable: true
        };
      } catch (error) {
        console.error('Error fetching text:', error);
        return {
          raw: '',
          html: '<p>Erreur lors du chargement du fichier texte.</p>',
          format: 'text',
          editable: false
        };
      }
    }

    if (fileType.includes('html') || fileName.endsWith('.html')) {
      try {
        const bucket = this.getBucket(document.document_type);
        const filePath = this.extractFilePath(document.file_url);

        const { data, error } = await supabase.storage
          .from(bucket)
          .download(filePath);

        if (error || !data) {
          throw new Error('Impossible de télécharger le fichier');
        }

        const html = await data.text();

        return {
          raw: html,
          html: html,
          format: 'html',
          editable: true
        };
      } catch (error) {
        console.error('Error fetching HTML:', error);
        return {
          raw: '',
          html: '<p>Erreur lors du chargement du fichier HTML.</p>',
          format: 'html',
          editable: false
        };
      }
    }

    if (document.metadata?.generated_html || document.metadata?.content) {
      const content = document.metadata.generated_html || document.metadata.content;
      return {
        raw: content,
        html: content,
        format: 'html',
        editable: true
      };
    }

    return {
      raw: '',
      html: '<p>Ce type de fichier ne peut pas être édité directement.</p>',
      format: 'unknown',
      editable: false
    };
  }

  private extractFilePath(fileUrl: string): string {
    const parts = fileUrl.split('/');
    const storageIndex = parts.findIndex(part => part === 'storage');

    if (storageIndex !== -1 && storageIndex + 3 < parts.length) {
      return parts.slice(storageIndex + 3).join('/');
    }

    const objectIndex = parts.findIndex(part => part === 'object');
    if (objectIndex !== -1 && objectIndex + 2 < parts.length) {
      return parts.slice(objectIndex + 2).join('/');
    }

    return parts.slice(-2).join('/');
  }

  async saveDocument(options: SaveDocumentOptions): Promise<CandidateDocument> {
    const { documentId, content, createNewVersion = false, metadata = {} } = options;

    const { data: originalDoc, error: fetchError } = await supabase
      .from('candidate_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (fetchError || !originalDoc) {
      throw new Error('Document non trouvé');
    }

    if (createNewVersion) {
      return await this.createNewVersion(originalDoc, content, metadata);
    } else {
      return await this.updateExistingDocument(originalDoc, content, metadata);
    }
  }

  private async createNewVersion(
    originalDoc: CandidateDocument,
    content: string,
    metadata: Record<string, any>
  ): Promise<CandidateDocument> {
    const htmlBlob = new Blob([content], { type: 'text/html' });
    const file = new File(
      [htmlBlob],
      `${originalDoc.file_name.replace(/\.[^.]+$/, '')}_v${originalDoc.version + 1}.html`,
      { type: 'text/html' }
    );

    const bucket = this.getBucket(originalDoc.document_type);
    const fileName = `${originalDoc.candidate_id}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    const newDocumentData = {
      candidate_id: originalDoc.candidate_id,
      document_type: originalDoc.document_type,
      document_source: originalDoc.document_source,
      file_url: urlData.publicUrl,
      file_name: file.name,
      file_type: 'text/html',
      file_size: file.size,
      version: originalDoc.version + 1,
      parent_document_id: originalDoc.id,
      is_primary: false,
      metadata: {
        ...originalDoc.metadata,
        ...metadata,
        edited: true,
        edited_at: new Date().toISOString(),
        original_document_id: originalDoc.id,
        generated_html: content
      },
      tags: [...originalDoc.tags, 'Édité']
    };

    const { data: newDoc, error } = await supabase
      .from('candidate_documents')
      .insert(newDocumentData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return newDoc;
  }

  private async updateExistingDocument(
    originalDoc: CandidateDocument,
    content: string,
    metadata: Record<string, any>
  ): Promise<CandidateDocument> {
    const updatedMetadata = {
      ...originalDoc.metadata,
      ...metadata,
      edited: true,
      last_edited_at: new Date().toISOString(),
      generated_html: content
    };

    const { data, error } = await supabase
      .from('candidate_documents')
      .update({
        metadata: updatedMetadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', originalDoc.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async downloadDocument(document: CandidateDocument, content: string, format: 'html' | 'txt' = 'html'): Promise<void> {
    const extension = format === 'html' ? '.html' : '.txt';
    const fileName = document.file_name.replace(/\.[^.]+$/, '') + extension;

    const blob = new Blob([content], {
      type: format === 'html' ? 'text/html' : 'text/plain'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async getDocumentVersions(documentId: string): Promise<CandidateDocument[]> {
    const { data: versions, error } = await supabase
      .from('candidate_documents')
      .select('*')
      .or(`id.eq.${documentId},parent_document_id.eq.${documentId}`)
      .order('version', { ascending: true });

    if (error) {
      throw error;
    }

    return versions || [];
  }

  private getBucket(documentType: DocumentType): string {
    const bucketMap: Record<DocumentType, string> = {
      cv: 'candidate-cvs',
      cover_letter: 'candidate-cover-letters',
      certificate: 'candidate-certificates',
      other: 'candidate-cvs'
    };
    return bucketMap[documentType];
  }

  isEditable(document: CandidateDocument): boolean {
    const fileType = document.file_type?.toLowerCase() || '';
    const fileName = document.file_name.toLowerCase();

    if (fileType.includes('pdf') || fileName.endsWith('.pdf')) {
      return false;
    }

    if (fileType.includes('image') || /\.(jpg|jpeg|png|gif)$/i.test(fileName)) {
      return false;
    }

    if (
      fileType.includes('wordprocessingml') ||
      fileType.includes('msword') ||
      fileType.includes('text') ||
      fileType.includes('html') ||
      fileName.endsWith('.docx') ||
      fileName.endsWith('.doc') ||
      fileName.endsWith('.txt') ||
      fileName.endsWith('.html') ||
      document.metadata?.generated_html ||
      document.metadata?.content
    ) {
      return true;
    }

    return false;
  }
}

export const documentEditorService = new DocumentEditorService();
