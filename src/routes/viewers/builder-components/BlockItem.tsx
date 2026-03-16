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
        <div className={twMerge(
            `relative group bg-zinc-900/40 overflow-hidden transition-all shadow-xl ${["col-span-1", "col-span-2", "col-span-3", "col-span-4", "col-span-5", "col-span-6", "col-span-7", "col-span-8", "col-span-9", "col-span-10", "col-span-11", "col-span-12"][(block.colSpan || 12) - 1]}`,
            isViewerMode ? "" : `border border-zinc-800 hover:border-blue-500`
        )}>
            {/* CONTROL */}
            {isViewerMode ? null : (
                <div className={twMerge("hidden group-hover:flex absolute top-0 left-0 right-0 z-10 bg-blue-600 items-center justify-between")}>
                    <div className={twMerge("flex items-center gap-1.5", (block.colSpan || 12 < 6) && "overflow-x-scroll")}>
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

                        {/* Column Span Select */}
                        <div className="flex items-center gap-2 px-2 border-l border-white/20 ml-1">
                            <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Width</span>
                            <select
                                value={block.colSpan || 12}
                                onChange={(e) => onUpdate?.({ colSpan: parseInt(e.target.value) as any })}
                                className="bg-white/10 border border-white/20 rounded px-1 py-0.5 text-[10px] font-black text-white focus:outline-none focus:border-white/40 cursor-pointer appearance-none hover:bg-white/20"
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                                    <option key={n} value={n} className="bg-zinc-900 text-white">
                                        {n}/12
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Padding Input */}
                        <div className="flex items-center gap-2 px-2 border-l border-white/20">
                            <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Padding</span>
                            <input
                                type="number"
                                value={block.padding ?? 24}
                                onChange={(e) => onUpdate?.({ padding: parseInt(e.target.value) })}
                                className="w-10 bg-white/10 border border-white/20 rounded px-1.5 py-0.5 text-[10px] font-black text-white focus:outline-none focus:border-white/40"
                            />
                        </div>

                        <button
                            onClick={onDelete}
                            className="p-2 text-white/80 hover:text-red-200 hover:bg-red-500/20 rounded-lg transition-all"
                            title="Delete Block"
                        >
                            <FiTrash2 size={16} />
                        </button>
                    </div>
                </div>
            )}

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
                            />
                        </div>
                    </div>
                ) : null}

                <div
                    className="p-0"
                    style={{ padding: block.padding !== undefined ? `${block.padding}px` : '0px' }}
                >
                    {result?.error ? (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 m-4">
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