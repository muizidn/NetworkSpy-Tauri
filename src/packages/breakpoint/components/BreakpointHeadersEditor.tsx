import React from "react";
import { FiList, FiTrash2 } from "react-icons/fi";

interface HeaderItem {
    key: string;
    value: string;
}

interface HeadersEditorProps {
    editedHeaders: HeaderItem[];
    setEditedHeaders: React.Dispatch<React.SetStateAction<HeaderItem[]>>;
}

export const BreakpointHeadersEditor: React.FC<HeadersEditorProps> = ({ editedHeaders, setEditedHeaders }) => {
    return (
        <div className="flex-1 flex flex-col rounded-2xl overflow-hidden border border-zinc-800 bg-[#0d0d0d] shadow-2xl">
            <div className="px-6 py-3 bg-zinc-900/50 border-b border-zinc-800 flex items-center justify-between">
                <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <FiList size={12} />
                    HTTP Headers Editor
                </div>
                <button 
                    onClick={() => setEditedHeaders(prev => [...prev, { key: "", value: "" }])}
                    className="text-[9px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors"
                >
                    + Add Header
                </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-2">
                {editedHeaders.map((header, idx) => (
                    <div key={idx} className="flex items-center gap-3 group animate-in fade-in slide-in-from-left-2 duration-200">
                        <div className="flex-1 flex items-center gap-px rounded-lg overflow-hidden border border-zinc-800 focus-within:border-blue-500/50 transition-all bg-black/20">
                            <input 
                                value={header.key}
                                onChange={(e) => {
                                    const next = [...editedHeaders];
                                    next[idx].key = e.target.value;
                                    setEditedHeaders(next);
                                }}
                                placeholder="Name"
                                className="w-1/3 bg-transparent px-3 py-2 text-[11px] font-mono text-zinc-300 outline-none border-r border-zinc-800 placeholder:text-zinc-700"
                            />
                            <input 
                                value={header.value}
                                onChange={(e) => {
                                    const next = [...editedHeaders];
                                    next[idx].value = e.target.value;
                                    setEditedHeaders(next);
                                }}
                                placeholder="Value"
                                className="flex-1 bg-transparent px-3 py-2 text-[11px] font-mono text-zinc-300 outline-none placeholder:text-zinc-700"
                            />
                        </div>
                        <button 
                            onClick={() => setEditedHeaders(prev => prev.filter((_, i) => i !== idx))}
                            className="p-2 text-zinc-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <FiTrash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
