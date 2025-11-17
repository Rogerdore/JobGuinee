import { useState, useRef } from 'react';
import {
  Bold, Italic, Underline, Type, AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Upload, Image as ImageIcon, FileText, X, Trash2
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

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [loading, setLoading] = useState(false);

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
        if (file.type === 'image') {
          return `<div class="attached-image"><img src="${file.url}" alt="${file.name}" style="max-width: 100%; height: auto; margin: 10px 0; border-radius: 8px;" /></div>`;
        } else {
          return `<div class="attached-pdf" style="background: #f3f4f6; padding: 16px; margin: 10px 0; border-radius: 8px; border: 2px solid #e5e7eb;">${file.content || ''}</div>`;
        }
      }).join('');
      onChange(html + filesHtml);
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
        // Handle images
        const newFile: AttachedFile = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'image',
          url: fileUrl,
          name: file.name
        };
        setAttachedFiles(prev => [...prev, newFile]);
      } else if (fileExtension === 'pdf') {
        // Handle PDF
        try {
          const arrayBuffer = await file.arrayBuffer();
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;

          let pdfContent = `<h4 style="color: #0E2F56; margin-bottom: 8px;">📄 ${file.name}</h4>`;

          // Render first 3 pages as images
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
        // Handle Word documents
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
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    updateContent();
  };

  return (
    <div className="border-2 border-gray-300 rounded-xl overflow-hidden focus-within:border-[#0E2F56] transition">
      {/* Toolbar */}
      <div className="bg-gray-100 border-b-2 border-gray-300 p-3 flex flex-wrap items-center gap-2">
        {/* Text Formatting */}
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

        {/* Font Size */}
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

        {/* Alignment */}
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

        {/* Lists */}
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

        {/* Text Color */}
        <div className="flex items-center gap-2 border-r pr-2">
          <label className="text-xs text-gray-600 font-medium">Couleur:</label>
          <input
            type="color"
            onChange={(e) => execCommand('foreColor', e.target.value)}
            className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
            title="Couleur du texte"
          />
        </div>

        {/* File Upload */}
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
        <span className="font-semibold">💡 Astuce:</span> Vous pouvez coller du texte, importer des PDF/Word/Images, et les éditer directement dans ce champ.
      </div>
    </div>
  );
}
