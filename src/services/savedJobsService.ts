import { supabase } from '../lib/supabase';

export interface SavedJob {
  id: string;
  user_id: string;
  job_id: string;
  notes?: string;
  saved_at: string;
  reminder_date?: string;
  is_archived: boolean;
  job?: {
    id: string;
    title: string;
    location: string;
    contract_type: string;
    department: string;
    application_deadline?: string;
    status: string;
  };
}

class SavedJobsService {
  async toggleSaveJob(jobId: string): Promise<boolean> {
    try {
      const isSavedNow = await this.isSaved(jobId);
      const action = isSavedNow ? 'unsave' : 'save';

      const { data, error } = await supabase.rpc('track_job_save', {
        p_job_id: jobId,
        p_action: action
      });

      if (error) throw error;

      const result = data as { success: boolean; status: string; message: string };

      if (!result.success) {
        throw new Error(result.message);
      }

      return action === 'save';
    } catch (error) {
      console.error('Error toggling saved job:', error);
      throw error;
    }
  }

  async isSaved(jobId: string): Promise<boolean> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return false;

      const { data, error } = await supabase
        .from('saved_jobs')
        .select('id')
        .eq('job_id', jobId)
        .eq('user_id', user.user.id)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking saved job:', error);
      return false;
    }
  }

  async getSavedJobs(includeArchived: boolean = false): Promise<SavedJob[]> {
    try {
      let query = supabase
        .from('saved_jobs')
        .select(`
          *,
          job:jobs(
            id,
            title,
            location,
            contract_type,
            department,
            application_deadline,
            status
          )
        `)
        .order('saved_at', { ascending: false });

      if (!includeArchived) {
        query = query.eq('is_archived', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as SavedJob[];
    } catch (error) {
      console.error('Error getting saved jobs:', error);
      return [];
    }
  }

  async addNote(savedJobId: string, notes: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('saved_jobs')
        .update({ notes })
        .eq('id', savedJobId);

      if (error) throw error;
    } catch (error) {
      console.error('Error adding note:', error);
      throw error;
    }
  }

  async setReminder(savedJobId: string, reminderDate: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('saved_jobs')
        .update({ reminder_date: reminderDate })
        .eq('id', savedJobId);

      if (error) throw error;
    } catch (error) {
      console.error('Error setting reminder:', error);
      throw error;
    }
  }

  async archiveSavedJob(savedJobId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('saved_jobs')
        .update({ is_archived: true })
        .eq('id', savedJobId);

      if (error) throw error;
    } catch (error) {
      console.error('Error archiving saved job:', error);
      throw error;
    }
  }

  async deleteSavedJob(savedJobId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('saved_jobs')
        .delete()
        .eq('id', savedJobId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting saved job:', error);
      throw error;
    }
  }

  async getUpcomingReminders(): Promise<SavedJob[]> {
    try {
      const now = new Date().toISOString();
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('saved_jobs')
        .select(`
          *,
          job:jobs(
            id,
            title,
            location,
            contract_type,
            department,
            application_deadline,
            status
          )
        `)
        .gte('reminder_date', now)
        .lte('reminder_date', tomorrow)
        .eq('is_archived', false)
        .order('reminder_date', { ascending: true });

      if (error) throw error;
      return (data || []) as SavedJob[];
    } catch (error) {
      console.error('Error getting upcoming reminders:', error);
      return [];
    }
  }

  async getSavedJobsCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('saved_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('is_archived', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting saved jobs count:', error);
      return 0;
    }
  }
}

export const savedJobsService = new SavedJobsService();
