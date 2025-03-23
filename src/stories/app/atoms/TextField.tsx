import React from "react";

interface TextFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const TextField: React.FC<TextFieldProps> = ({
  value,
  onChange,
  placeholder,
}) => {
  return (
    <input
      type="text"
      className="p-2 rounded outline-none w-full bg-gray-100 border border-gray-400 text-black"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
};

export default TextField;
