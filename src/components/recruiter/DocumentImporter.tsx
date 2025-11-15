import { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface DocumentImporterProps {
  onImport: (content: string) => void;
  buttonText?: string;
}

export default function DocumentImporter({ onImport, buttonText = 'Importer depuis PDF/DOCX' }: DocumentImporterProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      let extractedText = '';

      if (fileExtension === 'pdf') {
        extractedText = await extractTextFromPDF(file);
      } else if (fileExtension === 'docx' || fileExtension === 'doc') {
        extractedText = await extractTextFromDOCX(file);
      } else {
        throw new Error('Format de fichier non supporté. Veuillez utiliser PDF ou DOCX.');
      }

      if (!extractedText.trim()) {
        throw new Error('Aucun texte trouvé dans le document.');
      }

      onImport(extractedText);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la lecture du document');
      console.error('Document import error:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n\n';
    }

    return fullText.trim();
  };

  const extractTextFromDOCX = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleFileSelect}
        className="hidden"
      />

      <button
        type="button"
        onClick={handleButtonClick}
        disabled={uploading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Importation en cours...
          </>
        ) : success ? (
          <>
            <CheckCircle2 className="w-5 h-5" />
            Document importé avec succès
          </>
        ) : (
          <>
            <Upload className="w-5 h-5" />
            {buttonText}
          </>
        )}
      </button>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border-2 border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">Erreur d'import</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border-2 border-green-200 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <p className="text-sm font-medium text-green-900">
            Le contenu du document a été importé avec succès
          </p>
        </div>
      )}

      <div className="flex items-start gap-2 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
        <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 text-sm text-blue-900">
          <p className="font-medium">Formats acceptés: PDF, DOC, DOCX</p>
          <p className="mt-1 text-blue-700">
            Le texte extrait remplacera le contenu actuel de la description complète.
          </p>
        </div>
      </div>
    </div>
  );
}
