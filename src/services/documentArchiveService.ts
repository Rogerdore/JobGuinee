import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { supabase } from '../lib/supabase';
import { watermarkService } from './watermarkService';

interface CandidateDocument {
  id: string;
  profile_id: string;
  document_type: string;
  document_url: string;
  file_name: string;
  file_size?: number;
  uploaded_at: string;
}

interface ArchiveOptions {
  candidateProfileId: string;
  includeCV?: boolean;
  includeCoverLetter?: boolean;
  includeCertificates?: boolean;
  addWatermark?: boolean;
  recruiterName?: string;
}

export class DocumentArchiveService {
  async createArchive(options: ArchiveOptions): Promise<Blob> {
    const {
      candidateProfileId,
      includeCV = true,
      includeCoverLetter = true,
      includeCertificates = true,
      addWatermark = false,
      recruiterName = 'JobGuinée'
    } = options;

    const zip = new JSZip();

    try {
      const { data: candidateProfile } = await supabase
        .from('candidate_profiles')
        .select('full_name, cv_url, cover_letter_url, certificates_url')
        .eq('id', candidateProfileId)
        .maybeSingle();

      if (!candidateProfile) {
        throw new Error('Profil candidat non trouvé');
      }

      const candidateName = candidateProfile.full_name || 'Candidat';
      const folderName = this.sanitizeFileName(candidateName);

      if (includeCV && candidateProfile.cv_url) {
        await this.addFileToZip(
          zip,
          candidateProfile.cv_url,
          `${folderName}/CV_${candidateName}.pdf`,
          addWatermark,
          recruiterName
        );
      }

      if (includeCoverLetter && candidateProfile.cover_letter_url) {
        await this.addFileToZip(
          zip,
          candidateProfile.cover_letter_url,
          `${folderName}/Lettre_Motivation_${candidateName}.pdf`,
          addWatermark,
          recruiterName
        );
      }

      if (includeCertificates && candidateProfile.certificates_url) {
        await this.addFileToZip(
          zip,
          candidateProfile.certificates_url,
          `${folderName}/Certificats_${candidateName}.pdf`,
          addWatermark,
          recruiterName
        );
      }

      const { data: documents } = await supabase
        .from('candidate_documents')
        .select('*')
        .eq('profile_id', candidateProfile.profile_id)
        .order('uploaded_at', { ascending: false });

      if (documents && documents.length > 0) {
        for (const doc of documents) {
          const fileName = this.sanitizeFileName(doc.file_name || `document_${doc.id}`);
          await this.addFileToZip(
            zip,
            doc.document_url,
            `${folderName}/Autres/${fileName}`,
            addWatermark,
            recruiterName
          );
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      return zipBlob;
    } catch (error) {
      console.error('Error creating archive:', error);
      throw new Error('Échec de la création de l\'archive');
    }
  }

  async downloadArchive(options: ArchiveOptions): Promise<void> {
    try {
      const zipBlob = await this.createArchive(options);

      const { data: candidateProfile } = await supabase
        .from('candidate_profiles')
        .select('full_name')
        .eq('id', options.candidateProfileId)
        .maybeSingle();

      const candidateName = candidateProfile?.full_name || 'Candidat';
      const fileName = `Documents_${this.sanitizeFileName(candidateName)}_${Date.now()}.zip`;

      saveAs(zipBlob, fileName);

      await this.logDownload(options.candidateProfileId, 'zip');
    } catch (error) {
      console.error('Error downloading archive:', error);
      throw error;
    }
  }

  private async addFileToZip(
    zip: JSZip,
    fileUrl: string,
    filePath: string,
    addWatermark: boolean,
    recruiterName: string
  ): Promise<void> {
    try {
      let fileBlob: Blob;

      if (addWatermark && (fileUrl.endsWith('.pdf') || fileUrl.match(/\.(jpg|jpeg|png)$/i))) {
        fileBlob = await watermarkService.addJobGuineeWatermark(fileUrl, recruiterName);
      } else {
        const response = await fetch(fileUrl);
        fileBlob = await response.blob();
      }

      zip.file(filePath, fileBlob);
    } catch (error) {
      console.error(`Error adding file to zip: ${filePath}`, error);
    }
  }

  private sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-z0-9_\-\.]/gi, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  private async logDownload(candidateProfileId: string, downloadMethod: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      await supabase.from('document_download_logs').insert({
        candidate_profile_id: candidateProfileId,
        downloaded_by: user.id,
        document_type: 'archive',
        download_method: downloadMethod,
        downloaded_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error logging download:', error);
    }
  }

  async getDownloadLogs(candidateProfileId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('document_download_logs')
        .select(`
          *,
          profiles:downloaded_by (
            full_name,
            email
          )
        `)
        .eq('candidate_profile_id', candidateProfileId)
        .order('downloaded_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching download logs:', error);
      return [];
    }
  }

  async bulkDownloadProfiles(profileIds: string[], addWatermark: boolean = false): Promise<void> {
    try {
      const zip = new JSZip();

      for (const profileId of profileIds) {
        const { data: profile } = await supabase
          .from('candidate_profiles')
          .select('full_name, cv_url, cover_letter_url, certificates_url')
          .eq('id', profileId)
          .maybeSingle();

        if (!profile) continue;

        const candidateName = profile.full_name || `Candidat_${profileId}`;
        const folderName = this.sanitizeFileName(candidateName);

        if (profile.cv_url) {
          await this.addFileToZip(
            zip,
            profile.cv_url,
            `${folderName}/CV.pdf`,
            addWatermark,
            'JobGuinée'
          );
        }

        if (profile.cover_letter_url) {
          await this.addFileToZip(
            zip,
            profile.cover_letter_url,
            `${folderName}/Lettre_Motivation.pdf`,
            addWatermark,
            'JobGuinée'
          );
        }

        if (profile.certificates_url) {
          await this.addFileToZip(
            zip,
            profile.certificates_url,
            `${folderName}/Certificats.pdf`,
            addWatermark,
            'JobGuinée'
          );
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const fileName = `Profils_CVTheque_${Date.now()}.zip`;
      saveAs(zipBlob, fileName);

      for (const profileId of profileIds) {
        await this.logDownload(profileId, 'bulk_zip');
      }
    } catch (error) {
      console.error('Error in bulk download:', error);
      throw new Error('Échec du téléchargement groupé');
    }
  }
}

export const documentArchiveService = new DocumentArchiveService();
