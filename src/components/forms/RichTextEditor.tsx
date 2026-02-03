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

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
        extractedContent = await createPDFVisualBlock(file);
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
      } else if (fileType === 'txt') {
        extractedContent = await file.text();
        const lines = extractedContent.split('\n').filter(line => line.trim());
        extractedContent = lines.map(line => `<p>${line}</p>`).join('');
        blockType = 'text';
      } else {
        extractedContent = await file.text();
        blockType = 'text';
      }

      const separator = value.trim() ? '<p><br></p><hr class="my-4 border-t-2 border-gray-200"><p><br></p>' : '';

      let header = '';
      if (blockType === 'pdf' || blockType === 'image') {
        header = '';
      } else if (blockType === 'docx') {
        header = `<div class="bg-green-50 border-l-4 border-green-500 p-3 mb-4 rounded"><p class="text-sm text-green-700 font-medium">📝 Texte extrait de : ${file.name}</p></div>`;
      } else {
        header = `<div class="bg-blue-50 border-l-4 border-blue-500 p-3 mb-4 rounded"><p class="text-sm text-blue-700 font-medium">📄 Contenu importé depuis : ${file.name}</p></div>`;
      }

      const newContent = value + separator + header + extractedContent;

      onChange(newContent);

      const successNotification = document.createElement('div');
      successNotification.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50 animate-fade-in';
      successNotification.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <span class="font-medium">✅ ${blockType === 'pdf' ? 'PDF' : blockType === 'docx' ? 'DOCX' : blockType === 'image' ? 'Image' : 'Fichier'} importé avec succès !</span>
      `;
      document.body.appendChild(successNotification);
      setTimeout(() => successNotification.remove(), 3000);

      console.log('[Import] Contenu inséré dans l\'éditeur:', {
        fileName: file.name,
        type: blockType,
        contentLength: extractedContent.length
      });
    } catch (error) {
      console.error('Error importing file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue lors de l\'import du fichier';

      const errorNotification = document.createElement('div');
      errorNotification.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl z-50 max-w-lg w-full p-6 border-2 border-red-200';
      errorNotification.innerHTML = `
        <div class="flex items-start gap-3 mb-4">
          <div class="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-bold text-red-600 mb-2">Erreur d'import</h3>
            <div class="text-sm text-gray-700 whitespace-pre-wrap">${errorMessage}</div>
          </div>
        </div>
        <button onclick="this.parentElement.remove()" class="w-full px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition">
          Fermer
        </button>
      `;
      document.body.appendChild(errorNotification);
      setTimeout(() => {
        if (errorNotification.parentElement) {
          errorNotification.remove();
        }
      }, 10000);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const createPDFVisualBlock = async (file: File): Promise<string> => {
    if (file.size === 0) {
      throw new Error('Le fichier PDF est vide');
    }

    if (file.size > 15 * 1024 * 1024) {
      throw new Error('Le fichier PDF est trop volumineux (max 15 MB)');
    }

    try {
      console.log('[PDF Block] Création du bloc visuel PDF...');

      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onload = () => {
          try {
            const base64 = reader.result as string;
            const blockId = `pdf-block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            const pdfBlock = `
              <div
                class="pdf-visual-block my-6 border-2 border-blue-300 rounded-xl overflow-hidden bg-white shadow-lg"
                data-block-type="pdf"
                data-block-id="${blockId}"
                data-file-name="${file.name}"
                data-file-size="${file.size}"
                data-file-type="${file.type}"
                style="max-width: 100%; position: relative;"
              >
                <div class="bg-gradient-to-r from-red-600 to-red-700 px-4 py-3 flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                    </svg>
                    <div>
                      <p class="text-white font-bold text-sm">${file.name}</p>
                      <p class="text-red-100 text-xs">${(file.size / 1024).toFixed(2)} KB • PDF</p>
                    </div>
                  </div>
                  <button
                    onclick="this.closest('.pdf-visual-block').remove()"
                    class="text-white hover:bg-red-800 p-2 rounded-lg transition"
                    title="Supprimer ce bloc PDF"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>

                <div class="p-4 bg-gray-50">
                  <div class="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <svg class="w-16 h-16 mx-auto text-red-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <p class="text-gray-700 font-semibold mb-2">Document PDF intégré</p>
                    <p class="text-sm text-gray-600 mb-4">
                      Ce fichier PDF est attaché à votre offre et sera visible par les candidats
                    </p>
                    <div class="flex gap-2 justify-center text-xs text-gray-500">
                      <span>📄 Bloc visuel</span>
                      <span>•</span>
                      <span>🔒 Sécurisé</span>
                      <span>•</span>
                      <span>♻️ Exploitable par IA</span>
                    </div>
                  </div>
                </div>

                <div class="bg-blue-50 px-4 py-2 border-t border-blue-200">
                  <p class="text-xs text-blue-700 flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Bloc manipulable : vous pouvez ajouter du texte avant et après ce PDF</span>
                  </p>
                </div>
              </div>
            `;

            console.log('[PDF Block] Bloc visuel créé avec succès');
            resolve(pdfBlock);
          } catch (error) {
            console.error('[PDF Block] Erreur création:', error);
            reject(new Error('Erreur lors de la création du bloc PDF'));
          }
        };

        reader.onerror = () => {
          console.error('[PDF Block] Erreur lecture fichier');
          reject(new Error('Erreur lors de la lecture du fichier PDF'));
        };

        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('[PDF Block] Erreur:', error);
      throw new Error(
        `❌ Impossible de créer le bloc PDF\n\n` +
        `Une erreur est survenue lors du traitement du fichier.\n\n` +
        `Solutions :\n` +
        `• Vérifiez que le fichier n'est pas corrompu\n` +
        `• Essayez avec un autre fichier PDF\n` +
        `• Réduisez la taille du fichier (max 15 MB)`
      );
    }
  };

  const extractPDFContent = async (file: File): Promise<string> => {
    if (file.size === 0) {
      throw new Error('Le fichier PDF est vide');
    }

    if (file.size > 15 * 1024 * 1024) {
      throw new Error('Le fichier PDF est trop volumineux (max 15 MB)');
    }

    try {
      console.log('[PDF] Lecture du fichier...');
      const arrayBuffer = await file.arrayBuffer();

      console.log('[PDF] Vérification du format...');
      const uint8Array = new Uint8Array(arrayBuffer);
      const header = String.fromCharCode(...uint8Array.slice(0, 5));

      if (!header.startsWith('%PDF-')) {
        throw new Error(
          `Ce fichier n'est pas un PDF valide.\n\n` +
          `Le fichier commence par "${header.substring(0, 10)}" au lieu de "%PDF-"\n\n` +
          `Solutions :\n` +
          `• Vérifiez que le fichier est bien un PDF\n` +
          `• Ouvrez-le dans Adobe Reader et réenregistrez-le\n` +
          `• Essayez un autre fichier PDF`
        );
      }

      console.log('[PDF] Chargement du document...');
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        verbosity: 0,
        isEvalSupported: false,
        disableFontFace: false,
        standardFontDataUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/standard_fonts/`,
      });

      const pdf = await loadingTask.promise;

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
            .map((item: any) => {
              if ('str' in item) {
                return item.str;
              }
              return '';
            })
            .filter((text: string) => text.trim().length > 0)
            .join(' ')
            .trim();

          if (pageText.length > 0) {
            const cleanText = pageText
              .replace(/\s+/g, ' ')
              .trim();
            fullText += `<div class="mb-4"><h3 class="font-bold text-lg text-blue-800 mb-2">📄 Page ${i}</h3><p class="text-gray-800 leading-relaxed">${cleanText}</p></div>\n`;
            hasContent = true;
          } else {
            fullText += `<div class="mb-2"><p class="text-gray-400 italic text-sm">Page ${i} : Aucun texte détecté</p></div>\n`;
          }
        } catch (pageError) {
          console.warn(`[PDF] Erreur page ${i}:`, pageError);
          fullText += `<div class="mb-2"><p class="text-red-500 italic text-sm">Page ${i} : Erreur d'extraction</p></div>\n`;
        }
      }

      if (!hasContent) {
        return `<div class="bg-yellow-50 border-2 border-yellow-300 p-4 rounded-lg">
          <p class="font-semibold text-yellow-800 mb-2">⚠️ PDF sans texte extractible</p>
          <p class="text-sm text-yellow-700 mb-1">Ce PDF semble être composé uniquement d'images ou de graphiques.</p>
          <p class="text-sm text-yellow-700 font-medium">Solutions :</p>
          <ul class="text-sm text-yellow-700 list-disc list-inside ml-2 mt-1">
            <li>Utilisez un logiciel OCR (reconnaissance optique de caractères)</li>
            <li>Copiez-collez manuellement le contenu depuis le PDF</li>
            <li>Réenregistrez le PDF avec du texte sélectionnable</li>
          </ul>
        </div>`;
      }

      console.log('[PDF] Extraction réussie!');
      return `<div class="bg-white border-2 border-blue-200 p-4 rounded-lg">${fullText}</div>`;
    } catch (error) {
      console.error('[PDF] Erreur complète:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);

      if (errorMsg.includes('password') || errorMsg.includes('encrypted') || errorMsg.includes('PasswordException')) {
        throw new Error(
          `🔒 PDF protégé par mot de passe\n\n` +
          `Ce fichier est verrouillé et ne peut pas être lu.\n\n` +
          `Solutions :\n` +
          `• Ouvrez-le dans Adobe Reader et déverrouillez-le\n` +
          `• Demandez le mot de passe au propriétaire\n` +
          `• Utilisez un outil de déverrouillage PDF en ligne`
        );
      }

      if (errorMsg.includes('Invalid PDF') || errorMsg.includes('PDF header')) {
        throw new Error(
          `❌ Fichier PDF invalide\n\n` +
          `Le fichier semble corrompu ou n'est pas un vrai PDF.\n\n` +
          `Solutions :\n` +
          `• Ouvrez le fichier dans Adobe Reader\n` +
          `• Vérifiez que le téléchargement est complet\n` +
          `• Essayez de l'ouvrir et le réenregistrer\n` +
          `• Utilisez un autre fichier PDF`
        );
      }

      if (errorMsg.includes('Worker')) {
        throw new Error(
          `⚙️ Erreur de traitement PDF\n\n` +
          `Le système n'arrive pas à charger le moteur PDF.\n\n` +
          `Solutions :\n` +
          `• Rechargez la page (Ctrl+R ou Cmd+R)\n` +
          `• Vérifiez votre connexion internet\n` +
          `• Essayez avec un autre navigateur\n` +
          `• Contactez l'assistance si le problème persiste`
        );
      }

      throw new Error(
        `❌ Impossible de lire ce PDF\n\n` +
        `Le fichier utilise peut-être un format non standard ou est corrompu.\n\n` +
        `Erreur technique : ${errorMsg}\n\n` +
        `Solutions :\n` +
        `• Ouvrez le PDF dans Adobe Reader et réenregistrez-le\n` +
        `• Convertissez-le en un nouveau PDF\n` +
        `• Copiez-collez le contenu manuellement\n` +
        `• Essayez un autre fichier PDF`
      );
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
        reject(new Error(
          `📏 Image trop volumineuse\n\n` +
          `Taille actuelle : ${(file.size / (1024 * 1024)).toFixed(2)} MB\n` +
          `Taille maximum : 5 MB\n\n` +
          `Solutions :\n` +
          `• Compressez l'image avec un outil en ligne (TinyPNG, Compressor.io)\n` +
          `• Réduisez les dimensions de l'image\n` +
          `• Utilisez un format plus léger (WebP ou JPG)`
        ));
        return;
      }

      const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (!validImageTypes.includes(file.type)) {
        reject(new Error(
          `❌ Format d'image non supporté\n\n` +
          `Format détecté : ${file.type}\n\n` +
          `Formats acceptés :\n` +
          `• JPG/JPEG\n` +
          `• PNG\n` +
          `• GIF\n` +
          `• WebP\n` +
          `• SVG\n\n` +
          `Solution : Convertissez votre image en l'un de ces formats`
        ));
        return;
      }

      console.log('[Image] Lecture du fichier image:', file.name);
      const reader = new FileReader();

      reader.onload = () => {
        try {
          const base64 = reader.result as string;
          if (!base64 || !base64.startsWith('data:image')) {
            reject(new Error('Erreur lors de la conversion de l\'image en base64'));
            return;
          }

          const imageHtml = `
            <div class="my-4 border-2 border-blue-200 rounded-lg overflow-hidden bg-white">
              <img
                src="${base64}"
                alt="${file.name}"
                class="w-full h-auto object-contain"
                style="max-width: 100%; height: auto; display: block;"
                title="${file.name}"
              />
              <div class="px-3 py-2 bg-gray-50 border-t border-gray-200">
                <p class="text-xs text-gray-600 font-medium truncate" title="${file.name}">
                  📷 ${file.name}
                </p>
              </div>
            </div>
          `;

          console.log('[Image] Image convertie avec succès');
          resolve(imageHtml);
        } catch (error) {
          console.error('[Image] Erreur conversion:', error);
          reject(new Error('Erreur lors du traitement de l\'image'));
        }
      };

      reader.onerror = (error) => {
        console.error('[Image] Erreur lecture:', error);
        reject(new Error(
          `❌ Erreur de lecture de l'image\n\n` +
          `Impossible de lire le fichier.\n\n` +
          `Solutions :\n` +
          `• Vérifiez que le fichier n'est pas corrompu\n` +
          `• Ouvrez l'image et réenregistrez-la\n` +
          `• Essayez avec une autre image`
        ));
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

      <div className="space-y-3">
        <div className="border-2 border-dashed border-blue-300 rounded-xl p-5 bg-gradient-to-br from-blue-50 to-gray-50 hover:border-blue-400 hover:bg-blue-100 transition-all">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,image/jpeg,image/jpg,image/png,image/gif,image/webp,.txt"
            onChange={handleFileImport}
            className="hidden"
            id="file-import-rich"
            disabled={isImporting}
          />
          <label
            htmlFor="file-import-rich"
            className="flex items-center justify-center gap-4 cursor-pointer"
          >
            {isImporting ? (
              <>
                <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600"></div>
                <div className="text-center">
                  <p className="text-sm font-bold text-blue-700">Import en cours...</p>
                  <p className="text-xs text-blue-600 mt-1">Veuillez patienter</p>
                </div>
              </>
            ) : (
              <>
                <div className="flex-shrink-0 p-2 bg-blue-600 rounded-lg">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-800 mb-1">
                    Cliquez pour importer un fichier
                  </p>
                  <p className="text-xs text-gray-600 mb-2">
                    📄 PDF • 📝 DOCX • 🖼️ Images (JPG, PNG, GIF, WebP) • 📋 TXT
                  </p>
                  <p className="text-xs text-blue-600 font-medium">
                    Max: 15 MB (PDF/DOCX) • 5 MB (Images)
                  </p>
                </div>
              </>
            )}
          </label>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1 text-xs text-gray-700">
              <p className="font-semibold text-green-800 mb-1">📋 Comportement intelligent par type de fichier :</p>
              <ul className="space-y-1 ml-1">
                <li className="flex items-start gap-1">
                  <span className="text-green-600 font-bold">•</span>
                  <span><strong className="text-green-700">Word/TXT</strong> → Le texte est extrait et devient éditable</span>
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-blue-600 font-bold">•</span>
                  <span><strong className="text-blue-700">PDF/Images</strong> → Affichés comme blocs visuels manipulables</span>
                </li>
              </ul>
              <p className="mt-2 text-purple-700 font-medium">
                ♻️ Tous les contenus sont exploitables par l'IA pour le matching et la génération automatique
              </p>
            </div>
          </div>
        </div>
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
