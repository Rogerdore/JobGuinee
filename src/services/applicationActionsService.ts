import { supabase } from '../lib/supabase';

export interface ApplicationNote {
  id: string;
  application_id: string;
  recruiter_id: string;
  note_text: string;
  is_private: boolean;
  created_at: string;
  recruiter_name?: string;
}

export interface ActivityLogEntry {
  id: string;
  application_id: string;
  actor_id: string;
  action_type: string;
  metadata: Record<string, any>;
  created_at: string;
  actor_name?: string;
}

export const applicationActionsService = {
  async addNote(applicationId: string, noteText: string, isPrivate: boolean = true): Promise<{ success: boolean; error?: string; note?: ApplicationNote }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Non authentifié' };
      }

      const { data: note, error } = await supabase
        .from('application_notes')
        .insert({
          application_id: applicationId,
          recruiter_id: user.id,
          note_text: noteText,
          is_private: isPrivate
        })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('application_activity_log')
        .insert({
          application_id: applicationId,
          actor_id: user.id,
          action_type: 'note_added',
          metadata: { note_preview: noteText.substring(0, 100) }
        });

      return { success: true, note };
    } catch (error: any) {
      console.error('Error adding note:', error);
      return { success: false, error: error.message };
    }
  },

  async getNotes(applicationId: string): Promise<{ success: boolean; notes?: ApplicationNote[]; error?: string }> {
    try {
      const { data: notes, error } = await supabase
        .from('application_notes')
        .select(`
          *,
          recruiter:recruiter_id (
            full_name
          )
        `)
        .eq('application_id', applicationId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const notesWithNames = notes?.map(note => ({
        ...note,
        recruiter_name: (note as any).recruiter?.full_name || 'Recruteur'
      }));

      return { success: true, notes: notesWithNames };
    } catch (error: any) {
      console.error('Error fetching notes:', error);
      return { success: false, error: error.message };
    }
  },

  async shortlistApplication(applicationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Non authentifié' };
      }

      const { error } = await supabase
        .from('applications')
        .update({
          is_shortlisted: true,
          shortlisted_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error shortlisting application:', error);
      return { success: false, error: error.message };
    }
  },

  async unshortlistApplication(applicationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Non authentifié' };
      }

      const { error } = await supabase
        .from('applications')
        .update({
          is_shortlisted: false,
          shortlisted_at: null
        })
        .eq('id', applicationId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error unshortlisting application:', error);
      return { success: false, error: error.message };
    }
  },

  async rejectApplication(applicationId: string, reason: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!reason || reason.trim().length === 0) {
        return { success: false, error: 'Le motif de rejet est obligatoire' };
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Non authentifié' };
      }

      const { error } = await supabase
        .from('applications')
        .update({
          rejected_reason: reason,
          rejected_at: new Date().toISOString(),
          workflow_stage: 'rejected'
        })
        .eq('id', applicationId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error rejecting application:', error);
      return { success: false, error: error.message };
    }
  },

  async getActivityLog(applicationId: string): Promise<{ success: boolean; activities?: ActivityLogEntry[]; error?: string }> {
    try {
      const { data: activities, error } = await supabase
        .from('application_activity_log')
        .select(`
          *,
          actor:actor_id (
            full_name
          )
        `)
        .eq('application_id', applicationId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const activitiesWithNames = activities?.map(activity => ({
        ...activity,
        actor_name: (activity as any).actor?.full_name || 'Utilisateur'
      }));

      return { success: true, activities: activitiesWithNames };
    } catch (error: any) {
      console.error('Error fetching activity log:', error);
      return { success: false, error: error.message };
    }
  },

  getActionLabel(actionType: string): string {
    const labels: Record<string, string> = {
      'note_added': 'Note ajoutée',
      'shortlisted': 'Ajouté à la shortlist',
      'unshortlisted': 'Retiré de la shortlist',
      'rejected': 'Candidature rejetée',
      'stage_changed': 'Étape modifiée'
    };
    return labels[actionType] || actionType;
  }
};
