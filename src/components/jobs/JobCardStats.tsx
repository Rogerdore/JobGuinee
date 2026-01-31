import { TrendingUp, Users, Heart, MessageCircle, Clock } from 'lucide-react';
import { Job, Company } from '../../lib/supabase';

interface JobCardStatsProps {
  job: Job & { companies?: Company };
  variant?: 'compact' | 'full';
  showDate?: boolean;
}

/**
 * COMPOSANT UNIFIÉ - INDICATEURS DE CARTE D'OFFRE
 *
 * Ce composant affiche de manière cohérente les statistiques d'une offre d'emploi.
 * Il doit être utilisé dans TOUTES les pages affichant des cartes d'offres.
 *
 * @param job - L'offre d'emploi avec ses statistiques
 * @param variant - 'compact' (vues + candidats) ou 'full' (+ favoris + commentaires)
 * @param showDate - Afficher la date de publication
 *
 * AUDIT 31/01/2026:
 * - Créé pour uniformiser l'affichage entre Home.tsx et Jobs.tsx
 * - Corrige l'incohérence visuelle identifiée dans l'audit
 * - Tous les compteurs proviennent directement de la base de données
 */
export default function JobCardStats({ job, variant = 'compact', showDate = true }: JobCardStatsProps) {
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Aujourd'hui";
    if (diffInDays === 1) return 'Hier';
    if (diffInDays < 7) return `Il y a ${diffInDays} jours`;
    if (diffInDays < 30) return `Il y a ${Math.floor(diffInDays / 7)} semaines`;
    if (diffInDays < 365) return `Il y a ${Math.floor(diffInDays / 30)} mois`;
    return `Il y a ${Math.floor(diffInDays / 365)} ans`;
  };

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
      {/* Date de publication */}
      {showDate && job.created_at && (
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-gray-400" />
          <span>{getTimeAgo(job.created_at)}</span>
        </div>
      )}

      {/* Nombre de vues */}
      {(job.views_count || 0) > 0 && (
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-blue-500" />
          <span>{job.views_count} vue{job.views_count > 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Nombre de candidats */}
      {(job.applications_count || 0) > 0 && (
        <div className="flex items-center gap-1.5">
          <Users className="w-4 h-4 text-green-500" />
          <span>
            {job.applications_count} candidat{job.applications_count > 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Indicateurs étendus (variant full) */}
      {variant === 'full' && (
        <>
          {/* Nombre de favoris */}
          {(job.saves_count || 0) > 0 && (
            <div className="flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-red-500" />
              <span>{job.saves_count}</span>
            </div>
          )}

          {/* Nombre de commentaires */}
          {(job.comments_count || 0) > 0 && (
            <div className="flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-purple-500" />
              <span>{job.comments_count}</span>
            </div>
          )}
        </>
      )}

      {/* Message si aucune statistique */}
      {!showDate &&
        (job.views_count || 0) === 0 &&
        (job.applications_count || 0) === 0 &&
        (variant === 'compact' || ((job.saves_count || 0) === 0 && (job.comments_count || 0) === 0)) && (
          <div className="flex items-center gap-1.5 text-gray-400">
            <span className="text-xs italic">Nouvelle offre</span>
          </div>
        )}
    </div>
  );
}
