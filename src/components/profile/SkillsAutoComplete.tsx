import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Plus, Sparkles, Check } from 'lucide-react';

interface SkillsAutoCompleteProps {
  value: string[];
  onChange: (skills: string[]) => void;
  label?: string;
  placeholder?: string;
  suggestions?: string[];
  maxSkills?: number;
  helpText?: string;
  aiSuggestions?: string[];
}

const COMMON_SKILLS_BY_CATEGORY = {
  'Développement': ['JavaScript', 'Python', 'React', 'Node.js', 'Java', 'TypeScript', 'PHP', 'SQL', 'Git', 'Docker'],
  'RH & Management': ['Recrutement', 'Gestion RH', 'Paie', 'Formation', 'SIRH', 'Leadership', 'Management', 'Communication'],
  'Comptabilité & Finance': ['Comptabilité', 'Excel', 'Sage', 'Fiscalité', 'Analyse financière', 'Budgétisation', 'Audit'],
  'Marketing & Communication': ['Marketing digital', 'Réseaux sociaux', 'SEO', 'Content marketing', 'Google Analytics', 'Communication'],
  'Commercial & Vente': ['Prospection', 'Négociation', 'CRM', 'Relation client', 'Closing', 'Vente B2B', 'Vente B2C'],
  'Ingénierie & Technique': ['AutoCAD', 'SolidWorks', 'Maintenance', 'Électricité', 'Mécanique', 'Génie civil', 'BTP'],
  'Langues': ['Français', 'Anglais', 'Arabe', 'Chinois', 'Espagnol', 'Allemand'],
  'Soft Skills': ['Leadership', 'Travail en équipe', 'Gestion du temps', 'Communication', 'Résolution de problèmes', 'Créativité', 'Adaptabilité'],
};

const ALL_COMMON_SKILLS = Object.values(COMMON_SKILLS_BY_CATEGORY).flat();

export default function SkillsAutoComplete({
  value = [],
  onChange,
  label = 'Compétences',
  placeholder = 'Tapez une compétence et appuyez sur Entrée...',
  suggestions = ALL_COMMON_SKILLS,
  maxSkills = 30,
  helpText,
  aiSuggestions = [],
}: SkillsAutoCompleteProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const allSuggestions = [...new Set([...aiSuggestions, ...suggestions])];

  const filteredSuggestions = inputValue.trim().length >= 2
    ? allSuggestions
        .filter(
          (s) =>
            s.toLowerCase().includes(inputValue.toLowerCase()) &&
            !value.some((v) => v.toLowerCase() === s.toLowerCase())
        )
        .slice(0, 10)
    : [];

  const handleAddSkill = useCallback(
    (skill: string) => {
      const trimmedSkill = skill.trim();
      if (!trimmedSkill) return;

      if (value.length >= maxSkills) {
        alert(`Vous ne pouvez pas ajouter plus de ${maxSkills} compétences`);
        return;
      }

      const skillExists = value.some(
        (v) => v.toLowerCase() === trimmedSkill.toLowerCase()
      );

      if (skillExists) {
        setInputValue('');
        return;
      }

      onChange([...value, trimmedSkill]);
      setInputValue('');
      setShowSuggestions(false);
      setSelectedIndex(-1);
      inputRef.current?.focus();
    },
    [value, onChange, maxSkills]
  );

  const handleRemoveSkill = useCallback(
    (skillToRemove: string) => {
      onChange(value.filter((s) => s !== skillToRemove));
    },
    [value, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex >= 0 && filteredSuggestions[selectedIndex]) {
          handleAddSkill(filteredSuggestions[selectedIndex]);
        } else if (inputValue.trim()) {
          handleAddSkill(inputValue);
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (filteredSuggestions.length > 0) {
          setSelectedIndex((prev) =>
            prev < filteredSuggestions.length - 1 ? prev + 1 : 0
          );
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (filteredSuggestions.length > 0) {
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredSuggestions.length - 1
          );
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
        setSelectedIndex(-1);
      } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
        e.preventDefault();
        handleRemoveSkill(value[value.length - 1]);
      }
    },
    [inputValue, selectedIndex, filteredSuggestions, value, handleAddSkill, handleRemoveSkill]
  );

  useEffect(() => {
    if (showSuggestions && selectedIndex >= 0 && listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
      }
    }
  }, [selectedIndex, showSuggestions]);

  useEffect(() => {
    setShowSuggestions(filteredSuggestions.length > 0);
    setSelectedIndex(-1);
  }, [inputValue, filteredSuggestions.length]);

  const handleFocus = useCallback(() => {
    if (inputValue.length >= 2) {
      setShowSuggestions(true);
    }
  }, [inputValue]);

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 200);
  }, []);

  const getSkillCategory = (skill: string): string | null => {
    for (const [category, skills] of Object.entries(COMMON_SKILLS_BY_CATEGORY)) {
      if (skills.some((s) => s.toLowerCase() === skill.toLowerCase())) {
        return category;
      }
    }
    return null;
  };

  const isAISuggestion = (skill: string) => {
    return aiSuggestions.some((s) => s.toLowerCase() === skill.toLowerCase());
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      )}

      {/* Tags existants */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg mb-3">
          {value.map((skill) => {
            const category = getSkillCategory(skill);
            return (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-full text-sm font-medium text-gray-700 shadow-sm hover:shadow transition-shadow group"
              >
                {category && (
                  <span
                    className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded"
                    title={category}
                  >
                    {category.substring(0, 3)}
                  </span>
                )}
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="p-0.5 hover:bg-red-100 rounded-full transition-colors group-hover:opacity-100 opacity-70"
                >
                  <X className="w-3.5 h-3.5 text-red-600" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Input avec auto-complétion */}
      <div className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={value.length >= maxSkills}
            autoComplete="off"
            className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          {value.length < maxSkills && (
            <button
              type="button"
              onClick={() => inputValue.trim() && handleAddSkill(inputValue)}
              disabled={!inputValue.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Ajouter"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div
            ref={listRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto"
          >
            {filteredSuggestions.map((suggestion, index) => {
              const isSelected = index === selectedIndex;
              const isAI = isAISuggestion(suggestion);
              const category = getSkillCategory(suggestion);

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleAddSkill(suggestion)}
                  className={`w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors flex items-center justify-between gap-2 ${
                    isSelected ? 'bg-blue-100' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {isAI && (
                      <Sparkles className="w-4 h-4 text-yellow-500 flex-shrink-0" title="Suggestion IA" />
                    )}
                    <span className="flex-1 truncate">{suggestion}</span>
                  </div>
                  {category && (
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded flex-shrink-0">
                      {category}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Compteur et aide */}
      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
        <span>
          {value.length} / {maxSkills} compétences
          {aiSuggestions.length > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 text-yellow-600">
              <Sparkles className="w-3 h-3" />
              {aiSuggestions.filter((s) => !value.includes(s)).length} suggestions IA disponibles
            </span>
          )}
        </span>
        <span>Appuyez sur Entrée pour ajouter</span>
      </div>

      {helpText && <p className="mt-2 text-sm text-gray-600">{helpText}</p>}

      {/* Suggestions rapides par catégorie (si aucune compétence ajoutée) */}
      {value.length === 0 && !inputValue && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 mb-3">
            Suggestions rapides par catégorie
          </h4>
          <div className="space-y-2">
            {Object.entries(COMMON_SKILLS_BY_CATEGORY).slice(0, 3).map(([category, skills]) => (
              <div key={category}>
                <p className="text-xs font-medium text-blue-800 mb-1">{category}</p>
                <div className="flex flex-wrap gap-1.5">
                  {skills.slice(0, 6).map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleAddSkill(skill)}
                      className="px-2.5 py-1 text-xs bg-white border border-blue-200 text-blue-700 rounded-full hover:bg-blue-100 hover:border-blue-300 transition-colors"
                    >
                      + {skill}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
