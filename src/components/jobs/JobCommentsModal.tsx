import React, { useState, useEffect } from 'react';
import { X, Send, ThumbsUp, Lightbulb, Star, MoreVertical, Edit, Trash2, Flag, User } from 'lucide-react';
import { jobCommentsService, JobComment, CreateCommentData } from '../../services/jobCommentsService';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface JobCommentsModalProps {
  jobId: string;
  jobTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onCommentAdded?: () => void;
}

export default function JobCommentsModal({ jobId, jobTitle, isOpen, onClose, onCommentAdded }: JobCommentsModalProps) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<JobComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userReactions, setUserReactions] = useState<Record<string, string[]>>({});
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && jobId) {
      loadComments();
    }
  }, [isOpen, jobId]);

  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = jobCommentsService.subscribeToJobComments(jobId, () => {
      loadComments();
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen, jobId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const data = await jobCommentsService.getJobComments(jobId);
      setComments(data);

      const allCommentIds = data.flatMap(c => [c.id, ...(c.replies?.map(r => r.id) || [])]);
      const reactions = await jobCommentsService.getUserReactions(allCommentIds);
      setUserReactions(reactions);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setSubmitting(true);
    try {
      const commentData: CreateCommentData = {
        job_id: jobId,
        content: newComment
      };

      await jobCommentsService.createComment(commentData);
      setNewComment('');
      await loadComments();
      onCommentAdded?.();
    } catch (error: any) {
      console.error('Error submitting comment:', error);
      const errorMessage = error?.message || 'Erreur lors de la publication du commentaire';
      alert(errorMessage.includes('char_length')
        ? 'Le commentaire doit contenir au moins 3 caractères'
        : errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim() || replyContent.length < 3 || !user) return;

    setSubmitting(true);
    try {
      const commentData: CreateCommentData = {
        job_id: jobId,
        content: replyContent,
        parent_id: parentId
      };

      await jobCommentsService.createComment(commentData);
      setReplyContent('');
      setReplyingTo(null);
      await loadComments();
    } catch (error: any) {
      console.error('Error submitting reply:', error);
      const errorMessage = error?.message || 'Erreur lors de la publication de la réponse';
      alert(errorMessage.includes('char_length')
        ? 'La réponse doit contenir au moins 3 caractères'
        : errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      await jobCommentsService.updateComment(commentId, editContent);
      setEditingComment(null);
      setEditContent('');
      await loadComments();
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('Erreur lors de la modification du commentaire');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) return;

    try {
      await jobCommentsService.deleteComment(commentId);
      await loadComments();
      onCommentAdded?.();
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Erreur lors de la suppression du commentaire');
    }
  };

  const handleReaction = async (commentId: string, reactionType: 'like' | 'helpful' | 'insightful') => {
    if (!user) {
      alert('Vous devez être connecté pour réagir');
      return;
    }

    try {
      await jobCommentsService.addReaction(commentId, reactionType);
      await loadComments();
      const allCommentIds = comments.flatMap(c => [c.id, ...(c.replies?.map(r => r.id) || [])]);
      const reactions = await jobCommentsService.getUserReactions(allCommentIds);
      setUserReactions(reactions);
    } catch (error) {
      console.error('Error reacting to comment:', error);
    }
  };

  const handleFlagComment = async (commentId: string) => {
    const reason = prompt('Raison du signalement :');
    if (!reason) return;

    try {
      await jobCommentsService.flagComment(commentId, reason);
      alert('Commentaire signalé avec succès');
      await loadComments();
    } catch (error) {
      console.error('Error flagging comment:', error);
      alert('Seuls les administrateurs peuvent signaler des commentaires');
    }
  };

  const renderComment = (comment: JobComment, isReply: boolean = false) => {
    const isAuthor = user?.id === comment.user_id;
    const isEditing = editingComment === comment.id;
    const hasReacted = (type: string) => userReactions[comment.id]?.includes(type);

    return (
      <div key={comment.id} className={`${isReply ? 'ml-12' : ''} mb-4`}>
        <div className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                {comment.user_avatar ? (
                  <img src={comment.user_avatar} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-gray-900">{comment.full_name || 'Utilisateur'}</span>
                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                    {comment.user_type === 'candidate' ? 'Candidat' : comment.user_type === 'recruiter' ? 'Recruteur' : 'Utilisateur'}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: fr })}
                  {comment.is_edited && ' (modifié)'}
                </span>
              </div>
            </div>

            {(isAuthor || profile?.user_type === 'admin') && (
              <div className="relative">
                <button
                  onClick={() => setActiveMenu(activeMenu === comment.id ? null : comment.id)}
                  className="p-1 hover:bg-gray-200 rounded-lg transition"
                >
                  <MoreVertical className="w-4 h-4 text-gray-500" />
                </button>

                {activeMenu === comment.id && (
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    {isAuthor && (
                      <>
                        <button
                          onClick={() => {
                            setEditingComment(comment.id);
                            setEditContent(comment.content);
                            setActiveMenu(null);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Modifier</span>
                        </button>
                        <button
                          onClick={() => {
                            handleDeleteComment(comment.id);
                            setActiveMenu(null);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Supprimer</span>
                        </button>
                      </>
                    )}
                    {profile?.user_type === 'admin' && (
                      <button
                        onClick={() => {
                          handleFlagComment(comment.id);
                          setActiveMenu(null);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 text-orange-600"
                      >
                        <Flag className="w-4 h-4" />
                        <span>Signaler</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setEditingComment(null);
                    setEditContent('');
                  }}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleUpdateComment(comment.id)}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-gray-700 mb-3">{comment.content}</p>

              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleReaction(comment.id, 'like')}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition ${
                    hasReacted('like')
                      ? 'bg-blue-100 text-blue-700'
                      : 'hover:bg-gray-200 text-gray-600'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span className="text-sm font-medium">{comment.likes_count || 0}</span>
                </button>

                <button
                  onClick={() => handleReaction(comment.id, 'helpful')}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition ${
                    hasReacted('helpful')
                      ? 'bg-green-100 text-green-700'
                      : 'hover:bg-gray-200 text-gray-600'
                  }`}
                >
                  <Lightbulb className="w-4 h-4" />
                  <span className="text-sm font-medium">{comment.helpful_count || 0}</span>
                </button>

                <button
                  onClick={() => handleReaction(comment.id, 'insightful')}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition ${
                    hasReacted('insightful')
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'hover:bg-gray-200 text-gray-600'
                  }`}
                >
                  <Star className="w-4 h-4" />
                  <span className="text-sm font-medium">{comment.insightful_count || 0}</span>
                </button>

                {!isReply && (
                  <button
                    onClick={() => setReplyingTo(comment.id)}
                    className="text-sm text-gray-600 hover:text-blue-600 font-medium transition"
                  >
                    Répondre
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {replyingTo === comment.id && (
          <div className="ml-12 mt-2">
            <div className="flex space-x-2">
              <input
                type="text"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Votre réponse..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitReply(comment.id);
                  }
                }}
              />
              <button
                onClick={() => handleSubmitReply(comment.id)}
                disabled={!replyContent.trim() || replyContent.length < 3 || submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setReplyingTo(null);
                  setReplyContent('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Commentaires</h2>
            <p className="text-sm text-gray-600 mt-1 line-clamp-1">{jobTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">Aucun commentaire pour le moment</p>
              <p className="text-sm text-gray-400 mt-1">Soyez le premier à commenter cette offre</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map(comment => renderComment(comment))}
            </div>
          )}
        </div>

        {user ? (
          <div className="p-6 border-t border-gray-200">
            <form onSubmit={handleSubmitComment} className="flex space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Partagez votre avis sur cette offre..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  maxLength={2000}
                />
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${newComment.length > 0 && newComment.length < 3 ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                    {newComment.length}/2000 caractères {newComment.length > 0 && newComment.length < 3 && '(minimum 3)'}
                  </span>
                  <button
                    type="submit"
                    disabled={!newComment.trim() || newComment.length < 3 || submitting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center space-x-2 font-medium"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Publication...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Publier</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <p className="text-center text-gray-600">
              <span className="font-medium">Connectez-vous</span> pour laisser un commentaire
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
