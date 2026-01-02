import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {
  Upload,
  Download,
  FileText,
  Image as ImageIcon,
  File,
  Save,
  Trash2,
  Eye,
  EyeOff,
  X,
  Undo2,
  Redo2,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

const RichTextEditor = memo(function RichTextEditor({
  value,
  onChange,
  placeholder = 'Décrivez le poste en détail...',
  label = 'Description du poste',
}: RichTextEditorProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const quillRef = useRef<ReactQuill>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isManipulatingRef = useRef<boolean>(false);

  const handleUndo = () => {
    const quill = quillRef.current?.getEditor();
    if (quill) {
      quill.history.undo();
    }
  };

  const handleRedo = () => {
    const quill = quillRef.current?.getEditor();
    if (quill) {
      quill.history.redo();
    }
  };

  const handleSaveContent = useCallback(() => {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-slide-up';
    notification.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
      <span>Contenu sauvegardé !</span>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }, []);


  useEffect(() => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;

    const handlePaste = (e: ClipboardEvent) => {
      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      const items = clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const blob = item.getAsFile();

          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const base64 = event.target?.result as string;
              const range = quill.getSelection(true);

              if (range) {
                quill.insertEmbed(range.index, 'image', base64);
                quill.setSelection(range.index + 1);
                setHasUnsavedChanges(true);
              }
            };
            reader.readAsDataURL(blob);
          }
          break;
        }
      }
    };

    const editorElement = quill.root;
    editorElement.addEventListener('paste', handlePaste);

    return () => {
      editorElement.removeEventListener('paste', handlePaste);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveContent();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const makeImagesManipulable = () => {
      const quill = quillRef.current?.getEditor();
      if (!quill) return;

      const editorElement = quill.root;
      const images = editorElement.querySelectorAll('img');

      images.forEach((img: HTMLImageElement) => {
        if (img.dataset.manipulable === 'true') return;

        img.dataset.manipulable = 'true';
        img.classList.add('manipulable-image');
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.draggable = false;

        let isResizing = false;
        let startX = 0;
        let startWidth = 0;

        const updateCursor = (e: MouseEvent) => {
          const rect = img.getBoundingClientRect();
          const isNearRightEdge = e.clientX > rect.right - 15;
          const isNearBottomEdge = e.clientY > rect.bottom - 15;

          if ((isNearRightEdge && isNearBottomEdge) || isNearRightEdge || isNearBottomEdge) {
            img.style.cursor = 'nwse-resize';
          } else {
            img.style.cursor = 'default';
          }
        };

        const onMouseDown = (e: MouseEvent) => {
          const rect = img.getBoundingClientRect();
          const isNearRightEdge = e.clientX > rect.right - 15;
          const isNearBottomEdge = e.clientY > rect.bottom - 15;

          if (isNearRightEdge || isNearBottomEdge) {
            e.preventDefault();
            e.stopPropagation();

            isManipulatingRef.current = true;
            isResizing = true;
            startX = e.clientX;
            startWidth = img.offsetWidth;

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
          }
        };

        const onMouseMove = (e: MouseEvent) => {
          if (!isResizing) return;

          e.preventDefault();
          const deltaX = e.clientX - startX;
          const newWidth = startWidth + deltaX;

          if (newWidth > 50 && newWidth <= editorElement.offsetWidth) {
            img.style.width = `${newWidth}px`;
            img.style.height = 'auto';
          }
        };

        const onMouseUp = () => {
          if (isResizing) {
            isResizing = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
          }
        };

        img.addEventListener('mousedown', onMouseDown);
        img.addEventListener('mousemove', updateCursor);
      });
    };

    makeImagesManipulable();

    const observer = new MutationObserver(() => {
      requestAnimationFrame(makeImagesManipulable);
    });

    const quill = quillRef.current?.getEditor();
    if (quill) {
      observer.observe(quill.root, {
        childList: true,
        subtree: true,
      });
    }

    return () => observer.disconnect();
  }, []);

  const modules = useMemo(() => ({
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ font: [] }],
      [{ size: ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ color: [] }, { background: [] }],
      [{ script: 'sub' }, { script: 'super' }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ direction: 'rtl' }],
      [{ align: [] }],
      ['blockquote', 'code-block'],
      ['link', 'image', 'video'],
      ['clean'],
    ],
    history: {
      delay: 1000,
      maxStack: 100,
      userOnly: true,
    },
  }), []);

  const formats = useMemo(() => [
    'header',
    'font',
    'size',
    'bold',
    'italic',
    'underline',
    'strike',
    'color',
    'background',
    'script',
    'list',
    'bullet',
    'indent',
    'direction',
    'align',
    'blockquote',
    'code-block',
    'link',
    'image',
    'video',
  ], []);

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    try {
      const fileType = file.name.split('.').pop()?.toLowerCase();
      let extractedContent = '';
      let blockType: 'pdf' | 'docx' | 'image' | 'text' = 'text';

      if (fileType === 'pdf') {
        extractedContent = await extractPDFContent(file);
        blockType = 'pdf';
      } else if (fileType === 'docx') {
        extractedContent = await extractDOCXContent(file);
        blockType = 'docx';
      } else if (fileType === 'doc') {
        throw new Error(
          `Format .doc non supporté\n\n` +
          `Les anciens fichiers Word (.doc) ne peuvent pas être importés.\n\n` +
          `Solutions :\n\n` +
          `1. 💾 Ouvrez le fichier dans Microsoft Word\n` +
          `2. 📄 Menu "Fichier" → "Enregistrer sous"\n` +
          `3. ✅ Choisissez le format "Document Word (.docx)"\n` +
          `4. 🔄 Réessayez l'import\n\n` +
          `Alternatives :\n` +
          `• 📋 Copiez-collez directement le contenu\n` +
          `• 📑 Exportez en PDF depuis Word`
        );
      } else if (file.type.startsWith('image/')) {
        extractedContent = await extractImageAsBase64(file);
        blockType = 'image';
      } else {
        extractedContent = await file.text();
        blockType = 'text';
      }

      const separator = value.trim() ? '<p><br></p><hr><p><br></p>' : '';
      const header = `<div class="bg-blue-50 border-l-4 border-blue-500 p-3 mb-4"><p class="text-sm text-blue-700"><strong>📄 Importé depuis :</strong> ${file.name}</p></div>`;
      const newContent = value + separator + header + extractedContent;

      onChange(newContent);

      console.log('[Import] Contenu inséré dans l\'éditeur:', {
        fileName: file.name,
        type: blockType,
        contentLength: extractedContent.length
      });
    } catch (error) {
      console.error('Error importing file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';

      const formattedError = `❌ Erreur d'import\n\n${errorMessage}`;
      alert(formattedError);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const extractPDFContent = async (file: File): Promise<string> => {
    if (file.size === 0) {
      throw new Error('Le fichier PDF est vide');
    }

    if (file.size > 15 * 1024 * 1024) {
      throw new Error('Le fichier PDF est trop volumineux (max 15 MB)');
    }

    const arrayBuffer = await file.arrayBuffer();

    try {
      console.log('[PDF] Tentative chargement du document...');
      const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
        verbosity: 0
      }).promise;

      if (pdf.numPages === 0) {
        throw new Error('Le PDF ne contient aucune page');
      }

      console.log(`[PDF] Document chargé avec ${pdf.numPages} page(s)`);
      let fullText = '';
      let hasContent = false;

      for (let i = 1; i <= pdf.numPages; i++) {
        try {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str || '')
            .join(' ')
            .trim();

          if (pageText.length > 0) {
            fullText += `<h3 class="font-bold text-lg mt-4 mb-2">Page ${i}</h3><p>${pageText}</p>\n\n`;
            hasContent = true;
          }
        } catch (pageError) {
          console.warn(`[PDF] Erreur page ${i}:`, pageError);
          fullText += `<p class="text-gray-400 italic">Page ${i} : Impossible d'extraire le contenu</p>\n`;
        }
      }

      if (!hasContent) {
        return `<div class="bg-yellow-50 border border-yellow-300 p-4 rounded">
          <p class="font-semibold text-yellow-800">⚠️ PDF sans texte extractible</p>
          <p class="text-sm text-yellow-700 mt-2">Ce PDF semble être composé uniquement d'images.</p>
          <p class="text-sm text-yellow-700 mt-1">Pour extraire le texte, utilisez un logiciel OCR ou copiez-collez manuellement le contenu.</p>
        </div>`;
      }

      console.log('[PDF] Extraction réussie!');
      return fullText;
    } catch (error) {
      console.error('[PDF] Erreur extraction:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);

      if (errorMsg.includes('password') || errorMsg.includes('encrypted')) {
        throw new Error('Ce PDF est protégé par un mot de passe. Déverrouillez-le d\'abord avec Adobe Reader ou un autre logiciel PDF.');
      }

      if (errorMsg.includes('Invalid PDF')) {
        throw new Error('Fichier PDF invalide ou corrompu. Essayez de l\'ouvrir et de le réenregistrer avec Adobe Reader.');
      }

      throw new Error('Impossible de lire ce PDF. Le fichier est peut-être corrompu ou utilise un format non standard.');
    }
  };

  const extractDOCXContent = async (file: File): Promise<string> => {
    if (file.size === 0) {
      throw new Error('Le fichier est vide');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new Error('Le fichier est trop volumineux (max 10 MB)');
    }

    const arrayBuffer = await file.arrayBuffer();

    try {
      console.log('[DOCX] Tentative extraction HTML avec Mammoth...');
      const result = await mammoth.convertToHtml({ arrayBuffer });

      if (result.value && result.value.trim().length > 0) {
        console.log('[DOCX] Extraction réussie!');
        if (result.messages && result.messages.length > 0) {
          console.warn('[DOCX] Avertissements:', result.messages);
        }
        return result.value;
      }

      console.warn('[DOCX] Aucun contenu HTML, essai extraction texte...');
    } catch (mammothHtmlError) {
      console.warn('[DOCX] Échec HTML, essai texte brut:', mammothHtmlError);
    }

    try {
      console.log('[DOCX] Tentative extraction texte brut avec Mammoth...');
      const textResult = await mammoth.extractRawText({ arrayBuffer });

      if (textResult.value && textResult.value.trim().length > 0) {
        console.log('[DOCX] Extraction texte réussie!');
        const lines = textResult.value.split('\n').filter(line => line.trim());
        const html = lines.map(line => `<p>${line}</p>`).join('');
        return `<div>${html}<p class="text-xs text-gray-500 mt-4 italic">⚠️ Formatage simplifié (titres, couleurs et styles non préservés)</p></div>`;
      }
    } catch (mammothTextError) {
      console.warn('[DOCX] Échec extraction texte:', mammothTextError);
    }

    try {
      console.log('[DOCX] Tentative lecture directe du contenu...');
      const decoder = new TextDecoder('utf-8', { fatal: false });
      const text = decoder.decode(arrayBuffer);

      const cleanText = text
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
        .replace(/[^\x20-\x7E\u00A0-\uFFFF\n\r]/g, ' ')
        .split(/[\r\n]+/)
        .filter(line => line.trim().length > 0)
        .join('\n')
        .trim();

      if (cleanText.length > 50) {
        console.log('[DOCX] Extraction en mode dégradé réussie');
        const preview = cleanText.substring(0, 5000);
        const lines = preview.split('\n');
        const html = lines.map(line => `<p>${line}</p>`).join('');
        return `<div>${html}<p class="text-xs text-orange-600 mt-4 font-semibold">⚠️ Contenu extrait en mode dégradé. Formatage non préservé.</p></div>`;
      }
    } catch (fallbackError) {
      console.error('[DOCX] Échec extraction fallback:', fallbackError);
    }

    throw new Error(
      `Impossible de lire ce document Word.\n\n` +
      `Solutions recommandées :\n\n` +
      `1. 💾 Ouvrez le fichier dans Microsoft Word ou LibreOffice\n` +
      `2. 📄 Menu "Fichier" → "Enregistrer sous"\n` +
      `3. ✅ Format : "Document Word (.docx)"\n` +
      `4. 🔄 Réessayez l'import\n\n` +
      `Autres options :\n` +
      `• 📋 Copiez-collez le contenu directement\n` +
      `• 📑 Exportez en PDF et importez le PDF`
    );
  };

  const extractImageAsBase64 = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.size === 0) {
        reject(new Error('Le fichier image est vide'));
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        reject(new Error('L\'image est trop volumineuse (max 5 MB)'));
        return;
      }

      const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validImageTypes.includes(file.type)) {
        reject(new Error(`Format d'image non supporté: ${file.type}. Utilisez JPG, PNG, GIF ou WebP`));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(`<img src="${base64}" alt="${file.name}" style="max-width: 100%; height: auto;" />`);
      };
      reader.onerror = () => {
        reject(new Error('Erreur lors de la lecture de l\'image'));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleEditorChange = useCallback((content: string) => {
    onChange(content);
  }, [onChange]);

  const handleResetContent = () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser tout le contenu ? Cette action est irréversible.')) {
      onChange('');

      const quill = quillRef.current?.getEditor();
      if (quill) {
        quill.history.clear();
      }

      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-slide-up';
      notification.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
        <span>Contenu réinitialisé</span>
      `;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    }
  };

  const handleClearSelection = () => {
    const quill = quillRef.current?.getEditor();
    if (quill) {
      const selection = quill.getSelection();
      if (selection && selection.length > 0) {
        quill.deleteText(selection.index, selection.length);
      } else {
        alert('Veuillez sélectionner du texte à supprimer');
      }
    }
  };

  const handleDownloadAsPDF = async () => {
    const doc = new jsPDF();
    const content = value.replace(/<[^>]*>/g, '');
    const lines = doc.splitTextToSize(content, 180);

    doc.setFontSize(12);
    doc.text(lines, 15, 15);
    doc.save('description-poste.pdf');
  };

  const handleDownloadAsDOCX = async () => {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
          <head>
            <meta charset='utf-8'>
            <title>Description du poste</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; }
              h1, h2, h3, h4, h5, h6 { color: #0E2F56; margin-top: 1em; margin-bottom: 0.5em; }
              p { margin-bottom: 0.75em; }
              ul, ol { margin-left: 1.5em; }
              img { max-width: 100%; height: auto; }
            </style>
          </head>
          <body>
            ${value}
          </body>
        </html>
      `;

      const blob = new Blob(['\ufeff', htmlContent], {
        type: 'application/msword'
      });

      saveAs(blob, 'description-poste.doc');
    } catch (error) {
      console.error('Error generating DOCX:', error);
      alert('Erreur lors de la génération du fichier Word');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-gray-700">
          {label}
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUndo}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            title="Annuler (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            title="Rétablir (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-gray-300"></div>
          <button
            type="button"
            onClick={handleClearSelection}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
            title="Supprimer la sélection"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleResetContent}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
            title="Réinitialiser tout"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-gray-300"></div>
          <button
            type="button"
            onClick={handleSaveContent}
            className="px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition flex items-center gap-2"
            title="Enregistrer les modifications"
          >
            <Save className="w-4 h-4" />
            Enregistrer
          </button>
          <button
            type="button"
            onClick={handleDownloadAsPDF}
            className="px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition flex items-center gap-2"
            title="Télécharger en PDF"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
          <button
            type="button"
            onClick={handleDownloadAsDOCX}
            className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2"
            title="Télécharger en DOCX"
          >
            <Download className="w-4 h-4" />
            DOC
          </button>
        </div>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 hover:bg-gray-100 transition">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,image/*,.txt"
          onChange={handleFileImport}
          className="hidden"
          id="file-import-rich"
        />
        <label
          htmlFor="file-import-rich"
          className="flex items-center justify-center gap-3 cursor-pointer"
        >
          <Upload className="w-6 h-6 text-blue-600" />
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700">
              {isImporting ? 'Import en cours...' : 'Importer depuis PDF/DOCX/Image'}
            </p>
            <p className="text-xs text-gray-500">
              Formats acceptés: PDF, DOCX (pas .doc), JPG, PNG, TXT
            </p>
          </div>
        </label>
      </div>

      <div className="border-2 border-gray-300 rounded-xl overflow-hidden" style={{ contain: 'layout' }}>
        <ReactQuill
          key="main-editor"
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={handleEditorChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          className="bg-white"
          style={{ minHeight: '300px' }}
          preserveWhitespace
        />
      </div>
    </div>
  );
});

export default RichTextEditor;
