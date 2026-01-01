import { X, Plus, Languages } from 'lucide-react';
import { useState } from 'react';
import { languageSuggestions, languageLevels } from '../../utils/jobSuggestions';
import { LanguageRequirement } from '../../types/jobFormTypes';

interface LanguageLevelSelectorProps {
  languageRequirements: LanguageRequirement[];
  onChange: (requirements: LanguageRequirement[]) => void;
}

export default function LanguageLevelSelector({ languageRequirements, onChange }: LanguageLevelSelectorProps) {
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');

  const handleAdd = () => {
    if (selectedLanguage && selectedLevel) {
      const exists = languageRequirements.some(req => req.language === selectedLanguage);
      if (!exists) {
        onChange([...languageRequirements, { language: selectedLanguage, level: selectedLevel }]);
        setSelectedLanguage('');
        setSelectedLevel('');
      }
    }
  };

  const handleRemove = (language: string) => {
    onChange(languageRequirements.filter(req => req.language !== language));
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
        <Languages className="w-5 h-5 text-[#0E2F56]" />
        Langues exigées avec niveaux
      </label>

      <div className="flex gap-2">
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-[#0E2F56] focus:ring-2 focus:ring-blue-100 transition"
        >
          <option value="">Sélectionner une langue</option>
          {languageSuggestions.map((lang) => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>

        <select
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
          className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-[#0E2F56] focus:ring-2 focus:ring-blue-100 transition"
        >
          <option value="">Niveau requis</option>
          {languageLevels.map((level) => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleAdd}
          disabled={!selectedLanguage || !selectedLevel}
          className="px-4 py-2.5 bg-[#0E2F56] text-white rounded-xl hover:bg-[#1a4275] disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Ajouter
        </button>
      </div>

      {languageRequirements.length > 0 && (
        <div className="space-y-2 mt-4">
          <p className="text-sm font-medium text-gray-600">
            Langues sélectionnées ({languageRequirements.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {languageRequirements.map((req) => (
              <div
                key={req.language}
                className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl hover:border-blue-400 transition"
              >
                <Languages className="w-4 h-4 text-[#0E2F56]" />
                <span className="text-sm font-medium text-gray-900">{req.language}</span>
                <span className="text-xs px-2 py-0.5 bg-blue-600 text-white rounded-full">
                  {req.level}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(req.language)}
                  className="ml-1 p-1 rounded-full hover:bg-red-100 transition group-hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {languageRequirements.length === 0 && (
        <p className="text-sm text-gray-500 italic">
          Aucune langue ajoutée. Ajoutez les langues requises avec leur niveau d'exigence.
        </p>
      )}
    </div>
  );
}
