import React from "react";
import { twMerge } from "tailwind-merge";

interface ToolboxButtonProps {
    icon: React.ElementType;
    label: string;
    onClick: () => void;
    color: string;
}

export const ToolboxButton = ({ icon: Icon, label, onClick, color }: ToolboxButtonProps) => (
    <button 
        onClick={onClick}
        className="flex flex-col items-center justify-center p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:bg-zinc-800 hover:border-zinc-700 hover:scale-[1.02] transition-all group active:scale-95"
    >
        <Icon size={20} className={twMerge("mb-2 group-hover:scale-110 transition-transform", color)} />
        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-zinc-300">{label}</span>
    </button>
);
