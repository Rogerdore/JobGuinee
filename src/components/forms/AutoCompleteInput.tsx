import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { Check } from 'lucide-react';

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

const AutoCompleteInput = memo(function AutoCompleteInput({
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
  const [internalValue, setInternalValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const initialValueRef = useRef(value);

  useEffect(() => {
    if (initialValueRef.current !== value) {
      setInternalValue(value);
      initialValueRef.current = value;
    }
  }, [value]);

  const filteredSuggestions = internalValue.length >= minChars
    ? suggestions.filter(s => s.toLowerCase().includes(internalValue.toLowerCase())).slice(0, 10)
    : [];

  useEffect(() => {
    setShowSuggestions(filteredSuggestions.length > 0 && internalValue.length >= minChars);
    setSelectedIndex(-1);
  }, [internalValue, filteredSuggestions.length, minChars]);

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

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    onChange(newValue);
    initialValueRef.current = newValue;
  }, [onChange]);

  const handleSelectSuggestion = useCallback((suggestion: string) => {
    setInternalValue(suggestion);
    onChange(suggestion);
    initialValueRef.current = suggestion;
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredSuggestions.length) {
          handleSelectSuggestion(filteredSuggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
      case 'Tab':
        if (selectedIndex >= 0 && selectedIndex < filteredSuggestions.length) {
          e.preventDefault();
          handleSelectSuggestion(filteredSuggestions[selectedIndex]);
        }
        break;
    }
  }, [showSuggestions, filteredSuggestions, selectedIndex, handleSelectSuggestion]);

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 200);
  }, []);

  const handleFocus = useCallback(() => {
    if (internalValue.length >= minChars && filteredSuggestions.length > 0) {
      setShowSuggestions(true);
    }
  }, [internalValue, minChars, filteredSuggestions.length]);

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
          value={internalValue}
          onChange={handleInputChange}
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
              const isExactMatch = suggestion.toLowerCase() === internalValue.toLowerCase();

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelectSuggestion(suggestion)}
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
}, (prevProps, nextProps) => {
  return prevProps.value === nextProps.value &&
         prevProps.placeholder === nextProps.placeholder &&
         prevProps.label === nextProps.label &&
         prevProps.required === nextProps.required &&
         prevProps.disabled === nextProps.disabled;
});

export default AutoCompleteInput;
