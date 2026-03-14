import React, { useState } from 'react';

interface TooltipProps {
  children: React.ReactNode;
  text: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ children, text }) => {
  const [show, setShow] = useState(false);

  return (
    <div 
      className="relative flex items-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute left-full ml-3 px-2 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-wider rounded border border-zinc-800 shadow-2xl whitespace-nowrap z-[100000] animate-in fade-in slide-in-from-left-1 duration-150 pointer-events-none">
          {text}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-black -mr-1" />
        </div>
      )}
    </div>
  );
};
