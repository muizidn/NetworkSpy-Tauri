import React, { useState } from "react";
import { FiMinimize } from "react-icons/fi";
import { twMerge } from "tailwind-merge";
import { MonacoEditor } from "@src/packages/ui/MonacoEditor";
import { ViewerBlock } from "@src/context/ViewerContext";
import { renderResult } from "../builder-utils/renderResult";

interface MaximizedBlockProps {
    block: ViewerBlock;
    result?: any;
    onClose: () => void;
    onUpdate: (updates: Partial<ViewerBlock>) => void;
}

export const MaximizedBlock = ({ block, result, onClose, onUpdate }: MaximizedBlockProps) => {
    const [activeTab, setActiveTab] = useState<'js' | 'html' | 'css' | 'preview'>('js');

    return (
        <div className="absolute inset-0 bg-[#080808] z-50 flex flex-col pt-4 overflow-hidden">
            <div className="px-8 py-4 bg-zinc-900/40 border-b border-zinc-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest bg-black/40 px-2 py-0.5 rounded border border-zinc-800">{block.type}</span>
                        <input 
                            value={block.title}
                            onChange={(e) => onUpdate({ title: e.target.value })}
                            className="bg-transparent border-none focus:outline-none text-lg font-black text-white hover:text-blue-400 transition-colors w-96"
                        />
                    </div>

                    <div className="flex bg-black/40 p-1 rounded-xl border border-zinc-800">
                        <TabButton id="js" label="Logic (JS)" active={activeTab === 'js'} onClick={() => setActiveTab('js')} color="text-blue-500" />
                        {block.type === 'html' && (
                            <>
                                <TabButton id="html" label="Markup (HTML)" active={activeTab === 'html'} onClick={() => setActiveTab('html')} color="text-pink-500" />
                                <TabButton id="css" label="Styles (CSS)" active={activeTab === 'css'} onClick={() => setActiveTab('css')} color="text-purple-500" />
                            </>
                        )}
                        <div className="w-px h-4 bg-zinc-800 mx-1 my-auto"></div>
                        <TabButton id="preview" label="Preview Output" active={activeTab === 'preview'} onClick={() => setActiveTab('preview')} color="text-green-500" />
                    </div>
                </div>
                
                <button 
                    onClick={onClose}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                    <FiMinimize size={14} />
                    EXIT FOCUS
                </button>
            </div>

            <div className="flex-1 relative overflow-hidden">
                {activeTab === 'preview' ? (
                    <div className="absolute inset-0 p-12 overflow-y-auto bg-black/40 animate-in fade-in zoom-in-95 duration-300">
                        <div className="max-w-5xl mx-auto h-full flex flex-col">
                            <div className="flex items-center justify-between mb-8 shrink-0">
                                <div>
                                    <h3 className="text-xl font-black text-white uppercase">Result Preview</h3>
                                    <p className="text-xs text-zinc-500 mt-1">Real-time output based on selected test context</p>
                                </div>
                            </div>
                            <div className="flex-1">
                                {renderResult(block, result)}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="absolute inset-0 animate-in fade-in duration-300">
                        <MonacoEditor
                            height="100%"
                            language={activeTab === 'js' ? 'javascript' : activeTab === 'html' ? 'html' : 'css'}
                            theme="vs-dark"
                            value={activeTab === 'js' ? block.code : activeTab === 'html' ? (block.html || "") : (block.css || "")}
                            onChange={(val) => {
                                if (activeTab === 'js') onUpdate({ code: val || "" });
                                else if (activeTab === 'html') onUpdate({ html: val || "" });
                                else onUpdate({ css: val || "" });
                            }}
                            options={{
                                minimap: { enabled: true },
                                fontSize: 14,
                                lineNumbers: 'on',
                                padding: { top: 20 },
                                fontFamily: 'JetBrains Mono, monospace',
                                suggestOnTriggerCharacters: true,
                                quickSuggestions: true,
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

interface TabButtonProps {
    id: string;
    label: string;
    active: boolean;
    onClick: () => void;
    color: string;
}

const TabButton = ({ id, label, active, onClick, color }: TabButtonProps) => (
    <button 
        onClick={onClick}
        className={twMerge(
            "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
            active ? twMerge("bg-zinc-800 shadow-xl", color) : "text-zinc-600 hover:text-zinc-400"
        )}
    >
        {label}
    </button>
);
