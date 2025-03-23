import React from 'react';

interface ButtonProps {
  label: string;
}

const Button: React.FC<ButtonProps> = ({ label }) => {
  return (
    <button
      className={`px-4 py-2 font-semibold rounded-lg shadow-md focus:outline-none bg-button-bg text-button-text`}
      onMouseEnter={(e) =>
        e.currentTarget.classList.add('hover:bg-button-hover')
      }
      onMouseLeave={(e) =>
        e.currentTarget.classList.remove('hover:bg-button-hover')
      }
    >
      {label}
    </button>
  );
};

export default Button;
