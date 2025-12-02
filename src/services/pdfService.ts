import jsPDF from 'jspdf';

export interface PDFGenerationOptions {
  htmlContent: string;
  fileName?: string;
  format?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
}

export class PDFService {
  static async generateFromHTML(options: PDFGenerationOptions): Promise<Blob> {
    const {
      htmlContent,
      format = 'a4',
      orientation = 'portrait'
    } = options;

    const doc = new jsPDF({
      orientation,
      unit: 'mm',
      format
    });

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.width = '190mm';
    tempDiv.style.padding = '10mm';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    document.body.appendChild(tempDiv);

    try {
      await doc.html(tempDiv, {
        callback: () => {},
        x: 10,
        y: 10,
        width: 190,
        windowWidth: 800
      });

      document.body.removeChild(tempDiv);

      return doc.output('blob');
    } catch (error) {
      document.body.removeChild(tempDiv);
      throw error;
    }
  }

  static downloadPDF(blob: Blob, fileName: string = 'document.pdf') {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static async generateAndDownload(options: PDFGenerationOptions & { fileName: string }) {
    const blob = await this.generateFromHTML(options);
    this.downloadPDF(blob, options.fileName);
  }

  static cleanHtmlForPDF(html: string): string {
    let cleaned = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    cleaned = cleaned.replace(/style="([^"]*)"/gi, (match, styles) => {
      const cleanedStyles = styles
        .split(';')
        .filter((s: string) => {
          const prop = s.trim().toLowerCase();
          return !prop.startsWith('position') &&
                 !prop.startsWith('top') &&
                 !prop.startsWith('left') &&
                 !prop.startsWith('right') &&
                 !prop.startsWith('bottom') &&
                 !prop.startsWith('z-index');
        })
        .join(';');
      return `style="${cleanedStyles}"`;
    });

    return cleaned;
  }

  static async convertMarkdownToHTML(markdown: string): Promise<string> {
    let html = markdown
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/^\- (.*$)/gim, '<li>$1</li>')
      .replace(/\n\n/gim, '</p><p>')
      .replace(/\n/gim, '<br/>');

    html = `<div style="font-family: Arial, sans-serif; line-height: 1.6;">${html}</div>`;
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    return html;
  }
}

export default PDFService;
