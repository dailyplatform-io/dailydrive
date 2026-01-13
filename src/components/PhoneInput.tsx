import React, { useState, useRef, useEffect, useMemo } from 'react';
import { phoneDialCodes, PhoneDialCode } from '../data/phoneDialCodes';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  selectedDialCode: string;
  onDialCodeChange: (dialCode: string) => void;
  placeholder?: string;
  required?: boolean;
}

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const findDialCodeFromValue = (dialCode: string): PhoneDialCode => {
  const match = phoneDialCodes.find((entry) => entry.dialCode === dialCode);
  return match ?? phoneDialCodes[0]; // Default to first country if not found
};

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  selectedDialCode,
  onDialCodeChange,
  placeholder = 'Phone number',
  required = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCountry = findDialCodeFromValue(selectedDialCode);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isOpen) return;
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return;
      setIsOpen(false);
      setSearchTerm('');
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const filteredDialCodes = useMemo(() => {
    const normalizedSearch = normalizeText(searchTerm.trim());
    const numericSearch = searchTerm.replace(/[^\d]/g, '');

    if (!normalizedSearch && !numericSearch) {
      return phoneDialCodes;
    }

    return phoneDialCodes.filter((entry) => {
      const normalizedCountry = normalizeText(entry.country);
      const normalizedLabel = normalizeText(entry.label);
      const normalizedIso = entry.iso.toLowerCase();
      const normalizedCode = entry.code.replace(/[^\d]/g, '');

      return (
        (normalizedSearch && (normalizedCountry.includes(normalizedSearch) || normalizedLabel.includes(normalizedSearch))) ||
        (normalizedSearch && normalizedIso.includes(normalizedSearch)) ||
        (numericSearch && normalizedCode.includes(numericSearch))
      );
    });
  }, [searchTerm]);

  const handleDialCodeSelect = (code: PhoneDialCode) => {
    onDialCodeChange(code.dialCode);
    setIsOpen(false);
    setSearchTerm('');
  };

  const toggleDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove any non-numeric characters
    const numericValue = e.target.value.replace(/[^\d]/g, '');
    onChange(numericValue);
  };

  return (
    <div className="phone-input-container" ref={containerRef}>
      <div className="phone-input-wrapper">
        {/* Dial Code Dropdown */}
        <div className="phone-input-code-section">
          <button
            type="button"
            onClick={toggleDropdown}
            className="phone-input-code-button"
          >
            <span className="phone-input-code-number">+{selectedCountry?.code || selectedDialCode}</span>
            <span className="phone-input-code-iso">{selectedCountry?.iso}</span>
            <svg
              className="phone-input-chevron"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown */}
          {isOpen && (
            <div ref={dropdownRef} className="phone-input-dropdown">
              {/* Search input */}
              <input
                autoFocus
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search country or code"
                className="phone-input-search"
              />

              {/* Country list */}
              <div className="phone-input-options">
                {filteredDialCodes.map((code) => (
                  <button
                    key={`${code.iso}-${code.dialCode}`}
                    type="button"
                    onClick={() => handleDialCodeSelect(code)}
                    className={`phone-input-option ${code.dialCode === selectedDialCode ? 'selected' : ''}`}
                  >
                    <div className="phone-input-option-main">
                      +{code.code}{' '}
                      <span className="phone-input-option-iso">{code.iso}</span>
                    </div>
                    <div className="phone-input-option-country">{code.country}</div>
                  </button>
                ))}

                {filteredDialCodes.length === 0 && (
                  <div className="phone-input-no-results">
                    No matches found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Phone Number Input */}
        <input
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={handlePhoneChange}
          placeholder={placeholder}
          required={required}
          className="phone-input-number"
        />
      </div>
    </div>
  );
};