import { useState, useRef, useEffect } from 'react';
import {
  Bold, Italic, Underline, Type, AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Upload, Image as ImageIcon, FileText, X, Trash2,
  Move, Maximize2
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface AttachedFile {
  id: string;
  type: 'image' | 'pdf';
  url: string;
  name: string;
  content?: string;
}

interface ImageSettings {
  width: number;
  height: number;
  align: 'left' | 'center' | 'right';
  float: 'none' | 'left' | 'right';
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [imageSettings, setImageSettings] = useState<ImageSettings>({
    width: 100,
    height: 100,
    align: 'left',
    float: 'none',
    marginTop: 10,
    marginBottom: 10,
    marginLeft: 0,
    marginRight: 0
  });
  const [showImageToolbar, setShowImageToolbar] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName !== 'IMG' && !target.closest('.image-toolbar')) {
        setSelectedImage(null);
        setShowImageToolbar(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const execCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateContent();
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    execCommand('fontSize', e.target.value);
  };

  const updateContent = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const filesHtml = attachedFiles.map(file => {
        if (file.type === 'pdf') {
          return `<div class="attached-pdf" style="background: #f3f4f6; padding: 16px; margin: 10px 0; border-radius: 8px; border: 2px solid #e5e7eb;">${file.content || ''}</div>`;
        }
        return '';
      }).join('');
      onChange(html + filesHtml);
    }
  };

  const handleImageClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
      e.preventDefault();
      e.stopPropagation();
      const img = target as HTMLImageElement;
      setSelectedImage(img);
      setShowImageToolbar(true);

      const computedStyle = window.getComputedStyle(img);
      const currentSettings: ImageSettings = {
        width: img.offsetWidth,
        height: img.offsetHeight,
        align: (img.style.display === 'block' && img.style.marginLeft === 'auto' && img.style.marginRight === 'auto') ? 'center' :
               (img.style.display === 'block' && img.style.marginLeft === 'auto') ? 'right' : 'left',
        float: (img.style.float || 'none') as 'none' | 'left' | 'right',
        marginTop: parseInt(img.style.marginTop || '10') || 10,
        marginBottom: parseInt(img.style.marginBottom || '10') || 10,
        marginLeft: parseInt(img.style.marginLeft || '0') || 0,
        marginRight: parseInt(img.style.marginRight || '0') || 0
      };
      setImageSettings(currentSettings);
    }
  };

  const applyImageSettings = () => {
    if (!selectedImage) return;

    selectedImage.style.width = `${imageSettings.width}px`;
    selectedImage.style.height = 'auto';
    selectedImage.style.marginTop = `${imageSettings.marginTop}px`;
    selectedImage.style.marginBottom = `${imageSettings.marginBottom}px`;
    selectedImage.style.marginLeft = `${imageSettings.marginLeft}px`;
    selectedImage.style.marginRight = `${imageSettings.marginRight}px`;
    selectedImage.style.borderRadius = '8px';
    selectedImage.style.maxWidth = '100%';

    if (imageSettings.float !== 'none') {
      selectedImage.style.float = imageSettings.float;
      selectedImage.style.display = 'inline';
    } else {
      selectedImage.style.float = 'none';
      if (imageSettings.align === 'center') {
        selectedImage.style.display = 'block';
        selectedImage.style.marginLeft = 'auto';
        selectedImage.style.marginRight = 'auto';
      } else if (imageSettings.align === 'right') {
        selectedImage.style.display = 'block';
        selectedImage.style.marginLeft = 'auto';
        selectedImage.style.marginRight = '0';
      } else {
        selectedImage.style.display = 'block';
        selectedImage.style.marginLeft = '0';
        selectedImage.style.marginRight = 'auto';
      }
    }

    updateContent();
  };

  const deleteSelectedImage = () => {
    if (selectedImage) {
      selectedImage.remove();
      setSelectedImage(null);
      setShowImageToolbar(false);
      updateContent();
    }
  };

  const insertImageToEditor = (imageUrl: string, imageName: string) => {
    if (editorRef.current) {
      const img = document.createElement('img');
      img.src = imageUrl;
      img.alt = imageName;
      img.style.width = '400px';
      img.style.height = 'auto';
      img.style.maxWidth = '100%';
      img.style.margin = '10px 0';
      img.style.borderRadius = '8px';
      img.style.cursor = 'pointer';
      img.style.display = 'block';
      img.className = 'editor-image';

      editorRef.current.appendChild(img);
      updateContent();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);

    for (const file of Array.from(files)) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const fileUrl = URL.createObjectURL(file);

      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension || '')) {
        const newFile: AttachedFile = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'image',
          url: fileUrl,
          name: file.name
        };
        setAttachedFiles(prev => [...prev, newFile]);
        insertImageToEditor(fileUrl, file.name);
      } else if (fileExtension === 'pdf') {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;

          let pdfContent = `<h4 style="color: #0E2F56; margin-bottom: 8px;">📄 ${file.name}</h4>`;

          const numPages = Math.min(pdf.numPages, 3);
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

              const pageDataUrl = canvas.toDataURL();
              pdfContent += `<div style="margin: 8px 0;"><img src="${pageDataUrl}" style="max-width: 100%; height: auto; border: 1px solid #e5e7eb; border-radius: 4px;" /></div>`;
            }
          }

          if (pdf.numPages > 3) {
            pdfContent += `<p style="color: #6b7280; font-size: 14px; margin-top: 8px;">... et ${pdf.numPages - 3} page(s) supplémentaire(s)</p>`;
          }

          const newFile: AttachedFile = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'pdf',
            url: fileUrl,
            name: file.name,
            content: pdfContent
          };
          setAttachedFiles(prev => [...prev, newFile]);
        } catch (error) {
          console.error('Error loading PDF:', error);
          alert('Erreur lors du chargement du PDF');
        }
      } else if (['doc', 'docx'].includes(fileExtension || '')) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.convertToHtml({ arrayBuffer });

          if (result.value && result.value.trim()) {
            const wordContent = `<div style="background: white; padding: 16px; border: 2px solid #e5e7eb; border-radius: 8px; margin: 10px 0;">${result.value}</div>`;
            const newFile: AttachedFile = {
              id: Math.random().toString(36).substr(2, 9),
              type: 'pdf',
              url: fileUrl,
              name: file.name,
              content: wordContent
            };
            setAttachedFiles(prev => [...prev, newFile]);
          }
        } catch (error) {
          console.error('Error loading Word document:', error);
          alert('Erreur lors du chargement du document Word');
        }
      }
    }

    setLoading(false);
    setTimeout(updateContent, 100);
    e.target.value = '';
  };

  const handleRemoveFile = (fileId: string) => {
    setAttachedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.url);
      }
      return prev.filter(f => f.id !== fileId);
    });
    setTimeout(updateContent, 100);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;

    for (const item of Array.from(items)) {
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const fileUrl = URL.createObjectURL(file);
          const newFile: AttachedFile = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'image',
            url: fileUrl,
            name: `pasted-image-${Date.now()}.png`
          };
          setAttachedFiles(prev => [...prev, newFile]);
          insertImageToEditor(fileUrl, newFile.name);
        }
        return;
      }
    }

    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    updateContent();
  };

  return (
    <div className="border-2 border-gray-300 rounded-xl overflow-hidden focus-within:border-[#0E2F56] transition relative">
      {/* Toolbar */}
      <div className="bg-gray-100 border-b-2 border-gray-300 p-3 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 border-r pr-2">
          <button
            type="button"
            onClick={() => execCommand('bold')}
            className="p-2 hover:bg-gray-200 rounded transition"
            title="Gras (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('italic')}
            className="p-2 hover:bg-gray-200 rounded transition"
            title="Italique (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('underline')}
            className="p-2 hover:bg-gray-200 rounded transition"
            title="Souligné (Ctrl+U)"
          >
            <Underline className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 border-r pr-2">
          <Type className="w-4 h-4 text-gray-600" />
          <select
            onChange={handleFontSizeChange}
            className="px-2 py-1 border border-gray-300 rounded text-sm bg-white"
            defaultValue="3"
          >
            <option value="1">Très petit</option>
            <option value="2">Petit</option>
            <option value="3">Normal</option>
            <option value="4">Grand</option>
            <option value="5">Très grand</option>
            <option value="6">Énorme</option>
            <option value="7">Géant</option>
          </select>
        </div>

        <div className="flex items-center gap-1 border-r pr-2">
          <button
            type="button"
            onClick={() => execCommand('justifyLeft')}
            className="p-2 hover:bg-gray-200 rounded transition"
            title="Aligner à gauche"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('justifyCenter')}
            className="p-2 hover:bg-gray-200 rounded transition"
            title="Centrer"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('justifyRight')}
            className="p-2 hover:bg-gray-200 rounded transition"
            title="Aligner à droite"
          >
            <AlignRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1 border-r pr-2">
          <button
            type="button"
            onClick={() => execCommand('insertUnorderedList')}
            className="p-2 hover:bg-gray-200 rounded transition"
            title="Liste à puces"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('insertOrderedList')}
            className="p-2 hover:bg-gray-200 rounded transition"
            title="Liste numérotée"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 border-r pr-2">
          <label className="text-xs text-gray-600 font-medium">Couleur:</label>
          <input
            type="color"
            onChange={(e) => execCommand('foreColor', e.target.value)}
            className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
            title="Couleur du texte"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50"
            title="Importer des fichiers"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Chargement...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Importer PDF/Images</span>
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Image Toolbar */}
      {showImageToolbar && selectedImage && (
        <div className="image-toolbar bg-gradient-to-r from-purple-100 to-blue-100 border-b-2 border-purple-300 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-purple-900 flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Paramètres de l'image
            </h4>
            <button
              type="button"
              onClick={deleteSelectedImage}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Maximize2 className="w-4 h-4 inline mr-1" />
                Largeur (px)
              </label>
              <input
                type="range"
                min="100"
                max="800"
                value={imageSettings.width}
                onChange={(e) => setImageSettings({ ...imageSettings, width: parseInt(e.target.value) })}
                onMouseUp={applyImageSettings}
                className="w-full"
              />
              <div className="text-center text-sm text-gray-600 mt-1">{imageSettings.width}px</div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Move className="w-4 h-4 inline mr-1" />
                Alignement
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setImageSettings({ ...imageSettings, align: 'left', float: 'none' });
                    setTimeout(applyImageSettings, 50);
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg font-semibold transition ${
                    imageSettings.align === 'left' && imageSettings.float === 'none'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <AlignLeft className="w-4 h-4 mx-auto" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setImageSettings({ ...imageSettings, align: 'center', float: 'none' });
                    setTimeout(applyImageSettings, 50);
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg font-semibold transition ${
                    imageSettings.align === 'center' && imageSettings.float === 'none'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <AlignCenter className="w-4 h-4 mx-auto" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setImageSettings({ ...imageSettings, align: 'right', float: 'none' });
                    setTimeout(applyImageSettings, 50);
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg font-semibold transition ${
                    imageSettings.align === 'right' && imageSettings.float === 'none'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <AlignRight className="w-4 h-4 mx-auto" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Habillage du texte
              </label>
              <select
                value={imageSettings.float}
                onChange={(e) => {
                  setImageSettings({ ...imageSettings, float: e.target.value as 'none' | 'left' | 'right' });
                  setTimeout(applyImageSettings, 50);
                }}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="none">Aucun</option>
                <option value="left">Gauche (texte à droite)</option>
                <option value="right">Droite (texte à gauche)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Marge haut</label>
              <input
                type="number"
                min="0"
                max="100"
                value={imageSettings.marginTop}
                onChange={(e) => setImageSettings({ ...imageSettings, marginTop: parseInt(e.target.value) || 0 })}
                onBlur={applyImageSettings}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Marge bas</label>
              <input
                type="number"
                min="0"
                max="100"
                value={imageSettings.marginBottom}
                onChange={(e) => setImageSettings({ ...imageSettings, marginBottom: parseInt(e.target.value) || 0 })}
                onBlur={applyImageSettings}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Marge gauche</label>
              <input
                type="number"
                min="0"
                max="100"
                value={imageSettings.marginLeft}
                onChange={(e) => setImageSettings({ ...imageSettings, marginLeft: parseInt(e.target.value) || 0 })}
                onBlur={applyImageSettings}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Marge droite</label>
              <input
                type="number"
                min="0"
                max="100"
                value={imageSettings.marginRight}
                onChange={(e) => setImageSettings({ ...imageSettings, marginRight: parseInt(e.target.value) || 0 })}
                onBlur={applyImageSettings}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Attached Files Preview */}
      {attachedFiles.length > 0 && (
        <div className="bg-blue-50 border-b-2 border-blue-200 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-blue-900">Fichiers attachés ({attachedFiles.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {attachedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-blue-300 rounded-lg"
              >
                {file.type === 'image' ? (
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                ) : (
                  <FileText className="w-4 h-4 text-red-600" />
                )}
                <span className="text-sm text-gray-700 max-w-[150px] truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(file.id)}
                  className="p-1 hover:bg-red-100 rounded transition"
                  title="Supprimer"
                >
                  <X className="w-3.5 h-3.5 text-red-600" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Editor Content */}
      <div
        ref={editorRef}
        contentEditable
        onInput={updateContent}
        onPaste={handlePaste}
        onClick={handleImageClick}
        dangerouslySetInnerHTML={{ __html: value }}
        className="w-full min-h-[400px] max-h-[600px] overflow-y-auto p-4 focus:outline-none prose prose-sm max-w-none"
        style={{
          minHeight: '400px',
          maxHeight: '600px'
        }}
      />

      {/* Placeholder */}
      {!value && !editorRef.current?.textContent && (
        <div className="absolute top-[120px] left-8 text-gray-400 pointer-events-none">
          {placeholder || 'Commencez à rédiger la description de l\'offre...'}
        </div>
      )}

      {/* Help Text */}
      <div className="bg-gray-50 border-t-2 border-gray-300 px-4 py-2 text-xs text-gray-600">
        <span className="font-semibold">💡 Astuce:</span> Vous pouvez coller du texte ou des images, importer des PDF/Word/Images. Cliquez sur une image pour la redimensionner et la positionner.
      </div>
    </div>
  );
}
