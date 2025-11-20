import { useState } from 'react';
import { FileText, Sparkles, Upload } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface CVAutoFillButtonProps {
  onDataExtracted: (data: any) => void;
}

export default function CVAutoFillButton({ onDataExtracted }: CVAutoFillButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }

    return fullText;
  };

  const extractTextFromDOCX = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };

  const parseCV = (text: string): any => {
    const data: any = {
      experiences: [],
      formations: [],
      skills: [],
      languages: [],
    };

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const phoneRegex = /(\+?224\s?)?[0-9]{3}\s?[0-9]{2}\s?[0-9]{2}\s?[0-9]{2}/;

    const emailMatch = text.match(emailRegex);
    if (emailMatch) data.email = emailMatch[0];

    const phoneMatch = text.match(phoneRegex);
    if (phoneMatch) data.phone = phoneMatch[0];

    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    const namePatterns = [
      /^([A-Z][a-zàâäéèêëïîôùûüÿæœç]+(?:\s+[A-Z][a-zàâäéèêëïîôùûüÿæœç]+)+)/,
      /^Nom\s*:\s*(.+)/i,
      /^Name\s*:\s*(.+)/i,
    ];

    for (const line of lines.slice(0, 10)) {
      for (const pattern of namePatterns) {
        const match = line.match(pattern);
        if (match && match[1] && match[1].length > 5) {
          data.fullName = match[1].trim();
          break;
        }
      }
      if (data.fullName) break;
    }

    const skillKeywords = [
      'compétences', 'competences', 'skills', 'savoir-faire',
      'capacités', 'aptitudes', 'connaissances'
    ];

    const commonSkills = [
      'Microsoft Office', 'Excel', 'Word', 'PowerPoint',
      'Gestion de projet', 'Management', 'Communication',
      'Travail d\'équipe', 'Leadership', 'Analyse',
      'Planification', 'Organisation', 'Négociation',
      'Python', 'JavaScript', 'SQL', 'HTML', 'CSS',
      'Comptabilité', 'Finance', 'Budgétisation',
      'Ressources Humaines', 'Recrutement', 'Formation',
      'Logistique', 'Supply Chain', 'Procurement',
    ];

    let inSkillsSection = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (skillKeywords.some(keyword => line.toLowerCase().includes(keyword))) {
        inSkillsSection = true;
        continue;
      }

      if (inSkillsSection) {
        if (line.match(/^[A-Z\s]+:/) || line.length > 100) {
          inSkillsSection = false;
          continue;
        }

        for (const skill of commonSkills) {
          if (line.toLowerCase().includes(skill.toLowerCase())) {
            if (!data.skills.includes(skill)) {
              data.skills.push(skill);
            }
          }
        }
      }
    }

    const languageKeywords = ['langues', 'languages', 'idiomas'];
    const commonLanguages = ['Français', 'Anglais', 'Espagnol', 'Arabe', 'Soussou', 'Malinké', 'Peul'];

    let inLanguagesSection = false;
    for (const line of lines) {
      if (languageKeywords.some(keyword => line.toLowerCase().includes(keyword))) {
        inLanguagesSection = true;
        continue;
      }

      if (inLanguagesSection) {
        if (line.match(/^[A-Z\s]+:/) || line.length > 100) {
          inLanguagesSection = false;
          continue;
        }

        for (const lang of commonLanguages) {
          if (line.toLowerCase().includes(lang.toLowerCase())) {
            if (!data.languages.includes(lang)) {
              data.languages.push(lang);
            }
          }
        }
      }
    }

    const experienceKeywords = ['expérience', 'experience', 'parcours professionnel', 'career'];
    let currentExp: any = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (experienceKeywords.some(keyword => line.toLowerCase().includes(keyword))) {
        continue;
      }

      const yearMatch = line.match(/(\d{4})\s*[-–]\s*(\d{4}|présent|present|actuel)/i);
      if (yearMatch) {
        if (currentExp) {
          data.experiences.push(currentExp);
        }
        currentExp = {
          'Poste occupé': '',
          'Entreprise': '',
          'Période': yearMatch[0],
          'Tâches principales': '',
        };
      } else if (currentExp && !currentExp['Poste occupé'] && line.length > 10 && line.length < 100) {
        currentExp['Poste occupé'] = line;
      } else if (currentExp && !currentExp['Entreprise'] && line.length > 5 && line.length < 100) {
        currentExp['Entreprise'] = line;
      }
    }

    if (currentExp) {
      data.experiences.push(currentExp);
    }

    const formationKeywords = ['formation', 'education', 'études', 'diplôme'];
    let currentForm: any = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (formationKeywords.some(keyword => line.toLowerCase().includes(keyword))) {
        continue;
      }

      const yearMatch = line.match(/(\d{4})\s*[-–]\s*(\d{4})/);
      if (yearMatch) {
        if (currentForm) {
          data.formations.push(currentForm);
        }
        currentForm = {
          'Diplôme obtenu': '',
          'Institution': '',
          'Année': yearMatch[0],
        };
      } else if (currentForm && !currentForm['Diplôme obtenu'] && line.length > 10 && line.length < 100) {
        currentForm['Diplôme obtenu'] = line;
      } else if (currentForm && !currentForm['Institution'] && line.length > 5 && line.length < 100) {
        currentForm['Institution'] = line;
      }
    }

    if (currentForm) {
      data.formations.push(currentForm);
    }

    return data;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      let text = '';

      if (file.type === 'application/pdf') {
        text = await extractTextFromPDF(file);
      } else if (
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.name.endsWith('.docx')
      ) {
        text = await extractTextFromDOCX(file);
      } else {
        throw new Error('Format de fichier non supporté. Veuillez utiliser un PDF ou DOCX.');
      }

      const extractedData = parseCV(text);

      if (Object.values(extractedData).every(v =>
        Array.isArray(v) ? v.length === 0 : !v
      )) {
        setError('Aucune information n\'a pu être extraite du CV. Veuillez remplir le formulaire manuellement.');
      } else {
        onDataExtracted(extractedData);
      }
    } catch (err: any) {
      console.error('Error parsing CV:', err);
      setError(err.message || 'Erreur lors de la lecture du CV');
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="mb-6">
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Sparkles className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Auto-remplissage intelligent</h3>
            <p className="text-sm text-gray-600">
              Importez votre CV pour remplir automatiquement le formulaire
            </p>
          </div>
        </div>

        <label
          htmlFor="cv-upload"
          className={`flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-purple-300 rounded-lg text-purple-700 font-medium cursor-pointer hover:bg-purple-50 hover:border-purple-400 transition-all ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
              <span>Analyse en cours...</span>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              <span>Importer mon CV (PDF ou DOCX)</span>
            </>
          )}
        </label>
        <input
          id="cv-upload"
          type="file"
          accept=".pdf,.docx"
          onChange={handleFileUpload}
          disabled={loading}
          className="hidden"
        />

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <p className="text-xs text-gray-500 mt-3">
          💡 Le système analyse votre CV et remplit automatiquement les champs détectés.
          Vous pourrez ensuite modifier les informations si nécessaire.
        </p>
      </div>
    </div>
  );
}
