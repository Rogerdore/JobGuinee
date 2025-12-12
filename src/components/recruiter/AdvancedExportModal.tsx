import React, { useState } from 'react';
import { X, Download, FileText, Table, FileArchive, CheckCircle, AlertCircle } from 'lucide-react';
import { recruiterExportService } from '../../services/recruiterExportService';

interface AdvancedExportModalProps {
  jobId: string;
  jobTitle: string;
  companyId: string;
  applicationIds?: string[];
  stage?: string;
  onClose: () => void;
}

export default function AdvancedExportModal({
  jobId,
  jobTitle,
  companyId,
  applicationIds,
  stage,
  onClose
}: AdvancedExportModalProps) {
  const [exportType, setExportType] = useState<'csv' | 'excel' | 'pdf' | 'zip'>('csv');
  const [exporting, setExporting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleExport = async () => {
    setExporting(true);
    setError('');

    try {
      const options = {
        jobId,
        companyId,
        applicationIds,
        stage
      };

      switch (exportType) {
        case 'csv':
          await recruiterExportService.exportToCSV(options, `candidatures_${jobTitle}.csv`);
          break;
        case 'excel':
          await recruiterExportService.exportToExcel(options, `candidatures_${jobTitle}.xlsx`);
          break;
        case 'pdf':
          await recruiterExportService.exportToPDF(options, jobTitle, `rapport_${jobTitle}.pdf`);
          break;
        case 'zip':
          await recruiterExportService.exportDocumentsToZIP(options, `documents_${jobTitle}.zip`);
          break;
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Export error:', err);
      setError(err.message || 'Erreur lors de l\'export');
    } finally {
      setExporting(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Export réussi!
          </h3>
          <p className="text-gray-600">
            Le téléchargement va démarrer automatiquement.
          </p>
        </div>
      </div>
    );
  }

  const exportOptions = [
    {
      type: 'csv' as const,
      icon: Table,
      title: 'CSV',
      description: 'Fichier CSV compatible Excel, Google Sheets',
      details: 'Format texte avec toutes les données structurées'
    },
    {
      type: 'excel' as const,
      icon: Table,
      title: 'Excel',
      description: 'Fichier Excel .xlsx',
      details: 'Format Microsoft Excel avec formatage'
    },
    {
      type: 'pdf' as const,
      icon: FileText,
      title: 'PDF',
      description: 'Rapport PDF professionnel',
      details: 'Document avec statistiques et aperçu visuel'
    },
    {
      type: 'zip' as const,
      icon: FileArchive,
      title: 'ZIP',
      description: 'Archive complète (CV + documents)',
      details: 'Tous les CV et lettres de motivation en ZIP'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between">
          <h3 className="text-2xl font-bold text-gray-900 flex items-center">
            <Download className="w-7 h-7 mr-3 text-green-600" />
            Export avancé
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Offre:</strong> {jobTitle}
            </p>
            {stage && (
              <p className="text-sm text-blue-900 mt-1">
                <strong>Filtre:</strong> {stage}
              </p>
            )}
            {applicationIds && applicationIds.length > 0 && (
              <p className="text-sm text-blue-900 mt-1">
                <strong>Candidatures sélectionnées:</strong> {applicationIds.length}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Choisissez le format d'export
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exportOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.type}
                    onClick={() => setExportType(option.type)}
                    className={`p-4 border-2 rounded-lg text-left transition ${
                      exportType === option.type
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-start">
                      <Icon className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 mb-1">{option.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{option.description}</p>
                        <p className="text-xs text-gray-500">{option.details}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Données exportées:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Nom et coordonnées des candidats</li>
              <li>• Expérience et formation</li>
              <li>• Compétences</li>
              <li>• Score IA et catégorie</li>
              <li>• Statut dans le pipeline</li>
              <li>• Date de candidature</li>
              {exportType === 'zip' && (
                <>
                  <li className="text-green-600 font-medium">• CV complets (si disponibles)</li>
                  <li className="text-green-600 font-medium">• Lettres de motivation</li>
                </>
              )}
            </ul>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {exporting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Export en cours...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Exporter
                </>
              )}
            </button>
            <button
              onClick={onClose}
              disabled={exporting}
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
