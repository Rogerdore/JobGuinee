import { useState, useEffect } from 'react';
import { X, Download, FileText, AlertCircle } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface DocumentViewerProps {
  file: File;
  onRemove: () => void;
}

export default function DocumentViewer({ file, onRemove }: DocumentViewerProps) {
  const [fileUrl, setFileUrl] = useState<string>('');
  const [fileType, setFileType] = useState<'pdf' | 'image' | 'document' | 'text'>('document');
  const [totalPages, setTotalPages] = useState(1);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [renderedPages, setRenderedPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [documentContent, setDocumentContent] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setFileUrl(url);

    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'pdf') {
      setFileType('pdf');
      loadPDF(file);
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      setFileType('image');
      setLoading(false);
    } else if (['doc', 'docx'].includes(extension || '')) {
      setFileType('text');
      loadWordDocument(file);
    } else if (extension === 'txt') {
      setFileType('text');
      loadTextFile(file);
    } else {
      setFileType('document');
      setLoading(false);
    }

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const loadPDF = async (pdfFile: File) => {
    try {
      setLoading(true);
      setError('');
      const arrayBuffer = await pdfFile.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      setPdfDocument(pdf);
      const numPages = Math.min(pdf.numPages, 5);
      setTotalPages(pdf.numPages);
      await renderAllPages(pdf, numPages);
      setLoading(false);
    } catch (err) {
      console.error('Error loading PDF:', err);
      setError('Erreur lors du chargement du PDF. Le fichier est peut-être corrompu.');
      setLoading(false);
    }
  };

  const loadWordDocument = async (wordFile: File) => {
    try {
      setLoading(true);
      const arrayBuffer = await wordFile.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      setDocumentContent(result.value);
      setLoading(false);
    } catch (error) {
      console.error('Error loading Word document:', error);
      setDocumentContent('<p class="text-red-600">Erreur lors du chargement du document Word</p>');
      setLoading(false);
    }
  };

  const loadTextFile = async (textFile: File) => {
    try {
      setLoading(true);
      const text = await textFile.text();
      setDocumentContent(`<pre style="white-space: pre-wrap; font-family: inherit;">${text}</pre>`);
      setLoading(false);
    } catch (error) {
      console.error('Error loading text file:', error);
      setDocumentContent('<p class="text-red-600">Erreur lors du chargement du fichier texte</p>');
      setLoading(false);
    }
  };

  const renderAllPages = async (pdf: any, numPages: number) => {
    try {
      setError('');
      const pages: string[] = [];

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise;

          pages.push(canvas.toDataURL());
        }
      }

      setRenderedPages(pages);
    } catch (err) {
      console.error('Error rendering pages:', err);
      setError('Erreur lors du rendu des pages');
      setRenderedPages([]);
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };


  return (
    <div className="bg-white border-2 border-gray-300 rounded-xl overflow-hidden shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-white" />
            <div>
              <h3 className="text-lg font-bold text-white">Aperçu du document importé (sans modification)</h3>
              <p className="text-sm text-blue-100">{file.name} • {(file.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
          <button
            onClick={onRemove}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
            title="Supprimer le document"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-100 px-6 py-3 border-b-2 border-gray-300">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
            >
              <Download className="w-4 h-4" />
              Télécharger
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Page count for PDF */}
            {fileType === 'pdf' && (
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border-2 border-gray-300">
                <span className="text-sm font-semibold">
                  {Math.min(renderedPages.length, 5)} / {totalPages} pages affichées
                  {totalPages > 5 && ' (max 5)'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document viewer */}
      <div className="bg-gray-200 p-6 min-h-[500px] max-h-[700px] overflow-auto">
        {error ? (
          <div className="flex items-center justify-center h-[500px]">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
              <div className="text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h4 className="text-lg font-bold text-gray-900 mb-2">Erreur de chargement</h4>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition mx-auto"
                >
                  <Download className="w-5 h-5" />
                  Télécharger le fichier
                </button>
              </div>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-[500px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Chargement du document...</p>
            </div>
          </div>
        ) : fileType === 'pdf' ? (
          <div className="flex flex-col items-center gap-6">
            {renderedPages.length > 0 ? (
              renderedPages.map((pageDataUrl, index) => (
                <div key={index} className="relative">
                  <div className="absolute -top-3 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg z-10">
                    Page {index + 1}
                  </div>
                  <img
                    src={pageDataUrl}
                    alt={`Page ${index + 1}`}
                    className="max-w-full h-auto shadow-2xl rounded-lg border-4 border-white"
                  />
                </div>
              ))
            ) : (
              <div className="bg-white p-8 rounded-lg shadow-lg">
                <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-3" />
                <p className="text-gray-600 text-center">Le document ne peut pas être affiché</p>
              </div>
            )}
          </div>
        ) : fileType === 'image' ? (
          <div className="flex justify-center">
            <img
              src={fileUrl}
              alt={file.name}
              className="max-w-full h-auto shadow-2xl rounded-lg"
              style={{ width: `${zoom}%` }}
            />
          </div>
        ) : fileType === 'text' ? (
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
            <div
              className="prose prose-sm max-w-none"
              style={{ fontSize: `${zoom}%` }}
              dangerouslySetInnerHTML={{ __html: documentContent }}
            />
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
            <div className="text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-bold text-gray-900 mb-2">
                Aperçu non disponible
              </h4>
              <p className="text-gray-600 mb-4">
                Le format {file.name.split('.').pop()?.toUpperCase()} ne peut pas être affiché directement.
              </p>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition mx-auto"
              >
                <Download className="w-5 h-5" />
                Télécharger pour voir le contenu
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="bg-blue-50 px-6 py-3 border-t-2 border-blue-200">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">Note :</span> Ce document sera publié tel quel avec l'offre d'emploi.
          Les candidats pourront le télécharger et le consulter.
        </p>
      </div>
    </div>
  );
}
