import { supabase } from '../lib/supabase';

export type DocumentType = 'cv' | 'cover_letter' | 'certificate' | 'other';
export type DocumentSource = 'upload' | 'ai_generated' | 'application' | 'formation' | 'system';
export type DocumentUsageType = 'application' | 'shared' | 'downloaded' | 'viewed' | 'generated';

export interface CandidateDocument {
  id: string;
  candidate_id: string;
  document_type: DocumentType;
  document_source: DocumentSource;
  file_url: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  version: number;
  is_primary: boolean;
  parent_document_id: string | null;
  metadata: Record<string, any>;
  tags: string[];
  usage_count: number;
  last_used_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentUsage {
  id: string;
  document_id: string;
  candidate_id: string;
  usage_type: DocumentUsageType;
  related_entity_id: string | null;
  related_entity_type: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface DocumentUploadOptions {
  document_type: DocumentType;
  document_source?: DocumentSource;
  file: File;
  tags?: string[];
  metadata?: Record<string, any>;
  is_primary?: boolean;
}

export interface DocumentStats {
  total_documents: number;
  by_type: {
    cv: number;
    cover_letter: number;
    certificate: number;
    other: number;
  };
  by_source: Record<DocumentSource, number>;
  total_usage: number;
  recent_uploads: number;
}

class CandidateDocumentService {
  async getAllDocuments(candidateId: string, includeArchived = false): Promise<CandidateDocument[]> {
    let query = supabase
      .from('candidate_documents')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false });

    if (!includeArchived) {
      query = query.is('archived_at', null);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }

    return data || [];
  }

  async getDocumentsByType(candidateId: string, documentType: DocumentType): Promise<CandidateDocument[]> {
    const { data, error } = await supabase
      .from('candidate_documents')
      .select('*')
      .eq('candidate_id', candidateId)
      .eq('document_type', documentType)
      .is('archived_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents by type:', error);
      throw error;
    }

    return data || [];
  }

  async getPrimaryDocument(candidateId: string, documentType: DocumentType): Promise<CandidateDocument | null> {
    const { data, error } = await supabase
      .from('candidate_documents')
      .select('*')
      .eq('candidate_id', candidateId)
      .eq('document_type', documentType)
      .eq('is_primary', true)
      .is('archived_at', null)
      .maybeSingle();

    if (error) {
      console.error('Error fetching primary document:', error);
      throw error;
    }

    return data;
  }

  async uploadDocument(candidateId: string, options: DocumentUploadOptions): Promise<CandidateDocument> {
    const { file, document_type, document_source = 'upload', tags = [], metadata = {}, is_primary = false } = options;

    const bucketMap: Record<DocumentType, string> = {
      cv: 'candidate-cvs',
      cover_letter: 'candidate-cover-letters',
      certificate: 'candidate-certificates',
      other: 'candidate-cvs'
    };

    const bucket = bucketMap[document_type];
    const fileName = `${candidateId}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      throw uploadError;
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    const autoTags = this.generateAutoTags(file.name, document_type);
    const allTags = [...new Set([...tags, ...autoTags])];

    const documentData = {
      candidate_id: candidateId,
      document_type,
      document_source,
      file_url: urlData.publicUrl,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      tags: allTags,
      metadata: {
        ...metadata,
        original_name: file.name,
        upload_date: new Date().toISOString()
      },
      is_primary
    };

    const { data, error } = await supabase
      .from('candidate_documents')
      .insert(documentData)
      .select()
      .single();

    if (error) {
      console.error('Error creating document record:', error);
      throw error;
    }

    return data;
  }

  async importExistingDocument(
    candidateId: string,
    fileUrl: string,
    documentType: DocumentType,
    source: DocumentSource,
    additionalMetadata: Record<string, any> = {}
  ): Promise<CandidateDocument> {
    const { data: existing } = await supabase
      .from('candidate_documents')
      .select('id, metadata')
      .eq('candidate_id', candidateId)
      .eq('file_url', fileUrl)
      .maybeSingle();

    if (existing) {
      const existingMetadata = existing.metadata || {};

      if (additionalMetadata.application_id) {
        const updatedMetadata = {
          ...existingMetadata,
          application_ids: [
            ...(Array.isArray(existingMetadata.application_ids) ? existingMetadata.application_ids : []),
            additionalMetadata.application_id
          ].filter((v, i, a) => a.indexOf(v) === i),
          jobs: [
            ...(Array.isArray(existingMetadata.jobs) ? existingMetadata.jobs : []),
            { job_id: additionalMetadata.job_id, job_title: additionalMetadata.job_title }
          ]
        };

        await supabase
          .from('candidate_documents')
          .update({ metadata: updatedMetadata })
          .eq('id', existing.id);
      }

      throw new Error('DOCUMENT_ALREADY_EXISTS');
    }

    const fileName = fileUrl.split('/').pop() || 'document';

    const documentData = {
      candidate_id: candidateId,
      document_type: documentType,
      document_source: source,
      file_url: fileUrl,
      file_name: fileName,
      metadata: {
        imported: true,
        import_date: new Date().toISOString(),
        ...additionalMetadata
      },
      tags: this.generateAutoTags(fileName, documentType)
    };

    const { data, error } = await supabase
      .from('candidate_documents')
      .insert(documentData)
      .select()
      .single();

    if (error) {
      console.error('Error importing document:', error);
      throw error;
    }

    return data;
  }

  async setPrimaryDocument(documentId: string): Promise<void> {
    const { data: doc, error: fetchError } = await supabase
      .from('candidate_documents')
      .select('candidate_id, document_type')
      .eq('id', documentId)
      .single();

    if (fetchError || !doc) {
      throw new Error('Document not found');
    }

    await supabase
      .from('candidate_documents')
      .update({ is_primary: false })
      .eq('candidate_id', doc.candidate_id)
      .eq('document_type', doc.document_type);

    const { error: updateError } = await supabase
      .from('candidate_documents')
      .update({ is_primary: true })
      .eq('id', documentId);

    if (updateError) {
      console.error('Error setting primary document:', updateError);
      throw updateError;
    }
  }

  async archiveDocument(documentId: string): Promise<void> {
    const { error } = await supabase
      .from('candidate_documents')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', documentId);

    if (error) {
      console.error('Error archiving document:', error);
      throw error;
    }
  }

  async restoreDocument(documentId: string): Promise<void> {
    const { error } = await supabase
      .from('candidate_documents')
      .update({ archived_at: null })
      .eq('id', documentId);

    if (error) {
      console.error('Error restoring document:', error);
      throw error;
    }
  }

  async deleteDocument(documentId: string): Promise<void> {
    const { data: doc, error: fetchError } = await supabase
      .from('candidate_documents')
      .select('file_url, document_type')
      .eq('id', documentId)
      .single();

    if (fetchError || !doc) {
      throw new Error('Document not found');
    }

    const urlParts = doc.file_url.split('/');
    const fileName = urlParts.slice(-2).join('/');

    const bucketMap: Record<DocumentType, string> = {
      cv: 'candidate-cvs',
      cover_letter: 'candidate-cover-letters',
      certificate: 'candidate-certificates',
      other: 'candidate-cvs'
    };

    const bucket = bucketMap[doc.document_type];

    await supabase.storage
      .from(bucket)
      .remove([fileName]);

    const { error } = await supabase
      .from('candidate_documents')
      .delete()
      .eq('id', documentId);

    if (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  async trackUsage(
    documentId: string,
    usageType: DocumentUsageType,
    relatedEntityId?: string,
    relatedEntityType?: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const { data: doc } = await supabase
      .from('candidate_documents')
      .select('candidate_id')
      .eq('id', documentId)
      .single();

    if (!doc) {
      throw new Error('Document not found');
    }

    await supabase.rpc('increment_document_usage', {
      p_document_id: documentId,
      p_usage_type: usageType,
      p_related_entity_id: relatedEntityId || null,
      p_related_entity_type: relatedEntityType || null
    });
  }

  async getDocumentUsageHistory(documentId: string): Promise<DocumentUsage[]> {
    const { data, error } = await supabase
      .from('candidate_document_usage')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching usage history:', error);
      throw error;
    }

    return data || [];
  }

  async getDocumentStats(candidateId: string): Promise<DocumentStats> {
    const documents = await this.getAllDocuments(candidateId, false);

    const stats: DocumentStats = {
      total_documents: documents.length,
      by_type: {
        cv: 0,
        cover_letter: 0,
        certificate: 0,
        other: 0
      },
      by_source: {
        upload: 0,
        ai_generated: 0,
        application: 0,
        formation: 0,
        system: 0
      },
      total_usage: 0,
      recent_uploads: 0
    };

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    documents.forEach(doc => {
      stats.by_type[doc.document_type]++;
      stats.by_source[doc.document_source]++;
      stats.total_usage += doc.usage_count;

      if (new Date(doc.created_at) > sevenDaysAgo) {
        stats.recent_uploads++;
      }
    });

    return stats;
  }

  async searchDocuments(candidateId: string, searchTerm: string): Promise<CandidateDocument[]> {
    const allDocs = await this.getAllDocuments(candidateId, false);

    const term = searchTerm.toLowerCase();
    return allDocs.filter(doc =>
      doc.file_name.toLowerCase().includes(term) ||
      doc.tags.some(tag => tag.toLowerCase().includes(term)) ||
      JSON.stringify(doc.metadata).toLowerCase().includes(term)
    );
  }

  async updateTags(documentId: string, tags: string[]): Promise<void> {
    const { error } = await supabase
      .from('candidate_documents')
      .update({ tags })
      .eq('id', documentId);

    if (error) {
      console.error('Error updating tags:', error);
      throw error;
    }
  }

  async countAvailableDocuments(candidateId: string): Promise<number> {
    const { data: existingDocs } = await supabase
      .from('candidate_documents')
      .select('file_url')
      .eq('candidate_id', candidateId);

    const existingUrls = new Set((existingDocs || []).map(doc => doc.file_url));
    const uniqueUrls = new Set<string>();

    const { data: profile } = await supabase
      .from('candidate_profiles')
      .select('cv_url, cover_letter_url, certificates_url')
      .eq('profile_id', candidateId)
      .maybeSingle();

    if (profile) {
      if (profile.cv_url && !existingUrls.has(profile.cv_url)) {
        uniqueUrls.add(profile.cv_url);
      }
      if (profile.cover_letter_url && !existingUrls.has(profile.cover_letter_url)) {
        uniqueUrls.add(profile.cover_letter_url);
      }
      if (profile.certificates_url && !existingUrls.has(profile.certificates_url)) {
        uniqueUrls.add(profile.certificates_url);
      }
    }

    const { data: applications } = await supabase
      .from('applications')
      .select('cv_url')
      .eq('candidate_id', candidateId)
      .not('cv_url', 'is', null);

    if (applications) {
      for (const app of applications) {
        if (app.cv_url && !existingUrls.has(app.cv_url)) {
          uniqueUrls.add(app.cv_url);
        }
      }
    }

    return uniqueUrls.size;
  }

  async aggregateFromExistingSources(candidateId: string): Promise<number> {
    let count = 0;

    const { data: profile } = await supabase
      .from('candidate_profiles')
      .select('cv_url, cover_letter_url, certificates_url')
      .eq('profile_id', candidateId)
      .maybeSingle();

    if (profile) {
      if (profile.cv_url) {
        try {
          await this.importExistingDocument(
            candidateId,
            profile.cv_url,
            'cv',
            'system',
            { source: 'candidate_profile' }
          );
          count++;
        } catch (e: any) {
          if (e.message !== 'DOCUMENT_ALREADY_EXISTS') {
            console.error('Error importing CV:', e);
          }
        }
      }

      if (profile.cover_letter_url) {
        try {
          await this.importExistingDocument(
            candidateId,
            profile.cover_letter_url,
            'cover_letter',
            'system',
            { source: 'candidate_profile' }
          );
          count++;
        } catch (e: any) {
          if (e.message !== 'DOCUMENT_ALREADY_EXISTS') {
            console.error('Error importing cover letter:', e);
          }
        }
      }

      if (profile.certificates_url) {
        try {
          await this.importExistingDocument(
            candidateId,
            profile.certificates_url,
            'certificate',
            'system',
            { source: 'candidate_profile' }
          );
          count++;
        } catch (e: any) {
          if (e.message !== 'DOCUMENT_ALREADY_EXISTS') {
            console.error('Error importing certificate:', e);
          }
        }
      }
    }

    const { data: applications } = await supabase
      .from('applications')
      .select('id, cv_url, job_id, jobs(title)')
      .eq('candidate_id', candidateId)
      .not('cv_url', 'is', null);

    if (applications) {
      for (const app of applications) {
        if (app.cv_url) {
          try {
            await this.importExistingDocument(
              candidateId,
              app.cv_url,
              'cv',
              'application',
              {
                source: 'application',
                application_id: app.id,
                job_id: app.job_id,
                job_title: (app as any).jobs?.title
              }
            );
            count++;
          } catch (e: any) {
            if (e.message !== 'DOCUMENT_ALREADY_EXISTS') {
              console.error('Error importing application CV:', e);
            }
          }
        }
      }
    }

    return count;
  }

  private generateAutoTags(fileName: string, documentType: DocumentType): string[] {
    const tags: string[] = [];
    const year = new Date().getFullYear().toString();
    tags.push(year);

    const lowerName = fileName.toLowerCase();

    if (documentType === 'cv') {
      tags.push('CV');
      if (lowerName.includes('francais')) tags.push('Français');
      if (lowerName.includes('english')) tags.push('English');
    } else if (documentType === 'cover_letter') {
      tags.push('Lettre de motivation');
    } else if (documentType === 'certificate') {
      tags.push('Certification');
    }

    return tags;
  }
}

export const candidateDocumentService = new CandidateDocumentService();
