import { useRef } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';

interface SimpleDocumentImporterProps {
  onImport: (file: File) => void;
  buttonText?: string;
  acceptedFormats?: string;
}

export default function SimpleDocumentImporter({
  onImport,
  buttonText = 'Importer une offre (PDF/Word/Image/Texte)',
  acceptedFormats = '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp'
}: SimpleDocumentImporterProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('📄 File selected:', file.name, 'Size:', file.size, 'Type:', file.type);

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('Le fichier est trop volumineux. Taille maximale : 10 MB');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Validate file type
    const extension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = acceptedFormats.split(',').map(f => f.replace('.', '').trim());

    if (extension && !allowedExtensions.includes(extension)) {
      alert(`Format de fichier non supporté. Formats acceptés : ${acceptedFormats}`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    onImport(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats}
        onChange={handleFileSelect}
        className="hidden"
      />

      <button
        type="button"
        onClick={handleButtonClick}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-md"
      >
        <Upload className="w-5 h-5" />
        {buttonText}
      </button>

      <div className="flex items-start gap-2 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
        <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 text-sm text-blue-900">
          <p className="font-medium">Formats acceptés: PDF, DOC, DOCX, TXT, JPG, PNG</p>
          <p className="mt-1 text-blue-700">
            Le système détectera automatiquement les sections et remplira les champs correspondants.
          </p>
        </div>
      </div>
    </div>
  );
}
