import { jsPDF } from 'jspdf';

interface WatermarkOptions {
  text: string;
  opacity?: number;
  fontSize?: number;
  angle?: number;
  color?: string;
}

export const watermarkService = {
  async addWatermarkToPDF(
    pdfUrl: string,
    options: WatermarkOptions
  ): Promise<Blob> {
    const {
      text,
      opacity = 0.3,
      fontSize = 40,
      angle = -45,
      color = '#999999'
    } = options;

    try {
      const response = await fetch(pdfUrl);
      const pdfBlob = await response.blob();
      const pdfArrayBuffer = await pdfBlob.arrayBuffer();

      const pdf = new jsPDF();

      const pageCount = 1;

      for (let i = 0; i < pageCount; i++) {
        if (i > 0) pdf.addPage();

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        pdf.saveGraphicsState();
        pdf.setGState(new pdf.GState({ opacity }));
        pdf.setFontSize(fontSize);
        pdf.setTextColor(color);

        const textWidth = pdf.getTextWidth(text);
        const x = pageWidth / 2;
        const y = pageHeight / 2;

        pdf.text(text, x, y, {
          angle,
          align: 'center',
          baseline: 'middle'
        });

        pdf.restoreGraphicsState();
      }

      const watermarkedPdfBlob = pdf.output('blob');
      return watermarkedPdfBlob;
    } catch (error) {
      console.error('Error adding watermark to PDF:', error);
      throw new Error('Failed to add watermark to PDF');
    }
  },

  async addWatermarkToImage(
    imageUrl: string,
    options: WatermarkOptions
  ): Promise<Blob> {
    const {
      text,
      opacity = 0.3,
      fontSize = 40,
      angle = -45,
      color = '#999999'
    } = options;

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0);

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.font = `${fontSize}px Arial`;
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((angle * Math.PI) / 180);
        ctx.fillText(text, 0, 0);
        ctx.restore();

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        }, 'image/png');
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = imageUrl;
    });
  },

  generateWatermarkText(recruiterName: string, date: Date): string {
    const dateStr = date.toLocaleDateString('fr-FR');
    return `${recruiterName} - ${dateStr}`;
  },

  async addJobGuineeWatermark(fileUrl: string, recruiterName: string): Promise<Blob> {
    const watermarkText = this.generateWatermarkText(recruiterName, new Date());

    const fileExtension = fileUrl.split('.').pop()?.toLowerCase();

    if (fileExtension === 'pdf') {
      return this.addWatermarkToPDF(fileUrl, {
        text: watermarkText,
        opacity: 0.2,
        fontSize: 30,
        color: '#666666'
      });
    } else if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension || '')) {
      return this.addWatermarkToImage(fileUrl, {
        text: watermarkText,
        opacity: 0.2,
        fontSize: 30,
        color: '#666666'
      });
    } else {
      throw new Error('Unsupported file type for watermarking');
    }
  }
};
