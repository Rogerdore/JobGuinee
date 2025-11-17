import { useState, useRef, useEffect } from 'react';
import {
  Bold, Italic, Underline, Type, AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Upload, Image as ImageIcon, FileText, X, Trash2,
  Move, Maximize2, Eraser, Save, Download, Sparkles
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
  onGenerateWithAI?: () => void;
  isGeneratingAI?: boolean;
  isPremium?: boolean;
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

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  onGenerateWithAI,
  isGeneratingAI = false,
  isPremium = false
}: RichTextEditorProps) {
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
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<'se' | 'sw' | 'ne' | 'nw' | 'e' | 'w' | 's' | 'n' | null>(null);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName !== 'IMG' && !target.closest('.image-toolbar') && !target.closest('.resize-handle')) {
        setSelectedImage(null);
        setShowImageToolbar(false);
        removeResizeHandles();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isResizing || !selectedImage || !resizeStart || !resizeHandle) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;

      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;

      switch (resizeHandle) {
        case 'se':
          newWidth = Math.max(50, resizeStart.width + deltaX);
          break;
        case 'sw':
          newWidth = Math.max(50, resizeStart.width - deltaX);
          break;
        case 'ne':
          newWidth = Math.max(50, resizeStart.width + deltaX);
          break;
        case 'nw':
          newWidth = Math.max(50, resizeStart.width - deltaX);
          break;
        case 'e':
          newWidth = Math.max(50, resizeStart.width + deltaX);
          break;
        case 'w':
          newWidth = Math.max(50, resizeStart.width - deltaX);
          break;
      }

      selectedImage.style.width = `${newWidth}px`;
      selectedImage.style.height = 'auto';

      setImageSettings(prev => ({
        ...prev,
        width: newWidth,
        height: Math.round(newWidth * (resizeStart.height / resizeStart.width))
      }));

      updateResizeHandles();
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeHandle(null);
      updateContent();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, selectedImage, resizeStart, resizeHandle]);

  const addResizeHandles = (img: HTMLImageElement) => {
    removeResizeHandles();

    const wrapper = document.createElement('div');
    wrapper.className = 'image-resize-wrapper';
    wrapper.style.position = 'relative';
    wrapper.style.display = 'inline-block';
    wrapper.style.border = '2px solid #3b82f6';
    wrapper.style.boxShadow = '0 0 0 1px rgba(59, 130, 246, 0.5)';

    img.parentNode?.insertBefore(wrapper, img);
    wrapper.appendChild(img);

    const handles = [
      { position: 'nw', cursor: 'nw-resize', top: '-6px', left: '-6px' },
      { position: 'ne', cursor: 'ne-resize', top: '-6px', right: '-6px' },
      { position: 'sw', cursor: 'sw-resize', bottom: '-6px', left: '-6px' },
      { position: 'se', cursor: 'se-resize', bottom: '-6px', right: '-6px' },
      { position: 'n', cursor: 'n-resize', top: '-6px', left: '50%', transform: 'translateX(-50%)' },
      { position: 's', cursor: 's-resize', bottom: '-6px', left: '50%', transform: 'translateX(-50%)' },
      { position: 'w', cursor: 'w-resize', top: '50%', left: '-6px', transform: 'translateY(-50%)' },
      { position: 'e', cursor: 'e-resize', top: '50%', right: '-6px', transform: 'translateY(-50%)' }
    ];

    handles.forEach(({ position, cursor, top, right, bottom, left, transform }) => {
      const handle = document.createElement('div');
      handle.className = `resize-handle resize-handle-${position}`;
      handle.style.position = 'absolute';
      handle.style.width = '12px';
      handle.style.height = '12px';
      handle.style.backgroundColor = '#3b82f6';
      handle.style.border = '2px solid white';
      handle.style.borderRadius = '50%';
      handle.style.cursor = cursor;
      handle.style.zIndex = '1000';
      handle.style.boxShadow = '0 0 0 1px rgba(0, 0, 0, 0.1)';

      if (top) handle.style.top = top;
      if (right) handle.style.right = right;
      if (bottom) handle.style.bottom = bottom;
      if (left) handle.style.left = left;
      if (transform) handle.style.transform = transform;

      handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        setResizeHandle(position as any);
        setResizeStart({
          x: e.clientX,
          y: e.clientY,
          width: img.offsetWidth,
          height: img.offsetHeight
        });
      });

      wrapper.appendChild(handle);
    });
  };

  const removeResizeHandles = () => {
    const wrappers = editorRef.current?.querySelectorAll('.image-resize-wrapper');
    wrappers?.forEach(wrapper => {
      const img = wrapper.querySelector('img');
      if (img && wrapper.parentNode) {
        wrapper.parentNode.insertBefore(img, wrapper);
        wrapper.remove();
      }
    });
  };

  const updateResizeHandles = () => {
    if (selectedImage) {
      const wrapper = selectedImage.closest('.image-resize-wrapper');
      if (wrapper) {
        // Les handles sont automatiquement repositionnés car ils sont en position absolute
      }
    }
  };

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
      onChange(html);
    }
  };

  const handleImageClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
      e.preventDefault();
      e.stopPropagation();
      const img = target as HTMLImageElement;

      removeResizeHandles();
      setSelectedImage(img);
      setShowImageToolbar(true);
      addResizeHandles(img);

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

    removeResizeHandles();
    addResizeHandles(selectedImage);
    updateContent();
  };

  const deleteSelectedImage = () => {
    if (selectedImage) {
      removeResizeHandles();
      selectedImage.remove();
      setSelectedImage(null);
      setShowImageToolbar(false);
      updateContent();
    }
  };

  const handleImageDragStart = (e: DragEvent) => {
    const img = e.target as HTMLImageElement;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', img.outerHTML);
      img.style.opacity = '0.4';
    }
  };

  const handleImageDragEnd = (e: DragEvent) => {
    const img = e.target as HTMLImageElement;
    img.style.opacity = '1';
  };

  const handleEditorDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleEditorDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const html = e.dataTransfer.getData('text/html');
    if (html && html.includes('editor-image')) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const droppedImg = tempDiv.querySelector('img');

      if (droppedImg && editorRef.current) {
        const allImages = editorRef.current.querySelectorAll('img.editor-image');
        allImages.forEach(img => {
          if (img.getAttribute('src') === droppedImg.getAttribute('src')) {
            img.remove();
          }
        });

        const selection = window.getSelection();
        let range: Range;

        if (selection && selection.rangeCount > 0) {
          range = selection.getRangeAt(0);
        } else {
          range = document.createRange();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
        }

        const newImg = document.createElement('img');
        newImg.src = droppedImg.src;
        newImg.alt = droppedImg.alt;
        newImg.style.cssText = droppedImg.style.cssText;
        newImg.draggable = true;
        newImg.className = 'editor-image';
        newImg.style.cursor = 'move';

        newImg.addEventListener('dragstart', handleImageDragStart);
        newImg.addEventListener('dragend', handleImageDragEnd);

        range.insertNode(newImg);
        range.setStartAfter(newImg);
        range.collapse(true);

        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }

        updateContent();
      }
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
      img.style.margin = '10px';
      img.style.borderRadius = '8px';
      img.style.cursor = 'move';
      img.style.display = 'inline-block';
      img.style.verticalAlign = 'middle';
      img.draggable = true;
      img.className = 'editor-image';

      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(img);

        range.setStartAfter(img);
        range.setEndAfter(img);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        editorRef.current.appendChild(img);
      }

      img.addEventListener('dragstart', handleImageDragStart);
      img.addEventListener('dragend', handleImageDragEnd);

      updateContent();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    console.log('Files selected:', files.length);
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

          const numPages = Math.min(pdf.numPages, 3);
          const pdfImages: string[] = [];

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
              pdfImages.push(pageDataUrl);
            }
          }

          if (editorRef.current) {
            const pdfContainer = document.createElement('div');
            pdfContainer.className = 'pdf-container';
            pdfContainer.style.margin = '16px 0';
            pdfContainer.style.padding = '16px';
            pdfContainer.style.background = '#f9fafb';
            pdfContainer.style.border = '2px solid #e5e7eb';
            pdfContainer.style.borderRadius = '8px';

            const titleWrapper = document.createElement('div');
            titleWrapper.style.display = 'flex';
            titleWrapper.style.alignItems = 'center';
            titleWrapper.style.justifyContent = 'space-between';
            titleWrapper.style.marginBottom = '12px';
            titleWrapper.style.paddingBottom = '8px';
            titleWrapper.style.borderBottom = '1px solid #e5e7eb';

            const title = document.createElement('h4');
            title.textContent = `📄 ${file.name}`;
            title.style.color = '#0E2F56';
            title.style.fontSize = '16px';
            title.style.fontWeight = '600';
            title.style.margin = '0';

            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.style.padding = '4px 8px';
            deleteBtn.style.background = '#fee2e2';
            deleteBtn.style.border = '1px solid #fca5a5';
            deleteBtn.style.borderRadius = '6px';
            deleteBtn.style.cursor = 'pointer';
            deleteBtn.style.fontSize = '16px';
            deleteBtn.title = 'Supprimer ce document';
            deleteBtn.contentEditable = 'false';

            deleteBtn.addEventListener('mouseenter', () => {
              deleteBtn.style.background = '#fecaca';
            });

            deleteBtn.addEventListener('mouseleave', () => {
              deleteBtn.style.background = '#fee2e2';
            });

            deleteBtn.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              pdfContainer.remove();
              updateContent();
            });

            titleWrapper.appendChild(title);
            titleWrapper.appendChild(deleteBtn);
            titleWrapper.contentEditable = 'false';
            pdfContainer.appendChild(titleWrapper);

            pdfImages.forEach((dataUrl, index) => {
              const img = document.createElement('img');
              img.src = dataUrl;
              img.alt = `${file.name} - Page ${index + 1}`;
              img.style.width = '600px';
              img.style.height = 'auto';
              img.style.maxWidth = '100%';
              img.style.margin = '8px 0';
              img.style.border = '1px solid #e5e7eb';
              img.style.borderRadius = '4px';
              img.style.cursor = 'pointer';
              img.style.display = 'block';
              img.className = 'editor-image pdf-page';
              pdfContainer.appendChild(img);
            });

            if (pdf.numPages > 3) {
              const moreText = document.createElement('p');
              moreText.textContent = `... et ${pdf.numPages - 3} page(s) supplémentaire(s)`;
              moreText.style.color = '#6b7280';
              moreText.style.fontSize = '14px';
              moreText.style.marginTop = '8px';
              pdfContainer.appendChild(moreText);
            }

            editorRef.current.appendChild(pdfContainer);
          }

          const newFile: AttachedFile = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'pdf',
            url: fileUrl,
            name: file.name,
            content: ''
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
            if (editorRef.current) {
              const wordContainer = document.createElement('div');
              wordContainer.className = 'word-container';
              wordContainer.style.background = 'white';
              wordContainer.style.padding = '16px';
              wordContainer.style.border = '2px solid #e5e7eb';
              wordContainer.style.borderRadius = '8px';
              wordContainer.style.margin = '16px 0';
              wordContainer.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';

              const title = document.createElement('div');
              title.style.display = 'flex';
              title.style.alignItems = 'center';
              title.style.justifyContent = 'space-between';
              title.style.marginBottom = '12px';
              title.style.paddingBottom = '8px';
              title.style.borderBottom = '1px solid #e5e7eb';

              const titleText = document.createElement('h4');
              titleText.style.color = '#0E2F56';
              titleText.style.fontSize = '16px';
              titleText.style.fontWeight = '600';
              titleText.style.display = 'flex';
              titleText.style.alignItems = 'center';
              titleText.style.gap = '8px';
              titleText.style.margin = '0';
              titleText.innerHTML = `<span style="font-size: 20px;">📄</span> ${file.name}`;

              const deleteBtn = document.createElement('button');
              deleteBtn.type = 'button';
              deleteBtn.innerHTML = '🗑️';
              deleteBtn.style.padding = '4px 8px';
              deleteBtn.style.background = '#fee2e2';
              deleteBtn.style.border = '1px solid #fca5a5';
              deleteBtn.style.borderRadius = '6px';
              deleteBtn.style.cursor = 'pointer';
              deleteBtn.style.fontSize = '16px';
              deleteBtn.title = 'Supprimer ce document';
              deleteBtn.contentEditable = 'false';

              deleteBtn.addEventListener('mouseenter', () => {
                deleteBtn.style.background = '#fecaca';
              });

              deleteBtn.addEventListener('mouseleave', () => {
                deleteBtn.style.background = '#fee2e2';
              });

              deleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                wordContainer.remove();
                updateContent();
              });

              title.appendChild(titleText);
              title.appendChild(deleteBtn);
              title.contentEditable = 'false';
              wordContainer.appendChild(title);

              const contentDiv = document.createElement('div');
              contentDiv.innerHTML = result.value;
              contentDiv.style.lineHeight = '1.6';
              contentDiv.contentEditable = 'true';
              contentDiv.style.outline = 'none';
              contentDiv.style.padding = '8px';
              contentDiv.style.minHeight = '100px';
              contentDiv.style.borderRadius = '4px';
              contentDiv.className = 'editable-content';

              contentDiv.addEventListener('focus', () => {
                contentDiv.style.background = '#f0f9ff';
                contentDiv.style.border = '1px solid #3b82f6';
              });

              contentDiv.addEventListener('blur', () => {
                contentDiv.style.background = 'transparent';
                contentDiv.style.border = '1px solid transparent';
              });

              contentDiv.addEventListener('input', () => {
                updateContent();
              });

              wordContainer.appendChild(contentDiv);

              editorRef.current.appendChild(wordContainer);
            }

            const newFile: AttachedFile = {
              id: Math.random().toString(36).substr(2, 9),
              type: 'pdf',
              url: fileUrl,
              name: file.name,
              content: ''
            };
            setAttachedFiles(prev => [...prev, newFile]);
          }
        } catch (error) {
          console.error('Error loading Word document:', error);
          alert('Erreur lors du chargement du document Word');
        }
      } else if (fileExtension === 'txt') {
        try {
          const text = await file.text();

          if (text && text.trim()) {
            if (editorRef.current) {
              const txtContainer = document.createElement('div');
              txtContainer.className = 'txt-container';
              txtContainer.style.background = '#f9fafb';
              txtContainer.style.padding = '16px';
              txtContainer.style.border = '2px solid #e5e7eb';
              txtContainer.style.borderRadius = '8px';
              txtContainer.style.margin = '16px 0';
              txtContainer.style.fontFamily = 'monospace';
              txtContainer.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';

              const title = document.createElement('div');
              title.style.display = 'flex';
              title.style.alignItems = 'center';
              title.style.justifyContent = 'space-between';
              title.style.marginBottom = '12px';
              title.style.paddingBottom = '8px';
              title.style.borderBottom = '1px solid #e5e7eb';

              const titleText = document.createElement('h4');
              titleText.style.color = '#0E2F56';
              titleText.style.fontSize = '16px';
              titleText.style.fontWeight = '600';
              titleText.style.display = 'flex';
              titleText.style.alignItems = 'center';
              titleText.style.gap = '8px';
              titleText.style.margin = '0';
              titleText.innerHTML = `<span style="font-size: 20px;">📝</span> ${file.name}`;

              const deleteBtn = document.createElement('button');
              deleteBtn.type = 'button';
              deleteBtn.innerHTML = '🗑️';
              deleteBtn.style.padding = '4px 8px';
              deleteBtn.style.background = '#fee2e2';
              deleteBtn.style.border = '1px solid #fca5a5';
              deleteBtn.style.borderRadius = '6px';
              deleteBtn.style.cursor = 'pointer';
              deleteBtn.style.fontSize = '16px';
              deleteBtn.title = 'Supprimer ce document';
              deleteBtn.contentEditable = 'false';

              deleteBtn.addEventListener('mouseenter', () => {
                deleteBtn.style.background = '#fecaca';
              });

              deleteBtn.addEventListener('mouseleave', () => {
                deleteBtn.style.background = '#fee2e2';
              });

              deleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                txtContainer.remove();
                updateContent();
              });

              title.appendChild(titleText);
              title.appendChild(deleteBtn);
              title.contentEditable = 'false';
              txtContainer.appendChild(title);

              const contentDiv = document.createElement('div');
              contentDiv.textContent = text;
              contentDiv.contentEditable = 'true';
              contentDiv.style.whiteSpace = 'pre-wrap';
              contentDiv.style.wordWrap = 'break-word';
              contentDiv.style.margin = '0';
              contentDiv.style.fontSize = '14px';
              contentDiv.style.lineHeight = '1.6';
              contentDiv.style.color = '#374151';
              contentDiv.style.outline = 'none';
              contentDiv.style.padding = '8px';
              contentDiv.style.minHeight = '100px';
              contentDiv.style.borderRadius = '4px';
              contentDiv.className = 'editable-content';

              contentDiv.addEventListener('focus', () => {
                contentDiv.style.background = '#f0f9ff';
                contentDiv.style.border = '1px solid #3b82f6';
              });

              contentDiv.addEventListener('blur', () => {
                contentDiv.style.background = 'transparent';
                contentDiv.style.border = '1px solid transparent';
              });

              contentDiv.addEventListener('input', () => {
                updateContent();
              });

              txtContainer.appendChild(contentDiv);

              editorRef.current.appendChild(txtContainer);
            }

            const newFile: AttachedFile = {
              id: Math.random().toString(36).substr(2, 9),
              type: 'pdf',
              url: fileUrl,
              name: file.name,
              content: ''
            };
            setAttachedFiles(prev => [...prev, newFile]);
          }
        } catch (error) {
          console.error('Error loading TXT file:', error);
          alert('Erreur lors du chargement du fichier TXT');
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

  const handleClearEditor = () => {
    if (confirm('Êtes-vous sûr de vouloir vider tout le contenu de l\'éditeur ?')) {
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
        onChange('');
      }

      attachedFiles.forEach(file => {
        URL.revokeObjectURL(file.url);
      });
      setAttachedFiles([]);
      setSelectedImage(null);
      setShowImageToolbar(false);
      removeResizeHandles();
    }
  };

  const handleSaveContent = () => {
    const content = editorRef.current?.innerHTML || '';
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contenu-editeur-${Date.now()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadContent = () => {
    const content = editorRef.current?.innerHTML || '';

    const fullHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document exporté</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      color: #333;
    }
    img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 10px 0;
    }
    .pdf-container, .word-container, .txt-container {
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      padding: 16px;
      margin: 16px 0;
      background: #f9fafb;
    }
    h1, h2, h3, h4, h5, h6 {
      color: #1f2937;
      margin-top: 24px;
      margin-bottom: 12px;
    }
    ul, ol {
      padding-left: 24px;
    }
    li {
      margin: 8px 0;
    }
    p {
      margin: 12px 0;
    }
  </style>
</head>
<body>
  ${content}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `document-complet-${Date.now()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
            onClick={() => {
              console.log('Import button clicked');
              fileInputRef.current?.click();
            }}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50"
            title="Formats acceptés: PDF, DOC, DOCX, TXT, JPG, PNG"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Chargement...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Importer Documents</span>
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp,.svg"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            type="button"
            onClick={handleClearEditor}
            className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition"
            title="Vider tout le contenu de l'éditeur"
          >
            <Eraser className="w-4 h-4" />
            <span>Vider</span>
          </button>

          <button
            type="button"
            onClick={handleSaveContent}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition"
            title="Enregistrer le contenu (HTML simple)"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadContent}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition"
            title="Télécharger le document complet (HTML formaté)"
          >
            <Download className="w-4 h-4" />
            <span>Télécharger</span>
          </button>

          {onGenerateWithAI && (
            <button
              type="button"
              onClick={onGenerateWithAI}
              disabled={isGeneratingAI || !isPremium}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition ${
                isPremium
                  ? 'bg-gradient-to-r from-[#FF8C00] to-orange-600 hover:from-orange-600 hover:to-[#FF8C00] text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              title={!isPremium ? 'Fonctionnalité Premium uniquement' : 'Générer avec IA'}
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGeneratingAI ? 'Génération...' : 'Générer avec IA'}</span>
              {!isPremium && <span className="text-xs">(Premium)</span>}
            </button>
          )}
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
        onDragOver={handleEditorDragOver}
        onDrop={handleEditorDrop}
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
        <span className="font-semibold">💡 Astuces:</span>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Formats supportés: PDF, DOC, DOCX, TXT, JPG, PNG, GIF, WEBP, SVG</li>
          <li><strong>Coller une image:</strong> Positionnez le curseur où vous voulez, puis Ctrl+V - l'image apparaît exactement à cet endroit</li>
          <li><strong>Déplacer une image:</strong> Glissez-déposez l'image avec la souris pour la repositionner dans le texte</li>
          <li>Cliquez sur une image pour la redimensionner avec les poignées ou les contrôles de la barre d'outils</li>
          <li>Les documents Word et TXT sont éditables directement dans l'éditeur</li>
        </ul>
      </div>
    </div>
  );
}
