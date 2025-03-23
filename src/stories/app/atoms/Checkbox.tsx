import React from 'react';

interface CheckboxProps {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const Checkbox: React.FC<CheckboxProps> = ({ label, checked, onChange }) => {
  return (
    <div className="inline-flex items-center bg-button-bg">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="form-checkbox"
      />
      {label && <span className="ml-2">{label}</span>}
    </div>
  );
};

export default Checkbox;
