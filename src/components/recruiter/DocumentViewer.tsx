import { useState, useEffect } from 'react';
import { X, Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

interface DocumentViewerProps {
  file: File;
  onRemove: () => void;
}

export default function DocumentViewer({ file, onRemove }: DocumentViewerProps) {
  const [fileUrl, setFileUrl] = useState<string>('');
  const [fileType, setFileType] = useState<'pdf' | 'image' | 'document'>('document');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [renderedPage, setRenderedPage] = useState<string>('');
  const [loading, setLoading] = useState(true);

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
      const arrayBuffer = await pdfFile.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      setPdfDocument(pdf);
      setTotalPages(pdf.numPages);
      await renderPage(pdf, 1);
      setLoading(false);
    } catch (error) {
      console.error('Error loading PDF:', error);
      setLoading(false);
    }
  };

  const renderPage = async (pdf: any, pageNumber: number) => {
    try {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: zoom / 100 });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (context) {
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;

        setRenderedPage(canvas.toDataURL());
      }
    } catch (error) {
      console.error('Error rendering page:', error);
    }
  };

  useEffect(() => {
    if (pdfDocument && fileType === 'pdf') {
      renderPage(pdfDocument, currentPage);
    }
  }, [currentPage, zoom, pdfDocument]);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleZoomIn = () => {
    if (zoom < 200) setZoom(zoom + 25);
  };

  const handleZoomOut = () => {
    if (zoom > 50) setZoom(zoom - 25);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
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
            {/* Zoom controls */}
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border-2 border-gray-300">
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 50}
                className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                title="Zoom arrière"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold min-w-[60px] text-center">{zoom}%</span>
              <button
                onClick={handleZoomIn}
                disabled={zoom >= 200}
                className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                title="Zoom avant"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Page navigation for PDF */}
            {fileType === 'pdf' && totalPages > 1 && (
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border-2 border-gray-300">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Page précédente"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-semibold min-w-[80px] text-center">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Page suivante"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document viewer */}
      <div className="bg-gray-200 p-6 min-h-[500px] max-h-[700px] overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-[500px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Chargement du document...</p>
            </div>
          </div>
        ) : fileType === 'pdf' ? (
          <div className="flex justify-center">
            {renderedPage ? (
              <img
                src={renderedPage}
                alt={`Page ${currentPage}`}
                className="max-w-full h-auto shadow-2xl"
                style={{ width: `${zoom}%` }}
              />
            ) : (
              <div className="bg-white p-8 rounded-lg shadow-lg">
                <p className="text-gray-600">Erreur lors du chargement de la page</p>
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
