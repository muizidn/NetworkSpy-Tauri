import React, { useState } from "react";
import { FiMaximize, FiCode, FiTrash2, FiAlertCircle } from "react-icons/fi";
import { twMerge } from "tailwind-merge";
import Editor from "@monaco-editor/react";
import { ViewerBlock } from "@src/context/ViewerContext";
import { renderResult } from "../builder-utils/renderResult";

interface BlockItemProps {
    block: ViewerBlock;
    result?: any;
    isViewerMode?: boolean;
    onDelete?: () => void;
    onUpdate?: (updates: Partial<ViewerBlock>) => void;
    onMaximize?: () => void;
}

export const BlockItem = ({ block, result, onDelete, onUpdate, onMaximize, isViewerMode = false }: BlockItemProps) => {
    const [isEditingCode, setIsEditingCode] = useState(false);
    const [activeTab, setActiveTab] = useState<'js' | 'html' | 'css'>('js');

    return (
        <div className={twMerge("group bg-zinc-900/40 border border-zinc-800 overflow-hidden transition-all shadow-xl", isViewerMode ? "col-span-12" : "hover:border-blue-500")}>
            {isViewerMode ? null : <div className={twMerge("hidden group-hover:flex px-5 py-3 bg-blue-600 items-center justify-between")}>
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={onMaximize}
                        className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                        title="Focus Mode"
                    >
                        <FiMaximize size={16} />
                    </button>

                    <button
                        onClick={() => setIsEditingCode(!isEditingCode)}
                        className={twMerge(
                            "p-2 rounded-lg transition-all",
                            isEditingCode
                                ? "bg-white text-blue-600 shadow-lg"
                                : "text-white/80 hover:text-white hover:bg-white/10"
                        )}
                        title="Edit Logic Script"
                    >
                        <FiCode size={16} />
                    </button>

                    <button
                        onClick={onDelete}
                        className="p-2 text-white/80 hover:text-red-200 hover:bg-red-500/20 rounded-lg transition-all"
                        title="Delete Block"
                    >
                        <FiTrash2 size={16} />
                    </button>
                </div>
            </div>}

            <div className="p-0">
                {!isViewerMode && isEditingCode ? (
                    <div className="animate-in fade-in slide-in-from-top-1 duration-200 border-b border-zinc-800">
                        <div className="px-5 py-2 flex items-center justify-between bg-black/40 border-b border-zinc-800/50">
                            {block.type === 'html' ? (
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setActiveTab('js')}
                                        className={twMerge("text-[9px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all", activeTab === 'js' ? "text-blue-500 border-blue-500" : "text-zinc-600 border-transparent hover:text-zinc-400")}
                                    >
                                        Logic (JS)
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('html')}
                                        className={twMerge("text-[9px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all", activeTab === 'html' ? "text-pink-500 border-pink-500" : "text-zinc-600 border-transparent hover:text-zinc-400")}
                                    >
                                        Markup (HTML)
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('css')}
                                        className={twMerge("text-[9px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all", activeTab === 'css' ? "text-purple-500 border-purple-500" : "text-zinc-600 border-transparent hover:text-zinc-400")}
                                    >
                                        Styles (CSS)
                                    </button>
                                </div>
                            ) : (
                                <label className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">Logic Script (Async JavaScript)</label>
                            )}
                            <div className="text-[8px] text-zinc-700 font-bold uppercase tracking-wider">
                                {activeTab === 'js' ? 'Host Context' : activeTab === 'html' ? 'IFrame Source' : 'IFrame Styles'}
                            </div>
                        </div>
                        <div className="h-[350px] border-y border-zinc-800/50">
                            <Editor
                                height="100%"
                                language={activeTab === 'js' ? 'javascript' : activeTab === 'html' ? 'html' : 'css'}
                                theme="vs-dark"
                                value={activeTab === 'js' ? block.code : activeTab === 'html' ? (block.html || "") : (block.css || "")}
                                onChange={(val) => {
                                    if (activeTab === 'js') onUpdate?.({ code: val || "" });
                                    else if (activeTab === 'html') onUpdate?.({ html: val || "" });
                                    else onUpdate?.({ css: val || "" });
                                }}
                            // ... rest of your Monaco config remains the same
                            />
                        </div>
                    </div>
                ) : null}

                <div className="p-6">
                    {result?.error ? (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                            <FiAlertCircle className="text-red-400 shrink-0 mt-0.5" />
                            <div>
                                <div className="text-red-400 font-bold text-xs mb-1 uppercase tracking-tight">Execution Error</div>
                                <div className="text-[11px] font-mono text-zinc-500 whitespace-pre-wrap">{result.error}</div>
                            </div>
                        </div>
                    ) : (
                        renderResult(block.type, result)
                    )}
                </div>
            </div>
        </div>
    );
};