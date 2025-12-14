import { supabase } from '../lib/supabase';

export interface CandidateApplicationStatus {
  application_id: string;
  job_title: string;
  company_name: string;
  applied_at: string;
  current_status: string;
  status_label: string;
  status_color: string;
  status_description: string;
  can_view_details: boolean;
}

export interface CandidateTimelineEvent {
  event_id: string;
  event_date: string;
  status_label: string;
  status_description: string;
  status_color: string;
  is_current: boolean;
}

export const candidateApplicationTrackingService = {
  async getApplicationStatus(applicationId: string): Promise<CandidateApplicationStatus | null> {
    try {
      const { data, error } = await supabase.rpc('get_candidate_application_status', {
        p_application_id: applicationId
      });

      if (error) {
        console.error('Error fetching application status:', error);
        return null;
      }

      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Error in getApplicationStatus:', error);
      return null;
    }
  },

  async getTimeline(applicationId: string): Promise<CandidateTimelineEvent[]> {
    try {
      const { data, error } = await supabase.rpc('get_candidate_timeline', {
        p_application_id: applicationId
      });

      if (error) {
        console.error('Error fetching timeline:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTimeline:', error);
      return [];
    }
  },

  getStatusBadgeStyle(statusLabel: string): { bg: string; text: string; icon: string } {
    switch (statusLabel.toLowerCase()) {
      case 'postulé':
        return { bg: 'bg-gray-100', text: 'text-gray-700', icon: '📝' };
      case 'vu':
        return { bg: 'bg-blue-100', text: 'text-blue-700', icon: '👀' };
      case 'en analyse':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '🔍' };
      case 'shortlist':
        return { bg: 'bg-purple-100', text: 'text-purple-700', icon: '⭐' };
      case 'entretien':
        return { bg: 'bg-cyan-100', text: 'text-cyan-700', icon: '🗣️' };
      case 'accepté':
        return { bg: 'bg-green-100', text: 'text-green-700', icon: '✅' };
      case 'refusé':
        return { bg: 'bg-red-100', text: 'text-red-700', icon: '❌' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', icon: '📄' };
    }
  },

  getStatusIconLucide(statusLabel: string): string {
    switch (statusLabel.toLowerCase()) {
      case 'postulé':
        return 'FileText';
      case 'vu':
        return 'Eye';
      case 'en analyse':
        return 'Search';
      case 'shortlist':
        return 'Star';
      case 'entretien':
        return 'MessageCircle';
      case 'accepté':
        return 'CheckCircle';
      case 'refusé':
        return 'XCircle';
      default:
        return 'Clock';
    }
  }
};
