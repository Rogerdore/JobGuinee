import { useState, useEffect, useCallback, useMemo } from 'react';

interface UseAutoCompleteOptions {
  suggestions: string[];
  minChars?: number;
  maxSuggestions?: number;
  caseSensitive?: boolean;
}

export function useAutoComplete({
  suggestions,
  minChars = 2,
  maxSuggestions = 10,
  caseSensitive = false,
}: UseAutoCompleteOptions) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const filteredSuggestions = useMemo(() => {
    if (inputValue.length < minChars) {
      return [];
    }

    const searchValue = caseSensitive ? inputValue : inputValue.toLowerCase();

    return suggestions
      .filter((suggestion) => {
        const suggestionValue = caseSensitive ? suggestion : suggestion.toLowerCase();
        return suggestionValue.includes(searchValue);
      })
      .slice(0, maxSuggestions);
  }, [inputValue, suggestions, minChars, maxSuggestions, caseSensitive]);

  useEffect(() => {
    setShowSuggestions(filteredSuggestions.length > 0 && inputValue.length >= minChars);
    setSelectedIndex(-1);
  }, [filteredSuggestions, inputValue, minChars]);

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  const handleSelectSuggestion = useCallback((suggestion: string) => {
    setInputValue(suggestion);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
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
    },
    [showSuggestions, filteredSuggestions, selectedIndex, handleSelectSuggestion]
  );

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 200);
  }, []);

  const handleFocus = useCallback(() => {
    if (inputValue.length >= minChars && filteredSuggestions.length > 0) {
      setShowSuggestions(true);
    }
  }, [inputValue, minChars, filteredSuggestions]);

  return {
    inputValue,
    setInputValue: handleInputChange,
    filteredSuggestions,
    showSuggestions,
    selectedIndex,
    handleSelectSuggestion,
    handleKeyDown,
    handleBlur,
    handleFocus,
  };
}
