import { supabase } from '../lib/supabase';

export interface DocumentDownloadLog {
  user_id: string;
  application_id?: string;
  candidate_id?: string;
  file_path: string;
  bucket_name: string;
  action: 'download' | 'view' | 'preview';
  user_type?: string;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  error_message?: string;
}

export interface SignedUrlResult {
  url: string | null;
  error: string | null;
  expiresIn: number;
}

class SecureDocumentService {
  private readonly DEFAULT_EXPIRY = 3600;

  async generateSignedUrl(
    bucket: string,
    path: string,
    expirySeconds: number = this.DEFAULT_EXPIRY
  ): Promise<SignedUrlResult> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expirySeconds);

      if (error) {
        console.error('Error generating signed URL:', error);
        return {
          url: null,
          error: error.message,
          expiresIn: 0
        };
      }

      return {
        url: data.signedUrl,
        error: null,
        expiresIn: expirySeconds
      };
    } catch (error: any) {
      console.error('Unexpected error generating signed URL:', error);
      return {
        url: null,
        error: error.message || 'Erreur lors de la génération du lien',
        expiresIn: 0
      };
    }
  }

  async downloadDocument(
    bucket: string,
    path: string,
    applicationId?: string,
    candidateId?: string,
    action: 'download' | 'view' | 'preview' = 'download'
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return {
          success: false,
          error: 'Utilisateur non authentifié'
        };
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .maybeSingle();

      const result = await this.generateSignedUrl(bucket, path, this.DEFAULT_EXPIRY);

      await this.logDownload({
        user_id: user.id,
        application_id: applicationId,
        candidate_id: candidateId,
        file_path: path,
        bucket_name: bucket,
        action,
        user_type: profile?.user_type,
        user_agent: navigator.userAgent,
        success: result.url !== null,
        error_message: result.error || undefined
      });

      if (!result.url) {
        return {
          success: false,
          error: result.error || 'Impossible de générer le lien de téléchargement'
        };
      }

      return {
        success: true,
        url: result.url
      };
    } catch (error: any) {
      console.error('Error downloading document:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors du téléchargement'
      };
    }
  }

  async previewDocument(
    bucket: string,
    path: string,
    applicationId?: string,
    candidateId?: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    return this.downloadDocument(bucket, path, applicationId, candidateId, 'preview');
  }

  async viewDocument(
    bucket: string,
    path: string,
    applicationId?: string,
    candidateId?: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    return this.downloadDocument(bucket, path, applicationId, candidateId, 'view');
  }

  private async logDownload(log: DocumentDownloadLog): Promise<void> {
    try {
      const { error } = await supabase
        .from('download_logs')
        .insert(log);

      if (error) {
        console.error('Error logging download:', error);
      }
    } catch (error) {
      console.error('Unexpected error logging download:', error);
    }
  }

  async canAccessDocument(
    bucket: string,
    path: string,
    userId: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('can_access_candidate_document', {
          p_bucket_name: bucket,
          p_file_path: path,
          p_user_id: userId
        });

      if (error) {
        console.error('Error checking document access:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Unexpected error checking document access:', error);
      return false;
    }
  }

  async uploadDocument(
    bucket: string,
    path: string,
    file: File,
    options?: {
      candidateId?: string;
      applicationId?: string;
      metadata?: Record<string, string>;
    }
  ): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return {
          success: false,
          error: 'Utilisateur non authentifié'
        };
      }

      const fullPath = `${user.id}/${path}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fullPath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
        });

      if (error) {
        console.error('Error uploading document:', error);
        return {
          success: false,
          error: error.message
        };
      }

      if (options?.candidateId && bucket !== 'company-logos') {
        await supabase.from('candidate_documents').insert({
          candidate_id: options.candidateId,
          document_type: this.getDocumentType(bucket),
          file_path: data.path,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          bucket_name: bucket
        });
      }

      return {
        success: true,
        path: data.path
      };
    } catch (error: any) {
      console.error('Unexpected error uploading document:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors du téléversement'
      };
    }
  }

  async deleteDocument(
    bucket: string,
    path: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        console.error('Error deleting document:', error);
        return {
          success: false,
          error: error.message
        };
      }

      await supabase
        .from('candidate_documents')
        .delete()
        .eq('file_path', path);

      return { success: true };
    } catch (error: any) {
      console.error('Unexpected error deleting document:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la suppression'
      };
    }
  }

  async getDownloadLogs(
    filters?: {
      userId?: string;
      candidateId?: string;
      applicationId?: string;
      startDate?: Date;
      endDate?: Date;
      action?: string;
    }
  ): Promise<any[]> {
    try {
      let query = supabase
        .from('download_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters?.candidateId) {
        query = query.eq('candidate_id', filters.candidateId);
      }
      if (filters?.applicationId) {
        query = query.eq('application_id', filters.applicationId);
      }
      if (filters?.action) {
        query = query.eq('action', filters.action);
      }
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching download logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Unexpected error fetching download logs:', error);
      return [];
    }
  }

  private getDocumentType(bucket: string): string {
    const typeMap: Record<string, string> = {
      'candidate-cvs': 'cv',
      'candidate-cover-letters': 'cover_letter',
      'candidate-certificates': 'certificate'
    };
    return typeMap[bucket] || 'other';
  }

  getBucketByDocumentType(type: string): string {
    const bucketMap: Record<string, string> = {
      'cv': 'candidate-cvs',
      'cover_letter': 'candidate-cover-letters',
      'certificate': 'candidate-certificates',
      'company_logo': 'company-logos'
    };
    return bucketMap[type] || 'candidate-cvs';
  }
}

export const secureDocumentService = new SecureDocumentService();
