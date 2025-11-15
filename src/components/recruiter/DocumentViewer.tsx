import { useState, useEffect, useRef } from 'react';
import { X, Download, FileText, AlertCircle, Edit2, Save, XCircle, Plus, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
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
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState<string>('');
  const [images, setImages] = useState<string[]>([]);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setFileUrl(url);

    const extension = file.name.split('.').pop()?.toLowerCase();
    console.log('Loading file:', file.name, 'Extension:', extension, 'Type:', file.type);

    if (extension === 'pdf') {
      setFileType('pdf');
      loadPDF(file);
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      setFileType('image');
      setImages([url]);
      setLoading(false);
    } else if (['doc', 'docx'].includes(extension || '')) {
      setFileType('document');
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
      images.forEach(imgUrl => {
        if (imgUrl !== url) {
          URL.revokeObjectURL(imgUrl);
        }
      });
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
      setError('');
      console.log('Loading Word document, size:', wordFile.size, 'bytes');

      const arrayBuffer = await wordFile.arrayBuffer();
      console.log('ArrayBuffer loaded, size:', arrayBuffer.byteLength);

      const result = await mammoth.convertToHtml({ arrayBuffer });
      console.log('Conversion result:', {
        valueLength: result.value?.length,
        messagesCount: result.messages?.length,
        preview: result.value?.substring(0, 100)
      });

      if (result.value && result.value.trim()) {
        const htmlContent = result.value;
        setDocumentContent(htmlContent);
        const textContent = htmlContent.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
        setEditedContent(textContent);
        console.log('Document content set successfully');
      } else {
        setDocumentContent('<div class="text-gray-600 text-center p-8"><p>Le document semble vide ou son contenu ne peut pas être extrait.</p></div>');
        console.warn('Document content is empty');
      }

      if (result.messages && result.messages.length > 0) {
        console.warn('Word document conversion warnings:', result.messages);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading Word document:', err);
      setError('Erreur lors du chargement du document Word. Le fichier est peut-être corrompu ou protégé.');
      setLoading(false);
    }
  };

  const loadTextFile = async (textFile: File) => {
    try {
      setLoading(true);
      const text = await textFile.text();
      setDocumentContent(`<pre style="white-space: pre-wrap; font-family: inherit;">${text}</pre>`);
      setEditedContent(text);
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

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    const textContent = documentContent.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
    setEditedContent(textContent);
  };

  const handleSaveEdit = () => {
    setDocumentContent(`<pre style="white-space: pre-wrap; font-family: inherit;">${editedContent}</pre>`);
    setIsEditing(false);
  };

  const isEditable = fileType === 'document' || fileType === 'text';

  const handleAddImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newImageUrls = Array.from(files).map(file => URL.createObjectURL(file));
      setImages(prev => [...prev, ...newImageUrls]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index]);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 25));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
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

            {isEditable && !isEditing && (
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
              >
                <Edit2 className="w-4 h-4" />
                Éditer
              </button>
            )}

            {isEditing && (
              <>
                <button
                  onClick={handleSaveEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
                >
                  <Save className="w-4 h-4" />
                  Enregistrer
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition"
                >
                  <XCircle className="w-4 h-4" />
                  Annuler
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Image controls */}
            {fileType === 'image' && (
              <>
                <button
                  onClick={handleAddImage}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter
                </button>
                <button
                  onClick={handleZoomOut}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition"
                  disabled={zoom <= 25}
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <div className="bg-white px-4 py-2 rounded-lg border-2 border-gray-300">
                  <span className="text-sm font-semibold">{zoom}%</span>
                </div>
                <button
                  onClick={handleZoomIn}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition"
                  disabled={zoom >= 200}
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={handleRotate}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </>
            )}

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

      {/* Hidden file input for adding images */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageFileChange}
        className="hidden"
      />

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
          <div className="space-y-6">
            {images.map((imgUrl, index) => (
              <div key={index} className="relative bg-white p-4 rounded-lg shadow-lg">
                <button
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 transition z-10"
                  title="Supprimer cette image"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex justify-center items-center overflow-hidden">
                  <img
                    src={imgUrl}
                    alt={`Image ${index + 1}`}
                    className="shadow-2xl rounded-lg transition-all duration-300"
                    style={{
                      width: `${zoom}%`,
                      transform: `rotate(${rotation}deg)`,
                      maxWidth: '100%',
                      height: 'auto'
                    }}
                  />
                </div>
                {images.length > 1 && (
                  <div className="mt-2 text-center text-sm text-gray-600 font-semibold">
                    Image {index + 1} / {images.length}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : fileType === 'document' ? (
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
            {isEditing ? (
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full min-h-[500px] p-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
                placeholder="Contenu du document..."
              />
            ) : (
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: documentContent }}
              />
            )}
          </div>
        ) : fileType === 'text' ? (
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
            {isEditing ? (
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full min-h-[500px] p-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
                placeholder="Contenu du document..."
              />
            ) : (
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: documentContent }}
              />
            )}
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
