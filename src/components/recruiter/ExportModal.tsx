import { useState } from 'react';
import { X, FileText, Download, FileSpreadsheet, Archive, Loader } from 'lucide-react';
import { recruiterExportService, ExportOptions } from '../../services/recruiterExportService';

interface ExportModalProps {
  jobId: string;
  jobTitle: string;
  selectedStage?: string;
  selectedApplicationIds?: string[];
  onClose: () => void;
}

export default function ExportModal({ jobId, jobTitle, selectedStage, selectedApplicationIds, onClose }: ExportModalProps) {
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'pdf' | 'zip'>('csv');
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);

    const options: ExportOptions = {
      jobId
    };

    if (selectedStage) {
      options.stage = selectedStage;
    }

    if (selectedApplicationIds && selectedApplicationIds.length > 0) {
      options.applicationIds = selectedApplicationIds;
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const sanitizedJobTitle = jobTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    try {
      switch (exportFormat) {
        case 'csv':
          await recruiterExportService.exportToCSV(options, `${sanitizedJobTitle}_${timestamp}.csv`);
          break;
        case 'excel':
          await recruiterExportService.exportToExcel(options, `${sanitizedJobTitle}_${timestamp}.xlsx`);
          break;
        case 'pdf':
          await recruiterExportService.exportToPDF(options, jobTitle, `rapport_${sanitizedJobTitle}_${timestamp}.pdf`);
          break;
        case 'zip':
          await recruiterExportService.exportDocumentsToZIP(options, `documents_${sanitizedJobTitle}_${timestamp}.zip`);
          break;
      }

      setTimeout(() => {
        setExporting(false);
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Export error:', error);
      setExporting(false);
      alert('Erreur lors de l\'export');
    }
  };

  const getFormatDescription = (format: string) => {
    const descriptions = {
      csv: 'Fichier CSV compatible avec Excel, Google Sheets, etc.',
      excel: 'Fichier Excel (.xlsx) pour analyse de données',
      pdf: 'Rapport PDF professionnel avec statistiques',
      zip: 'Archive ZIP contenant tous les CV et lettres de motivation'
    };
    return descriptions[format as keyof typeof descriptions];
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full">
        <div className="bg-gradient-to-r from-blue-900 via-blue-700 to-blue-900 text-white p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Exporter les candidatures</h2>
                <p className="text-blue-100 text-sm">{jobTitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {selectedApplicationIds && selectedApplicationIds.length > 0 && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">{selectedApplicationIds.length}</span> candidature{selectedApplicationIds.length > 1 ? 's' : ''} sélectionnée{selectedApplicationIds.length > 1 ? 's' : ''}
              </p>
            </div>
          )}

          {selectedStage && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-sm text-green-900">
                Export filtré sur le stage: <span className="font-semibold">{selectedStage}</span>
              </p>
            </div>
          )}

          <div className="space-y-3 mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Format d'export
            </label>

            <button
              onClick={() => setExportFormat('csv')}
              className={`w-full p-4 rounded-xl border-2 transition text-left ${
                exportFormat === 'csv'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <FileSpreadsheet className={`w-6 h-6 flex-shrink-0 ${exportFormat === 'csv' ? 'text-blue-600' : 'text-gray-400'}`} />
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">CSV</div>
                  <div className="text-sm text-gray-600">{getFormatDescription('csv')}</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setExportFormat('excel')}
              className={`w-full p-4 rounded-xl border-2 transition text-left ${
                exportFormat === 'excel'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <FileSpreadsheet className={`w-6 h-6 flex-shrink-0 ${exportFormat === 'excel' ? 'text-blue-600' : 'text-gray-400'}`} />
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">Excel</div>
                  <div className="text-sm text-gray-600">{getFormatDescription('excel')}</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setExportFormat('pdf')}
              className={`w-full p-4 rounded-xl border-2 transition text-left ${
                exportFormat === 'pdf'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <FileText className={`w-6 h-6 flex-shrink-0 ${exportFormat === 'pdf' ? 'text-blue-600' : 'text-gray-400'}`} />
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">PDF</div>
                  <div className="text-sm text-gray-600">{getFormatDescription('pdf')}</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setExportFormat('zip')}
              className={`w-full p-4 rounded-xl border-2 transition text-left ${
                exportFormat === 'zip'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <Archive className={`w-6 h-6 flex-shrink-0 ${exportFormat === 'zip' ? 'text-blue-600' : 'text-gray-400'}`} />
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">ZIP (Documents)</div>
                  <div className="text-sm text-gray-600">{getFormatDescription('zip')}</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="border-t-2 border-gray-200 p-6 bg-gray-50 flex gap-3 rounded-b-3xl">
          <button
            onClick={onClose}
            disabled={exporting}
            className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {exporting ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Export en cours...</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Exporter</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
