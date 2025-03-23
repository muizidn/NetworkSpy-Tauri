import React from 'react';

interface DropdownProps {
  options: string[];
  selectedOption: string;
  onChange: (option: string) => void;
}

const Dropdown: React.FC<DropdownProps> = ({ options, selectedOption, onChange }) => {
  return (
    <select
      value={selectedOption}
      onChange={(e) => onChange(e.target.value)}
      className="dropdown"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
};

export default Dropdown;
