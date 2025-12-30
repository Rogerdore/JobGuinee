import { Download, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function DownloadDocumentation() {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await fetch('/JOBGUINEE_DOCUMENTATION_TECHNIQUE_COMPLETE.docx');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'JOBGUINEE_DOCUMENTATION_TECHNIQUE_COMPLETE.docx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      alert('Erreur lors du téléchargement du fichier');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Documentation Technique
          </h1>

          <p className="text-gray-600 mb-6">
            JobGuinee - Documentation Complète
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Nom du fichier:</span>
              <span className="font-medium text-gray-900">JOBGUINEE_DOCUMENTATION_TECHNIQUE_COMPLETE.docx</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Taille:</span>
              <span className="font-medium text-gray-900">19 Ko</span>
            </div>
          </div>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            {downloading ? 'Téléchargement...' : 'Télécharger la Documentation'}
          </button>

          <p className="text-xs text-gray-500 mt-4">
            Format Microsoft Word (.docx)
          </p>
        </div>
      </div>
    </div>
  );
}
