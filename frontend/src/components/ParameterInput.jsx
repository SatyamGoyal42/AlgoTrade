import React from 'react';

/**
 * Flexible parameter input component that handles different parameter types
 * Supports: text, number, select, checkbox, textarea, date, email, url, range
 */
export default function ParameterInput({ param, value, onChange, className = '' }) {
  const {
    type = 'text',
    label,
    description,
    default: defaultValue,
    options = [],
    min,
    max,
    step,
    placeholder,
    required = false,
    disabled = false,
  } = param;

  const inputValue = value !== undefined && value !== null ? value : (defaultValue || '');

  const baseInputClasses = `input-xp w-full px-4 py-2 ${className}`;

  const renderInput = () => {
    switch (type) {
      case 'select':
        if (!options || options.length === 0) {
          return (
            <div className="text-sm text-red-600">
              Error: Select type requires options
            </div>
          );
        }
        return (
          <select
            value={inputValue}
            onChange={(e) => onChange(e.target.value)}
            className={baseInputClasses}
            required={required}
            disabled={disabled}
          >
            {!required && <option value="">-- Select --</option>}
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={inputValue === true || inputValue === 'true'}
              onChange={(e) => onChange(e.target.checked)}
              className="h-4 w-4 border-2 border-black"
              required={required}
              disabled={disabled}
            />
            <span className="ml-2 text-sm text-black">
              {description || label}
            </span>
          </div>
        );

      case 'textarea':
        return (
          <textarea
            value={inputValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`${baseInputClasses} min-h-[100px] resize-y`}
            required={required}
            disabled={disabled}
            rows={4}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={inputValue}
            onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder={placeholder}
            min={min}
            max={max}
            step={step}
            className={baseInputClasses}
            required={required}
            disabled={disabled}
          />
        );

      case 'range':
        return (
          <div>
            <input
              type="range"
              value={inputValue}
              onChange={(e) => onChange(Number(e.target.value))}
              min={min || 0}
              max={max || 100}
              step={step || 1}
              className="w-full"
              disabled={disabled}
            />
            <div className="text-sm text-black mt-1 text-center font-bold">
              {inputValue} {param.unit || ''}
            </div>
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            value={inputValue}
            onChange={(e) => onChange(e.target.value)}
            className={baseInputClasses}
            required={required}
            disabled={disabled}
          />
        );

      case 'datetime-local':
        return (
          <input
            type="datetime-local"
            value={inputValue}
            onChange={(e) => onChange(e.target.value)}
            className={baseInputClasses}
            required={required}
            disabled={disabled}
          />
        );

      case 'email':
        return (
          <input
            type="email"
            value={inputValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={baseInputClasses}
            required={required}
            disabled={disabled}
          />
        );

      case 'url':
        return (
          <input
            type="url"
            value={inputValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || 'https://example.com'}
            className={baseInputClasses}
            required={required}
            disabled={disabled}
          />
        );

      case 'text':
      default:
        return (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={baseInputClasses}
            required={required}
            disabled={disabled}
          />
        );
    }
  };

  // For checkbox, label is handled inside the input component
  if (type === 'checkbox') {
    return renderInput();
  }

  return (
    <div>
      <label className="block text-sm font-bold text-black mb-2">
        {label}
        {required && <span className="text-black ml-1">*</span>}
        {description && (
          <span className="text-xs text-black ml-2 font-normal">({description})</span>
        )}
      </label>
      {renderInput()}
    </div>
  );
}

