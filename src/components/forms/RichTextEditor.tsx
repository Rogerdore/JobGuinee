import { useState, useRef, useEffect } from 'react';
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

interface ImportedBlock {
  id: string;
  type: 'pdf' | 'docx' | 'image' | 'text';
  content: string;
  fileName: string;
  timestamp: number;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Décrivez le poste en détail...',
  label = 'Description du poste',
}: RichTextEditorProps) {
  const [importedBlocks, setImportedBlocks] = useState<ImportedBlock[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [showBlocks, setShowBlocks] = useState(true);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState(value);
  const quillRef = useRef<ReactQuill>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setEditorContent(value);
  }, []);

  const combineAllContent = () => {
    const blocksContent = importedBlocks.map((block) => block.content).join('\n\n');
    const combined = blocksContent ? `${blocksContent}\n\n${editorContent}` : editorContent;
    onChange(combined);
  };

  const modules = {
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
  };

  const formats = [
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
  ];

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
      } else if (fileType === 'docx' || fileType === 'doc') {
        extractedContent = await extractDOCXContent(file);
        blockType = 'docx';
      } else if (file.type.startsWith('image/')) {
        extractedContent = await extractImageAsBase64(file);
        blockType = 'image';
      } else {
        extractedContent = await file.text();
        blockType = 'text';
      }

      const newBlock: ImportedBlock = {
        id: Date.now().toString(),
        type: blockType,
        content: extractedContent,
        fileName: file.name,
        timestamp: Date.now(),
      };

      setImportedBlocks((prev) => [...prev, newBlock]);

      setTimeout(() => {
        const allBlocks = [...importedBlocks, newBlock];
        const blocksContent = allBlocks.map((block) => block.content).join('\n\n');
        const combined = blocksContent ? `${blocksContent}\n\n${editorContent}` : editorContent;
        onChange(combined);
      }, 200);
    } catch (error) {
      console.error('Error importing file:', error);
      alert('Erreur lors de l\'import du fichier. Veuillez réessayer.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const extractPDFContent = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += `<h3>Page ${i}</h3><p>${pageText}</p>\n\n`;
    }

    return fullText;
  };

  const extractDOCXContent = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    return result.value;
  };

  const extractImageAsBase64 = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(`<img src="${base64}" alt="${file.name}" style="max-width: 100%; height: auto;" />`);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleBlockEdit = (blockId: string, newContent: string) => {
    setImportedBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId ? { ...block, content: newContent } : block
      )
    );
  };

  const handleDeleteBlock = (blockId: string) => {
    setImportedBlocks((prev) => prev.filter((block) => block.id !== blockId));
    setTimeout(combineAllContent, 100);
  };

  const handleSaveBlock = (blockId: string) => {
    setEditingBlockId(null);
    setTimeout(combineAllContent, 100);
  };

  const handleEditorChange = (content: string) => {
    setEditorContent(content);

    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      const blocksContent = importedBlocks.map((block) => block.content).join('\n\n');
      const combined = blocksContent ? `${blocksContent}\n\n${content}` : content;
      onChange(combined);
    }, 300);
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

  const getBlockIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-600" />;
      case 'docx':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'image':
        return <ImageIcon className="w-5 h-5 text-green-600" />;
      default:
        return <File className="w-5 h-5 text-gray-600" />;
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
            onClick={() => setShowBlocks(!showBlocks)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            title={showBlocks ? 'Masquer les blocs' : 'Afficher les blocs'}
          >
            {showBlocks ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
          accept=".pdf,.docx,.doc,image/*,.txt"
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
              Cliquez pour sélectionner un fichier
            </p>
          </div>
        </label>
      </div>

      {showBlocks && importedBlocks.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <File className="w-4 h-4" />
            Blocs importés ({importedBlocks.length})
          </h4>
          {importedBlocks.map((block) => (
            <div
              key={block.id}
              className="bg-white border-2 border-gray-200 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getBlockIcon(block.type)}
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {block.fileName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(block.timestamp).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {editingBlockId === block.id ? (
                    <button
                      type="button"
                      onClick={() => handleSaveBlock(block.id)}
                      className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                      title="Enregistrer"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingBlockId(block.id)}
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                      title="Modifier"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteBlock(block.id)}
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {editingBlockId === block.id ? (
                <div className="mt-3">
                  <ReactQuill
                    theme="snow"
                    value={block.content}
                    onChange={(content) => handleBlockEdit(block.id, content)}
                    modules={modules}
                    formats={formats}
                    placeholder="Modifiez le contenu..."
                    className="bg-white"
                  />
                </div>
              ) : (
                <div
                  className="prose prose-sm max-w-none bg-gray-50 p-3 rounded-lg border border-gray-200 overflow-auto max-h-60"
                  dangerouslySetInnerHTML={{ __html: block.content }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="border-2 border-gray-300 rounded-xl overflow-hidden">
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={editorContent}
          onChange={handleEditorChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          className="bg-white"
          style={{ minHeight: '300px' }}
        />
      </div>

      <p className="text-xs text-gray-500 flex items-center gap-1">
        <FileText className="w-3 h-3" />
        Utilisez la barre d'outils pour formater le texte. Les blocs importés peuvent être modifiés individuellement.
      </p>
    </div>
  );
}
