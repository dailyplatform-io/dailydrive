import React from 'react';

interface FieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}

export const Field: React.FC<FieldProps> = ({ label, error, children }) => {
  return (
    <label className="owner-field">
      <span>{label}</span>
      {children}
      {error && <p className="owner-field__error">{error}</p>}
    </label>
  );
};

export default Field;
