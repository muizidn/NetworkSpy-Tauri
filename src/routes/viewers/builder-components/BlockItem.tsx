import React, { useState } from "react";
import { FiMaximize, FiCode, FiTrash2, FiAlertCircle } from "react-icons/fi";
import { twMerge } from "tailwind-merge";
import Editor from "@monaco-editor/react";
import { ViewerBlock } from "@src/context/ViewerContext";
import { renderResult } from "../builder-utils/renderResult";

interface BlockItemProps {
    block: ViewerBlock;
    result?: any;
    onDelete: () => void;
    onUpdate: (updates: Partial<ViewerBlock>) => void;
    onMaximize: () => void;
}

export const BlockItem = ({ block, result, onDelete, onUpdate, onMaximize }: BlockItemProps) => {
    const [isEditingCode, setIsEditingCode] = useState(false);
    const [activeTab, setActiveTab] = useState<'js' | 'html' | 'css'>('js');

    return (
        <div className="group bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden group hover:border-zinc-700/50 transition-all shadow-xl">
            <div className="hidden group-hover:flex px-5 py-3 bg-zinc-900/60 border-b border-zinc-800 items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={onMaximize}
                        className="p-2 text-zinc-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
                        title="Focus Mode"
                    >
                        <FiMaximize size={16} />
                    </button>
                    <button
                        onClick={() => setIsEditingCode(!isEditingCode)}
                        className={twMerge("p-2 rounded-lg transition-all", isEditingCode ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-zinc-500 hover:text-blue-400 hover:bg-blue-400/10")}
                        title="Edit Logic Script"
                    >
                        <FiCode size={16} />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                        <FiTrash2 size={16} />
                    </button>
                </div>
            </div>

            <div className="p-0">
                {isEditingCode ? (
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
                                    if (activeTab === 'js') onUpdate({ code: val || "" });
                                    else if (activeTab === 'html') onUpdate({ html: val || "" });
                                    else onUpdate({ css: val || "" });
                                }}
                                onMount={(editor, monaco) => {
                                    if (activeTab !== 'js') return;
                                    const ts = monaco.languages.typescript;

                                    // Set compiler options for JavaScript
                                    (ts as any).javascriptDefaults.setCompilerOptions({
                                        target: (ts as any).ScriptTarget.ESNext,
                                        allowNonTsExtensions: true,
                                    });

                                    // Add custom library for IntelliSense
                                    const libSource = `
                                        /**
                                         * Fetches the request headers of the currently selected traffic.
                                         * @returns {Promise<Record<string, string>>}
                                         */
                                        declare function readRequestHeaders(): Promise<Record<string, string>>;

                                        /**
                                         * Fetches the raw body of the request.
                                         * @returns {Promise<string>}
                                         */
                                        declare function readRequestBody(): Promise<string>;

                                        /**
                                         * Fetches the response headers.
                                         * @returns {Promise<Record<string, string>>}
                                         */
                                        declare function readResponseHeaders(): Promise<Record<string, string>>;

                                        /**
                                         * Fetches the raw body of the response.
                                         * @returns {Promise<string>}
                                         */
                                        declare function readResponseBody(): Promise<string>;

                                        /**
                                         * Main entry point. Must be named 'code' and be async.
                                         */
                                        declare function code(): Promise<any>;
                                    `;

                                    const libUri = 'ts:filename/extra.d.ts';
                                    (ts as any).javascriptDefaults.addExtraLib(libSource, libUri);
                                }}
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 12,
                                    lineNumbers: 'on',
                                    scrollBeyondLastLine: false,
                                    padding: { top: 12, bottom: 12 },
                                    fontFamily: 'JetBrains Mono, Menlo, Monaco, Courier New, monospace',
                                    suggestOnTriggerCharacters: true,
                                    quickSuggestions: true,
                                    wordBasedSuggestions: "currentDocument",
                                }}
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
