import { title } from "process";
import React from "react";
import { twMerge } from "tailwind-merge";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  title?: string;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  className,
  ...rest
}) => {
  return (
    <button {...rest} className={twMerge("btn btn-primary", className)}>
      {title}
    </button>
  );
};
