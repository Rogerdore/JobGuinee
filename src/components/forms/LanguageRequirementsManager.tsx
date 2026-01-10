import { useState } from 'react';
import { Plus, X, Globe } from 'lucide-react';
import { LanguageRequirement } from '../../types/jobFormTypes';
import { languageSuggestions, languageLevels } from '../../utils/jobSuggestions';
import ModernModal from '../modals/ModernModal';

interface LanguageRequirementsManagerProps {
  requirements: LanguageRequirement[];
  onChange: (requirements: LanguageRequirement[]) => void;
}

export default function LanguageRequirementsManager({ requirements, onChange }: LanguageRequirementsManagerProps) {
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('Intermédiaire (B1)');
  const [customLanguage, setCustomLanguage] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'warning' | 'error' | 'info' | 'success';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
  });

  const handleAddLanguage = () => {
    const languageToAdd = showCustomInput ? customLanguage.trim() : selectedLanguage;

    if (!languageToAdd) {
      setModalState({
        isOpen: true,
        title: 'Langue manquante',
        message: 'Veuillez sélectionner ou saisir une langue avant de l\'ajouter.',
        type: 'warning',
      });
      return;
    }

    if (requirements.some(req => req.language === languageToAdd)) {
      setModalState({
        isOpen: true,
        title: 'Langue déjà ajoutée',
        message: `La langue "${languageToAdd}" a déjà été ajoutée à la liste. Chaque langue ne peut être ajoutée qu'une seule fois.`,
        type: 'info',
      });
      return;
    }

    const newRequirement: LanguageRequirement = {
      language: languageToAdd,
      level: selectedLevel
    };

    onChange([...requirements, newRequirement]);

    setSelectedLanguage('');
    setCustomLanguage('');
    setShowCustomInput(false);
    setSelectedLevel('Intermédiaire (B1)');
  };

  const handleRemoveLanguage = (language: string) => {
    onChange(requirements.filter(req => req.language !== language));
  };

  const handleUpdateLevel = (language: string, newLevel: string) => {
    onChange(requirements.map(req =>
      req.language === language ? { ...req, level: newLevel } : req
    ));
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-5 h-5 text-blue-600" />
          <label className="text-sm font-semibold text-gray-700">
            Ajouter une langue requise
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Language Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Langue
            </label>
            {showCustomInput ? (
              <div className="relative">
                <input
                  type="text"
                  value={customLanguage}
                  onChange={(e) => setCustomLanguage(e.target.value)}
                  placeholder="Nom de la langue"
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddLanguage()}
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomLanguage('');
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Sélectionner...</option>
                {languageSuggestions.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            )}
          </div>

          {/* Level Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Niveau requis
            </label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {languageLevels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          {/* Add Button */}
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={handleAddLanguage}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 font-medium"
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
            {!showCustomInput && (
              <button
                type="button"
                onClick={() => setShowCustomInput(true)}
                className="px-3 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition text-sm"
                title="Ajouter une autre langue"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* List of Added Languages */}
      {requirements.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Langues requises ({requirements.length})
          </label>
          <div className="space-y-2">
            {requirements.map((req, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border-2 border-blue-200"
              >
                <Globe className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <div className="flex-1 flex items-center gap-3">
                  <span className="font-semibold text-gray-800">
                    {req.language}
                  </span>
                  <span className="text-gray-400">•</span>
                  <select
                    value={req.level}
                    onChange={(e) => handleUpdateLevel(req.language, e.target.value)}
                    className="px-2 py-1 text-sm border border-blue-300 rounded bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    {languageLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveLanguage(req.language)}
                  className="p-1 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                  title="Supprimer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <ModernModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        confirmText="Compris"
      />
    </div>
  );
}
