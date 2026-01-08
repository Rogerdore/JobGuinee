import { supabase } from '../lib/supabase';

export interface JobComment {
  id: string;
  job_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  is_edited: boolean;
  is_flagged: boolean;
  flagged_reason: string | null;
  created_at: string;
  updated_at: string;
  full_name?: string;
  user_type?: string;
  user_avatar?: string;
  replies_count?: number;
  likes_count?: number;
  helpful_count?: number;
  insightful_count?: number;
  replies?: JobComment[];
}

export interface CommentReaction {
  id: string;
  comment_id: string;
  user_id: string;
  reaction_type: 'like' | 'helpful' | 'insightful';
  created_at: string;
}

export interface CreateCommentData {
  job_id: string;
  content: string;
  parent_id?: string;
}

class JobCommentsService {
  async getJobComments(jobId: string, page: number = 0, limit: number = 20): Promise<JobComment[]> {
    try {
      const { data, error } = await supabase.rpc('get_job_comments', {
        job_uuid: jobId,
        page_limit: limit,
        page_offset: page * limit
      });

      if (error) throw error;

      const comments = data || [];

      const commentsWithReplies = await Promise.all(
        comments.map(async (comment: JobComment) => {
          const replies = await this.getCommentReplies(comment.id);
          return { ...comment, replies };
        })
      );

      return commentsWithReplies;
    } catch (error) {
      console.error('Error fetching job comments:', error);
      throw error;
    }
  }

  async getCommentReplies(parentId: string): Promise<JobComment[]> {
    try {
      const { data, error } = await supabase
        .from('job_comments_with_details')
        .select('*')
        .eq('parent_id', parentId)
        .eq('is_flagged', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching comment replies:', error);
      return [];
    }
  }

  async createComment(commentData: CreateCommentData): Promise<JobComment> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('job_comments')
        .insert({
          job_id: commentData.job_id,
          user_id: user.id,
          parent_id: commentData.parent_id || null,
          content: commentData.content.trim()
        })
        .select()
        .single();

      if (error) throw error;

      const { data: commentWithDetails } = await supabase
        .from('job_comments_with_details')
        .select('*')
        .eq('id', data.id)
        .single();

      return commentWithDetails || data;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  }

  async updateComment(commentId: string, content: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('job_comments')
        .update({ content: content.trim() })
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  }

  async deleteComment(commentId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('job_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }

  async addReaction(commentId: string, reactionType: 'like' | 'helpful' | 'insightful'): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('job_comment_reactions')
        .insert({
          comment_id: commentId,
          user_id: user.id,
          reaction_type: reactionType
        });

      if (error) {
        if (error.code === '23505') {
          await this.removeReaction(commentId, reactionType);
          return;
        }
        throw error;
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  }

  async removeReaction(commentId: string, reactionType: 'like' | 'helpful' | 'insightful'): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('job_comment_reactions')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .eq('reaction_type', reactionType);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing reaction:', error);
      throw error;
    }
  }

  async getUserReactions(commentIds: string[]): Promise<Record<string, string[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return {};

      const { data, error } = await supabase
        .from('job_comment_reactions')
        .select('comment_id, reaction_type')
        .eq('user_id', user.id)
        .in('comment_id', commentIds);

      if (error) throw error;

      const reactions: Record<string, string[]> = {};
      data?.forEach(reaction => {
        if (!reactions[reaction.comment_id]) {
          reactions[reaction.comment_id] = [];
        }
        reactions[reaction.comment_id].push(reaction.reaction_type);
      });

      return reactions;
    } catch (error) {
      console.error('Error fetching user reactions:', error);
      return {};
    }
  }

  async flagComment(commentId: string, reason: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('flag_job_comment', {
        comment_uuid: commentId,
        reason
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error flagging comment:', error);
      throw error;
    }
  }

  async getCommentsCount(jobId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('count_job_comments', {
        job_uuid: jobId
      });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error fetching comments count:', error);
      return 0;
    }
  }

  subscribeToJobComments(jobId: string, callback: (payload: any) => void) {
    const subscription = supabase
      .channel(`job_comments:${jobId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_comments',
          filter: `job_id=eq.${jobId}`
        },
        callback
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }
}

export const jobCommentsService = new JobCommentsService();
