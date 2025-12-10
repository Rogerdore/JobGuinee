import { useState, useEffect, useRef } from 'react';
import { X, Plus, Upload as UploadIcon, AlertCircle, HelpCircle } from 'lucide-react';

interface InputProps {
  label: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  helpText?: string;
  required?: boolean;
}

export function Input({ label, type = 'text', placeholder, value, onChange, error, helpText, required }: InputProps) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {helpText && (
          <button
            type="button"
            onMouseEnter={() => setShowHelp(true)}
            onMouseLeave={() => setShowHelp(false)}
            className="text-gray-400 hover:text-gray-600 transition relative"
          >
            <HelpCircle className="w-4 h-4" />
            {showHelp && (
              <div className="absolute right-0 top-6 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg z-10">
                {helpText}
              </div>
            )}
          </button>
        )}
      </div>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent outline-none transition ${
          error ? 'border-red-500 bg-red-50' : 'border-gray-300'
        }`}
      />
      {error && (
        <div className="flex items-center gap-1 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

interface SelectProps {
  label: string;
  options: string[];
  value?: string;
  onChange?: (value: string) => void;
}

export function Select({ label, options, value, onChange }: SelectProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent outline-none transition bg-white"
      >
        <option value="">Sélectionner...</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

interface MultiSelectProps {
  label: string;
  options: string[];
  value?: string[];
  onChange?: (value: string[]) => void;
}

export function MultiSelect({ label, options, value = [], onChange }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    const newValue = value.includes(option)
      ? value.filter((v) => v !== option)
      : [...value, option];
    onChange?.(newValue);
  };

  return (
    <div className="space-y-2" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent outline-none transition bg-white text-left flex items-center justify-between"
        >
          <span className="text-gray-700">
            {value.length === 0
              ? 'Sélectionner...'
              : `${value.length} sélectionné${value.length > 1 ? 's' : ''}`
            }
          </span>
          <svg
            className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {options.map((option) => (
              <label
                key={option}
                className="flex items-center px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition"
              >
                <input
                  type="checkbox"
                  checked={value.includes(option)}
                  onChange={() => toggleOption(option)}
                  className="w-4 h-4 text-[#0E2F56] border-gray-300 rounded focus:ring-[#0E2F56] cursor-pointer"
                />
                <span className="ml-3 text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {value.map((item) => (
            <span
              key={item}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-[#0E2F56] text-white"
            >
              {item}
              <button
                type="button"
                onClick={() => toggleOption(item)}
                className="ml-2 hover:text-gray-300 transition"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

interface TextareaProps {
  label: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  rows?: number;
  error?: string;
  helpText?: string;
  required?: boolean;
}

export function Textarea({ label, placeholder, value, onChange, rows = 4, error, helpText, required }: TextareaProps) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {helpText && (
          <button
            type="button"
            onMouseEnter={() => setShowHelp(true)}
            onMouseLeave={() => setShowHelp(false)}
            className="text-gray-400 hover:text-gray-600 transition relative"
          >
            <HelpCircle className="w-4 h-4" />
            {showHelp && (
              <div className="absolute right-0 top-6 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg z-10">
                {helpText}
              </div>
            )}
          </button>
        )}
      </div>
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        rows={rows}
        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent outline-none transition resize-none ${
          error ? 'border-red-500 bg-red-50' : 'border-gray-300'
        }`}
      />
      {error && (
        <div className="flex items-center gap-1 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

interface DatePickerProps {
  label: string;
  value?: string;
  onChange?: (value: string) => void;
}

export function DatePicker({ label, value, onChange }: DatePickerProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent outline-none transition"
      />
    </div>
  );
}

interface UploadProps {
  label: string;
  onChange?: (file: File | null) => void;
  accept?: string;
  error?: string;
  helpText?: string;
}

export function Upload({ label, onChange, accept = '.pdf,.docx,.doc,.jpg,.jpeg,.png', error, helpText }: UploadProps) {
  const [fileName, setFileName] = useState<string>('');
  const [showHelp, setShowHelp] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFileName(file?.name || '');
    onChange?.(file);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        {helpText && (
          <button
            type="button"
            onMouseEnter={() => setShowHelp(true)}
            onMouseLeave={() => setShowHelp(false)}
            className="text-gray-400 hover:text-gray-600 transition relative"
          >
            <HelpCircle className="w-4 h-4" />
            {showHelp && (
              <div className="absolute right-0 top-6 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg z-10">
                {helpText}
              </div>
            )}
          </button>
        )}
      </div>
      <div className="relative">
        <input
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          id={`upload-${label}`}
        />
        <label
          htmlFor={`upload-${label}`}
          className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition ${
            error ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-[#0E2F56] hover:bg-gray-50'
          }`}
        >
          <UploadIcon className="w-5 h-5 text-gray-500" />
          <span className="text-sm text-gray-600">
            {fileName || 'Cliquer pour télécharger un fichier'}
          </span>
        </label>
      </div>
      {error && (
        <div className="flex items-center gap-1 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
      <p className="text-xs text-gray-500">Formats acceptés: PDF, Word, JPG, PNG</p>
    </div>
  );
}

interface CheckboxProps {
  label: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

export function Checkbox({ label, checked = false, onChange }: CheckboxProps) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        className="mt-1 w-5 h-5 rounded border-gray-300 text-[#0E2F56] focus:ring-[#0E2F56] cursor-pointer"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}

interface TagsInputProps {
  label: string;
  placeholder?: string;
  value?: string[];
  onChange?: (value: string[]) => void;
}

export function TagsInput({ label, placeholder, value = [], onChange }: TagsInputProps) {
  const [inputValue, setInputValue] = useState('');

  const addTag = () => {
    if (inputValue.trim() && !value.includes(inputValue.trim())) {
      onChange?.(([...value, inputValue.trim()]));
      setInputValue('');
    }
  };

  const removeTag = (tag: string) => {
    onChange?.(value.filter((t) => t !== tag));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent outline-none transition"
          />
          <button
            type="button"
            onClick={addTag}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition border border-gray-300"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        {value.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {value.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0E2F56] text-white rounded-lg text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:bg-white/20 rounded transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface RepeaterField {
  label: string;
  type: string;
  placeholder?: string;
}

interface RepeaterProps {
  label: string;
  fields: RepeaterField[];
  value?: Record<string, any>[];
  onChange?: (value: Record<string, any>[]) => void;
}

export function Repeater({ label, fields, value = [], onChange }: RepeaterProps) {
  const addItem = () => {
    const newItem: Record<string, any> = {};
    fields.forEach((field) => {
      newItem[field.label] = '';
    });
    onChange?.([...value, newItem]);
  };

  const removeItem = (index: number) => {
    onChange?.(value.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, fieldLabel: string, fieldValue: string) => {
    const newValue = [...value];
    newValue[index] = { ...newValue[index], [fieldLabel]: fieldValue };
    onChange?.(newValue);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {value.map((item, index) => (
        <div key={index} className="p-4 border-2 border-gray-200 rounded-lg space-y-3 relative">
          <button
            type="button"
            onClick={() => removeItem(index)}
            className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded transition"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
          {fields.map((field) => (
            <div key={field.label}>
              {field.type === 'textarea' ? (
                <Textarea
                  label={field.label}
                  placeholder={field.placeholder}
                  value={item[field.label] || ''}
                  onChange={(val) => updateItem(index, field.label, val)}
                />
              ) : (
                <Input
                  label={field.label}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={item[field.label] || ''}
                  onChange={(val) => updateItem(index, field.label, val)}
                />
              )}
            </div>
          ))}
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#0E2F56] hover:bg-gray-50 text-gray-600 font-medium transition flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Ajouter {label.toLowerCase()}
      </button>
    </div>
  );
}

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
}

export function FormSection({ title, children, subtitle, icon }: FormSectionProps) {
  return (
    <div className="border-2 border-gray-200 rounded-xl p-6 space-y-4">
      <div className="border-b pb-3">
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
        </div>
        {subtitle && <div className="text-sm mt-2">{subtitle}</div>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

interface ButtonProps {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
}

export function Button({ variant = 'primary', children, onClick, type = 'button' }: ButtonProps) {
  const baseClasses = 'w-full px-6 py-3 rounded-lg font-medium transition';
  const variantClasses =
    variant === 'primary'
      ? 'bg-[#0E2F56] hover:bg-[#1a4275] text-white shadow-md'
      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-2 border-gray-300';

  return (
    <button type={type} onClick={onClick} className={`${baseClasses} ${variantClasses}`}>
      {children}
    </button>
  );
}
