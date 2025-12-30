import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { writeFileSync, readFileSync } from 'fs';

const mainDocPath = './DOCUMENTATION_TECHNIQUE_COMPLETE_JOBGUINEE.md';
const resumePath = './RESUME_EXECUTIF_JOBGUINEE.md';
const outputPath = './JOBGUINEE_DOCUMENTATION_COMPLETE.docx';

function parseMarkdownToParagraphs(markdown) {
  const lines = markdown.split('\n');
  const paragraphs = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('# ')) {
      paragraphs.push(
        new Paragraph({
          text: line.substring(2),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        })
      );
    } else if (line.startsWith('## ')) {
      paragraphs.push(
        new Paragraph({
          text: line.substring(3),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 150 },
        })
      );
    } else if (line.startsWith('### ')) {
      paragraphs.push(
        new Paragraph({
          text: line.substring(4),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
        })
      );
    } else if (line.startsWith('#### ')) {
      paragraphs.push(
        new Paragraph({
          text: line.substring(5),
          heading: HeadingLevel.HEADING_4,
          spacing: { before: 150, after: 75 },
        })
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const bulletText = line.substring(2);
      const children = [];

      const boldMatches = bulletText.match(/\*\*(.*?)\*\*/g);
      if (boldMatches) {
        let remaining = bulletText;
        boldMatches.forEach(match => {
          const parts = remaining.split(match);
          if (parts[0]) {
            children.push(new TextRun(parts[0]));
          }
          children.push(new TextRun({ text: match.replace(/\*\*/g, ''), bold: true }));
          remaining = parts.slice(1).join(match);
        });
        if (remaining) {
          children.push(new TextRun(remaining));
        }
      } else {
        children.push(new TextRun(bulletText));
      }

      paragraphs.push(
        new Paragraph({
          children,
          bullet: { level: 0 },
          spacing: { before: 100, after: 100 },
        })
      );
    } else if (line.startsWith('  - ') || line.startsWith('  * ')) {
      paragraphs.push(
        new Paragraph({
          text: line.substring(4),
          bullet: { level: 1 },
          spacing: { before: 50, after: 50 },
        })
      );
    } else if (line.startsWith('```')) {
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      paragraphs.push(
        new Paragraph({
          text: codeLines.join('\n'),
          spacing: { before: 200, after: 200 },
          style: 'Code',
        })
      );
    } else if (line.startsWith('---')) {
      paragraphs.push(
        new Paragraph({
          text: '________________________________________',
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 },
        })
      );
    } else if (line.trim() === '') {
      paragraphs.push(new Paragraph({ text: '' }));
    } else {
      const children = [];
      let remaining = line;

      const boldMatches = line.match(/\*\*(.*?)\*\*/g);
      if (boldMatches) {
        boldMatches.forEach(match => {
          const parts = remaining.split(match);
          if (parts[0]) {
            children.push(new TextRun(parts[0]));
          }
          children.push(new TextRun({ text: match.replace(/\*\*/g, ''), bold: true }));
          remaining = parts.slice(1).join(match);
        });
        if (remaining) {
          children.push(new TextRun(remaining));
        }
      } else {
        children.push(new TextRun(line));
      }

      paragraphs.push(
        new Paragraph({
          children,
          spacing: { before: 100, after: 100 },
        })
      );
    }
  }

  return paragraphs;
}

async function generateDocx() {
  console.log('📖 Lecture des fichiers markdown...');

  const resumeContent = readFileSync(resumePath, 'utf-8');
  const mainContent = readFileSync(mainDocPath, 'utf-8');

  console.log('🔄 Conversion en format DOCX...');

  const sections = [];

  sections.push(
    new Paragraph({
      text: 'DOCUMENTATION COMPLÈTE',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 400 },
    })
  );

  sections.push(
    new Paragraph({
      text: 'PLATEFORME JOBGUINEE',
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  sections.push(
    new Paragraph({
      text: 'Version 2.0 - Production Ready',
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  sections.push(
    new Paragraph({
      text: `Généré le ${new Date().toLocaleDateString('fr-FR')}`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    })
  );

  sections.push(
    new Paragraph({
      text: '________________________________________',
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 400 },
    })
  );

  sections.push(
    new Paragraph({
      text: 'PARTIE 1: RÉSUMÉ EXÉCUTIF',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 600, after: 400 },
    })
  );

  sections.push(...parseMarkdownToParagraphs(resumeContent));

  sections.push(
    new Paragraph({
      text: '________________________________________',
      alignment: AlignmentType.CENTER,
      spacing: { before: 600, after: 600 },
    })
  );

  sections.push(
    new Paragraph({
      text: 'PARTIE 2: DOCUMENTATION TECHNIQUE DÉTAILLÉE',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 600, after: 400 },
    })
  );

  sections.push(...parseMarkdownToParagraphs(mainContent));

  console.log('📝 Création du document Word...');

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: sections,
      },
    ],
  });

  console.log('💾 Sauvegarde du fichier...');

  const buffer = await Packer.toBuffer(doc);
  writeFileSync(outputPath, buffer);

  console.log(`✅ Document créé avec succès: ${outputPath}`);
  console.log(`📊 Taille: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
}

generateDocx().catch(console.error);
