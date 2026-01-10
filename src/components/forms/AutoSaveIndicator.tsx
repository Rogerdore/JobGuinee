import { memo, useEffect, useState } from 'react';
import { Loader, CheckCircle, Clock, AlertCircle, Save, Cloud, Database } from 'lucide-react';
import { AutoSaveStatus } from '../../hooks/useAutoSave';

interface AutoSaveIndicatorProps {
  status: AutoSaveStatus;
  lastSaved: Date | null;
  lastDatabaseSave?: Date | null;
  className?: string;
}

const AutoSaveIndicator = memo(function AutoSaveIndicator({
  status,
  lastSaved,
  lastDatabaseSave,
  className = '',
}: AutoSaveIndicatorProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatTimeAgo = (date: Date | null) => {
    if (!date) return '';
    const diff = Math.floor((currentTime.getTime() - date.getTime()) / 1000);

    if (diff < 5) return 'à l\'instant';
    if (diff < 60) return `il y a ${diff}s`;
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`;
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`bg-white border-2 border-gray-200 rounded-xl p-4 shadow-sm ${className}`}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          {status === 'saving' && (
            <>
              <Loader className="w-5 h-5 text-blue-600 animate-spin" />
              <div>
                <p className="text-sm text-gray-700 font-medium">Sauvegarde en cours...</p>
                <p className="text-xs text-gray-500">Vos modifications sont en cours d'enregistrement</p>
              </div>
            </>
          )}
          {status === 'saved' && (
            <>
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-green-700 font-medium">Toutes les modifications enregistrées</p>
                <p className="text-xs text-gray-500">{formatTimeAgo(lastSaved)}</p>
              </div>
            </>
          )}
          {status === 'idle' && lastSaved && (
            <>
              <Clock className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-700 font-medium">Sauvegarde automatique activée</p>
                <p className="text-xs text-gray-500">Dernière sauvegarde: {formatTimeAgo(lastSaved)}</p>
              </div>
            </>
          )}
          {status === 'error' && (
            <>
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm text-red-600 font-medium">Erreur de sauvegarde</p>
                <p className="text-xs text-red-500">Veuillez réessayer ou contacter le support</p>
              </div>
            </>
          )}
          {status === 'idle' && !lastSaved && (
            <>
              <Save className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-700 font-medium">Sauvegarde automatique activée</p>
                <p className="text-xs text-gray-500">Vos modifications seront sauvegardées automatiquement</p>
              </div>
            </>
          )}
        </div>

        {lastDatabaseSave && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
            <Database className="w-4 h-4 text-blue-600" />
            <div className="text-xs">
              <p className="text-blue-700 font-medium">Synchronisé</p>
              <p className="text-blue-600">{formatTimeAgo(lastDatabaseSave)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default AutoSaveIndicator;
