import { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { useAutoComplete } from '../../hooks/useAutoComplete';

interface AutoCompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
  minChars?: number;
  disabled?: boolean;
}

export default function AutoCompleteInput({
  value,
  onChange,
  suggestions,
  placeholder,
  label,
  required,
  className = '',
  minChars = 2,
  disabled = false,
}: AutoCompleteInputProps) {
  const [localValue, setLocalValue] = useState(value);

  const {
    inputValue,
    setInputValue,
    filteredSuggestions,
    showSuggestions,
    selectedIndex,
    handleSelectSuggestion,
    handleKeyDown,
    handleBlur,
    handleFocus,
  } = useAutoComplete({ suggestions, minChars });

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalValue(value);
    if (value !== inputValue) {
      setInputValue(value);
    }
  }, [value]);

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

  const handleChange = (val: string) => {
    setLocalValue(val);
    setInputValue(val);
    onChange(val);
  };

  const handleSelect = (suggestion: string) => {
    setLocalValue(suggestion);
    handleSelectSuggestion(suggestion);
    onChange(suggestion);
    inputRef.current?.blur();
  };

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete="off"
          className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
          } ${className}`}
        />
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div
            ref={listRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto"
          >
            {filteredSuggestions.map((suggestion, index) => {
              const isSelected = index === selectedIndex;
              const isExactMatch = suggestion.toLowerCase() === inputValue.toLowerCase();

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelect(suggestion)}
                  className={`w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors flex items-center justify-between ${
                    isSelected ? 'bg-blue-100 text-blue-900' : 'text-gray-700'
                  }`}
                >
                  <span className="flex-1">{suggestion}</span>
                  {isExactMatch && (
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
      {showSuggestions && filteredSuggestions.length > 0 && (
        <p className="text-xs text-gray-500 mt-1">
          {filteredSuggestions.length} suggestion{filteredSuggestions.length > 1 ? 's' : ''} disponible{filteredSuggestions.length > 1 ? 's' : ''} • Utilisez ↑↓ pour naviguer
        </p>
      )}
    </div>
  );
}
