import { useState, useRef, useEffect } from 'react';
import { X, Plus } from 'lucide-react';

interface AutocompleteTagsInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  suggestions: string[];
  placeholder?: string;
  label?: string;
  maxTags?: number;
}

export default function AutocompleteTagsInput({
  values,
  onChange,
  suggestions,
  placeholder,
  label,
  maxTags,
}: AutocompleteTagsInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (inputValue) {
      const filtered = suggestions
        .filter((suggestion) =>
          suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
          !values.includes(suggestion)
        )
        .slice(0, 10);
      setFilteredSuggestions(filtered);
    } else {
      const filtered = suggestions
        .filter(suggestion => !values.includes(suggestion))
        .slice(0, 10);
      setFilteredSuggestions(filtered);
    }
  }, [inputValue, suggestions, values]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !values.includes(trimmedTag)) {
      if (!maxTags || values.length < maxTags) {
        onChange([...values, trimmedTag]);
        setInputValue('');
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(values.filter((tag) => tag !== tagToRemove));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setShowSuggestions(true);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredSuggestions.length) {
        addTag(filteredSuggestions[highlightedIndex]);
      } else if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && values.length > 0) {
      removeTag(values[values.length - 1]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setShowSuggestions(true);
      setHighlightedIndex((prev) =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    } else if (e.key === ',' || e.key === ';') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    }
  };

  const isMaxReached = maxTags && values.length >= maxTags;

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {maxTags && (
            <span className="text-gray-500 text-xs ml-2">
              ({values.length}/{maxTags})
            </span>
          )}
        </label>
      )}

      <div className="w-full min-h-[42px] border-2 border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-[#FF8C00] focus-within:border-[#FF8C00] transition-colors p-2">
        <div className="flex flex-wrap gap-2 items-center">
          {values.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 bg-[#FF8C00] text-white rounded-full text-sm font-medium"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {!isMaxReached && (
            <div className="relative flex-1 min-w-[120px]">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowSuggestions(true)}
                placeholder={values.length === 0 ? placeholder : ''}
                className="w-full outline-none text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {showSuggestions && filteredSuggestions.length > 0 && !isMaxReached && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => addTag(suggestion)}
              className={`w-full text-left px-4 py-2 hover:bg-[#FF8C00] hover:text-white transition-colors flex items-center gap-2 ${
                index === highlightedIndex ? 'bg-[#FF8C00] text-white' : 'text-gray-700'
              } ${index !== filteredSuggestions.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <Plus className="w-4 h-4" />
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500 mt-1">
        Appuyez sur Entrée, virgule ou point-virgule pour ajouter
      </p>
    </div>
  );
}
