import React, { useState, useEffect } from 'react';
import { History, RotateCcw, Eye, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { IAConfigRollbackService, RollbackResult } from '../../services/iaConfigRollbackService';

interface ConfigHistoryWithRollbackProps {
  serviceCode: string;
  onRollbackSuccess?: () => void;
}

export function ConfigHistoryWithRollback({
  serviceCode,
  onRollbackSuccess
}: ConfigHistoryWithRollbackProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [rollbackReason, setRollbackReason] = useState('');
  const [showRollbackModal, setShowRollbackModal] = useState(false);
  const [rollbackLoading, setRollbackLoading] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [serviceCode]);

  const loadHistory = async () => {
    setLoading(true);
    const data = await IAConfigRollbackService.getVersionHistory(serviceCode);
    setHistory(data);
    setLoading(false);
  };

  const handleRollbackClick = (entry: any) => {
    setSelectedEntry(entry);
    setRollbackReason(`Restauration de la version ${entry.new_version}`);
    setShowRollbackModal(true);
  };

  const handleRollback = async () => {
    if (!selectedEntry) return;

    setRollbackLoading(true);
    const result: RollbackResult = await IAConfigRollbackService.rollbackConfig(
      serviceCode,
      selectedEntry.new_version,
      rollbackReason
    );

    setRollbackLoading(false);

    if (result.success) {
      alert(`Rollback réussi ! Version ${result.previous_version} → ${result.new_version}`);
      setShowRollbackModal(false);
      loadHistory();
      onRollbackSuccess?.();
    } else {
      alert(`Erreur: ${result.message}`);
    }
  };

  const formatChanges = (entry: any): string[] => {
    return IAConfigRollbackService.formatChanges(entry.field_changes);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Historique des Versions</h3>
          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
            {history.length} versions
          </span>
        </div>
      </div>

      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {history.map((entry, index) => {
          const isRollback = entry.changes_summary?.includes('Rollback');
          const changes = formatChanges(entry);

          return (
            <div
              key={entry.id}
              className={`p-4 hover:bg-gray-50 ${index === 0 ? 'bg-blue-50' : ''}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    index === 0
                      ? 'bg-green-100 text-green-700'
                      : isRollback
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {index === 0 ? 'Version Actuelle' : `Version ${entry.new_version}`}
                  </div>
                  {isRollback && (
                    <div className="flex items-center gap-1 text-orange-600">
                      <RotateCcw className="w-4 h-4" />
                      <span className="text-xs font-medium">Rollback</span>
                    </div>
                  )}
                </div>

                {index !== 0 && (
                  <button
                    onClick={() => handleRollbackClick(entry)}
                    className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 flex items-center gap-1"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Restaurer
                  </button>
                )}
              </div>

              <div className="text-sm mb-2">
                <div className="font-medium text-gray-900 mb-1">
                  {entry.changes_summary || 'Modification de configuration'}
                </div>
                {entry.change_reason && (
                  <div className="text-gray-600 italic">
                    Raison: {entry.change_reason}
                  </div>
                )}
              </div>

              {changes.length > 0 && (
                <div className="bg-gray-50 rounded p-2 mb-2">
                  <div className="text-xs font-medium text-gray-700 mb-1">Changements:</div>
                  <ul className="text-xs text-gray-600 space-y-0.5">
                    {changes.map((change, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span>•</span>
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>
                  Par: {entry.changed_by_profile?.full_name || entry.changed_by_profile?.email || 'Système'}
                </span>
                <span>
                  {new Date(entry.changed_at).toLocaleString('fr-FR')}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {showRollbackModal && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                  <h3 className="text-xl font-bold text-gray-900">
                    Confirmer le Rollback
                  </h3>
                </div>
                <button
                  onClick={() => setShowRollbackModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded">
                <p className="text-sm text-orange-800 mb-2">
                  Vous êtes sur le point de restaurer la configuration à la version {selectedEntry.new_version}.
                </p>
                <p className="text-sm text-orange-700">
                  La configuration actuelle sera sauvegardée dans l'historique et une nouvelle version sera créée.
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Raison du rollback
                </label>
                <textarea
                  value={rollbackReason}
                  onChange={(e) => setRollbackReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows={3}
                  placeholder="Pourquoi effectuer ce rollback ?"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowRollbackModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={rollbackLoading}
                >
                  Annuler
                </button>
                <button
                  onClick={handleRollback}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center justify-center gap-2"
                  disabled={rollbackLoading || !rollbackReason.trim()}
                >
                  {rollbackLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Restauration...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      Confirmer le Rollback
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
