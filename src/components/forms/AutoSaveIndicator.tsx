import { memo } from 'react';
import { Loader, CheckCircle, Clock, AlertCircle, Save } from 'lucide-react';
import { AutoSaveStatus } from '../../hooks/useAutoSave';

interface AutoSaveIndicatorProps {
  status: AutoSaveStatus;
  lastSaved: Date | null;
}

const AutoSaveIndicator = memo(function AutoSaveIndicator({ status, lastSaved }: AutoSaveIndicatorProps) {
  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {status === 'saving' && (
            <>
              <Loader className="w-5 h-5 text-blue-600 animate-spin" />
              <p className="text-sm text-gray-700 font-medium">Enregistrement automatique en cours...</p>
            </>
          )}
          {status === 'saved' && (
            <>
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-700 font-medium">Brouillon enregistré automatiquement</p>
            </>
          )}
          {status === 'idle' && lastSaved && (
            <>
              <Clock className="w-5 h-5 text-gray-500" />
              <p className="text-sm text-gray-600">
                Dernier enregistrement : {lastSaved.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </>
          )}
          {status === 'error' && (
            <>
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-600 font-medium">Erreur d'enregistrement automatique</p>
            </>
          )}
          {status === 'idle' && !lastSaved && (
            <>
              <Save className="w-5 h-5 text-gray-400" />
              <p className="text-sm text-gray-500">L'enregistrement automatique est activé</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

export default AutoSaveIndicator;
