import { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2, Eye, Edit3, X, Check } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { parseJobDocument, ParsedJobData } from '../../utils/jobParser';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

interface StructuredDocumentImporterProps {
  onImport: (data: ParsedJobData, rawText: string) => void;
  onCancel?: () => void;
  buttonText?: string;
}

export default function StructuredDocumentImporter({
  onImport,
  onCancel,
  buttonText = 'Importer depuis PDF/DOCX'
}: StructuredDocumentImporterProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [parsedData, setParsedData] = useState<ParsedJobData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('📄 File selected:', file.name, 'Size:', file.size, 'Type:', file.type);

    setUploading(true);
    setError(null);

    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      console.log('🔍 File extension:', fileExtension);
      let extractedText = '';

      if (fileExtension === 'pdf') {
        console.log('📖 Extracting from PDF...');
        extractedText = await extractTextFromPDF(file);
      } else if (fileExtension === 'docx' || fileExtension === 'doc') {
        console.log('📝 Extracting from DOCX...');
        extractedText = await extractTextFromDOCX(file);
      } else if (fileExtension === 'txt' || fileExtension === 'rtf') {
        console.log('📝 Reading plain text...');
        extractedText = await readAsText(file);
      } else {
        throw new Error('Format de fichier non supporté. Veuillez utiliser PDF, DOCX ou TXT.');
      }

      console.log('✅ Text extracted, length:', extractedText.length);

      if (!extractedText.trim()) {
        throw new Error('Aucun texte trouvé dans le document.');
      }

      // Parse the document
      console.log('🔍 Parsing document structure...');
      const parsed = parseJobDocument(extractedText);
      console.log('✅ Parsing complete:', parsed);

      setRawText(extractedText);
      setParsedData(parsed);
      setShowPreview(true);
    } catch (err: any) {
      console.error('❌ Document import error:', err);
      setError(err.message || 'Erreur lors de la lecture du document');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      console.log('📦 ArrayBuffer created, size:', arrayBuffer.byteLength);

      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      console.log('📄 PDF loaded, pages:', pdf.numPages);

      let fullText = '';

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        console.log(`📖 Reading page ${pageNum}/${pdf.numPages}...`);
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n\n';
      }

      return fullText.trim();
    } catch (err: any) {
      console.error('PDF extraction error:', err);
      throw new Error(`Erreur lors de la lecture du PDF: ${err.message}`);
    }
  };

  const extractTextFromDOCX = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      console.log('📦 ArrayBuffer created for DOCX, size:', arrayBuffer.byteLength);

      const result = await mammoth.extractRawText({ arrayBuffer });
      console.log('📝 DOCX text extracted, length:', result.value.length);

      return result.value;
    } catch (err: any) {
      console.error('DOCX extraction error:', err);
      throw new Error(`Erreur lors de la lecture du DOCX: ${err.message}`);
    }
  };

  const readAsText = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
      reader.readAsText(file);
    });
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🖱️ Button clicked, opening file picker...');
    fileInputRef.current?.click();
  };

  const handleConfirm = () => {
    if (parsedData && rawText) {
      onImport(parsedData, rawText);
      setShowPreview(false);
      setParsedData(null);
      setRawText('');
    }
  };

  const handleCancelPreview = () => {
    setShowPreview(false);
    setParsedData(null);
    setRawText('');
    if (onCancel) onCancel();
  };

  if (showPreview && parsedData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8">
          <div className="flex items-center justify-between p-6 border-b-2 border-gray-200">
            <div className="flex items-center gap-3">
              <Eye className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Relecture et Édition</h2>
            </div>
            <button
              onClick={handleCancelPreview}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto space-y-4">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">✅ Document analysé avec succès!</span>
                <br />
                Vérifiez les informations extraites ci-dessous. Vous pourrez les modifier après validation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {parsedData.title && (
                <PreviewField label="Titre du poste" value={parsedData.title} />
              )}
              {parsedData.location && (
                <PreviewField label="Localisation" value={parsedData.location} />
              )}
              {parsedData.contract_type && (
                <PreviewField label="Type de contrat" value={parsedData.contract_type} />
              )}
              {parsedData.experience_level && (
                <PreviewField label="Niveau d'expérience" value={parsedData.experience_level} />
              )}
              {parsedData.education_level && (
                <PreviewField label="Niveau d'études" value={parsedData.education_level} />
              )}
              {parsedData.sector && (
                <PreviewField label="Secteur" value={parsedData.sector} />
              )}
              {(parsedData.salary_min || parsedData.salary_max) && (
                <PreviewField
                  label="Salaire"
                  value={`${parsedData.salary_min || '?'} - ${parsedData.salary_max || '?'} €`}
                />
              )}
              {parsedData.deadline && (
                <PreviewField label="Date limite" value={parsedData.deadline} />
              )}
              {parsedData.company_name && (
                <PreviewField label="Entreprise" value={parsedData.company_name} />
              )}
              {parsedData.company_email && (
                <PreviewField label="Email" value={parsedData.company_email} />
              )}
            </div>

            {parsedData.description && (
              <PreviewField label="Description" value={parsedData.description} multiline />
            )}
            {parsedData.responsibilities && (
              <PreviewField label="Missions principales" value={parsedData.responsibilities} multiline />
            )}
            {parsedData.requirements && (
              <PreviewField label="Profil recherché" value={parsedData.requirements} multiline />
            )}
            {parsedData.benefits && (
              <PreviewField label="Avantages" value={parsedData.benefits} multiline />
            )}
            {parsedData.company_description && (
              <PreviewField label="À propos de l'entreprise" value={parsedData.company_description} multiline />
            )}

            {parsedData.skills && parsedData.skills.length > 0 && (
              <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Compétences détectées
                </label>
                <div className="flex flex-wrap gap-2">
                  {parsedData.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {parsedData.languages && parsedData.languages.length > 0 && (
              <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Langues détectées
                </label>
                <div className="flex flex-wrap gap-2">
                  {parsedData.languages.map((lang, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 p-6 border-t-2 border-gray-200 bg-gray-50">
            <button
              onClick={handleCancelPreview}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition flex items-center gap-2"
            >
              <Check className="w-5 h-5" />
              Valider et remplir le formulaire
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.rtf"
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
            Analyse en cours...
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

      <div className="flex items-start gap-2 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
        <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 text-sm text-blue-900">
          <p className="font-medium">Formats acceptés: PDF, DOC, DOCX, TXT</p>
          <p className="mt-1 text-blue-700">
            Le système détectera automatiquement les sections et remplira les champs correspondants.
          </p>
        </div>
      </div>
    </div>
  );
}

function PreviewField({ label, value, multiline = false }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      {multiline ? (
        <p className="text-sm text-gray-900 whitespace-pre-wrap">{value}</p>
      ) : (
        <p className="text-sm text-gray-900 font-medium">{value}</p>
      )}
    </div>
  );
}
