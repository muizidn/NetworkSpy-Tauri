import React, { useRef, useState, useEffect, useMemo } from "react";
import { FiCpu, FiChevronDown, FiLoader, FiCheck, FiSearch, FiX } from "react-icons/fi";
import { twMerge } from "tailwind-merge";
import { OpenRouterModel } from "./types";

interface ModelSelectorProps {
    availableModels: OpenRouterModel[];
    currentModel: string;
    onSelectModel: (modelId: string) => void;
    isFetching?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ 
    availableModels, 
    currentModel, 
    onSelectModel,
    isFetching 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        } else if (!isOpen) {
            setSearchTerm("");
        }
    }, [isOpen]);

    const selectedModel = availableModels.find(m => m.id === currentModel);

    const filteredModels = useMemo(() => {
        if (!searchTerm.trim()) return availableModels;
        const term = searchTerm.toLowerCase();
        return availableModels.filter(m => 
            m.name.toLowerCase().includes(term) || 
            m.id.toLowerCase().includes(term)
        );
    }, [availableModels, searchTerm]);

    return (
        <div className="px-4 py-2 bg-[#0d0d0f] border-b border-zinc-900 flex items-center justify-between">
            <div className="relative flex-1" ref={dropdownRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-800/50 rounded-lg transition-all w-full group"
                >
                    <div className="w-5 h-5 rounded bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-blue-400 transition-colors">
                        <FiCpu size={10} />
                    </div>
                    <div className="flex flex-col items-start flex-1 min-w-0">
                        <span className="text-[7px] font-bold text-zinc-600 uppercase tracking-widest">Active Model</span>
                        <span className="text-[10px] font-bold text-zinc-300 truncate w-full text-left">
                            {selectedModel?.name || currentModel || "Select Model"}
                        </span>
                    </div>
                    <FiChevronDown className={twMerge("text-zinc-600 transition-transform duration-200", isOpen && "rotate-180")} size={12} />
                </button>

                {isOpen && (
                    <div className="absolute top-full left-0 mt-2 w-full max-h-[440px] bg-[#121214] border border-zinc-800 rounded-xl shadow-2xl z-[60] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 origin-top">
                        <div className="p-3 border-b border-zinc-800 bg-zinc-900/50 space-y-2">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[9px] font-black text-zinc-500 px-1 uppercase tracking-tight">Select Model</span>
                                {isFetching && <FiLoader size={10} className="text-blue-500 animate-spin mr-1" />}
                            </div>
                            <div className="relative group">
                                <FiSearch size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search models..."
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-8 py-1.5 text-[10px] text-white placeholder:text-zinc-700 outline-none focus:border-blue-500/50 transition-all"
                                />
                                {searchTerm && (
                                    <button 
                                        onClick={() => setSearchTerm("")}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
                                    >
                                        <FiX size={10} />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="overflow-y-auto custom-scrollbar flex-1">
                            {filteredModels.length === 0 && (
                                <div className="p-8 text-center flex flex-col items-center gap-2">
                                    <FiSearch size={20} className="text-zinc-800" />
                                    <div className="text-zinc-600 text-[9px] font-bold">No models found for "{searchTerm}"</div>
                                </div>
                            )}
                            {filteredModels.map((model) => (
                                <button
                                    key={model.id}
                                    onClick={() => {
                                        onSelectModel(model.id);
                                        setIsOpen(false);
                                    }}
                                    className={twMerge(
                                        "w-full px-4 py-2.5 flex flex-col items-start hover:bg-blue-600/10 transition-colors border-b border-zinc-800/50 last:border-0 text-left",
                                        currentModel === model.id ? "bg-blue-600/5" : ""
                                    )}
                                >
                                    <div className="flex items-center gap-2 w-full">
                                        <span className={twMerge(
                                            "text-[10px] font-bold flex-1 truncate",
                                            currentModel === model.id ? "text-blue-400" : "text-zinc-300"
                                        )}>
                                            {model.name}
                                        </span>
                                        {currentModel === model.id && <FiCheck size={10} className="text-blue-500" />}
                                    </div>
                                    {model.id && (
                                        <span className="text-[8px] font-mono text-zinc-600 mt-0.5 truncate w-full">
                                            {model.id}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
