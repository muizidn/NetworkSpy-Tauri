import React, { useState, useEffect } from "react";
import { MonacoEditor } from "@src/packages/ui/MonacoEditor";
import { ViewerBlock, ViewerMatcher } from "@src/context/ViewerContext";
import { FiAlertCircle, FiCheck, FiInfo, FiRefreshCw, FiZap } from "react-icons/fi";
import { twMerge } from "tailwind-merge";

interface JsonSourceEditorProps {
    blocks: ViewerBlock[];
    matchers: ViewerMatcher[];
    previewConfig: any;
    onUpdate: (data: { blocks: ViewerBlock[], matchers: ViewerMatcher[] }) => void;
}

export const JsonSourceEditor: React.FC<JsonSourceEditorProps> = ({
    blocks, matchers, previewConfig, onUpdate
}) => {
    const initialJson = JSON.stringify({ blocks, matchers, previewConfig }, null, 2);
    const [code, setCode] = useState(initialJson);
    const [error, setError] = useState<string | null>(null);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        setCode(initialJson);
        setIsDirty(false);
        setError(null);
    }, [blocks, matchers]);

    const handleApply = () => {
        try {
            const parsed = JSON.parse(code);
            if (!Array.isArray(parsed.blocks)) {
                throw new Error("Invalid format: 'blocks' must be an array.");
            }
            onUpdate({ 
                blocks: parsed.blocks, 
                matchers: parsed.matchers || [] 
            });
            setError(null);
            setIsDirty(false);
        } catch (e: any) {
            setError(e.message);
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-[#080808] animate-in fade-in duration-300">
            <div className="px-8 py-4 bg-[#0a0a0c] border-b border-zinc-900 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                    <FiInfo className="text-blue-500/50" size={16} />
                    <div>
                        <h4 className="text-[10px] font-black text-zinc-400 tracking-tight leading-none">Raw JSON definition</h4>
                        <p className="text-[9px] text-zinc-600 font-bold mt-1">Directly edit the viewer structure</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {error && (
                        <div className="flex items-center gap-2 text-rose-500 text-[10px] font-bold bg-rose-500/5 px-3 py-1.5 rounded border border-rose-500/20">
                            <FiAlertCircle size={12} />
                            {error}
                        </div>
                    )}
                    
                    <button
                        onClick={() => setCode(initialJson)}
                        className="flex items-center gap-2 px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-white rounded-lg text-[9px] font-black transition-all border border-zinc-800"
                        disabled={!isDirty}
                    >
                        <FiRefreshCw size={12} />
                        Reset
                    </button>

                    <button
                        onClick={handleApply}
                        className={twMerge(
                            "flex items-center gap-2 px-6 py-1.5 rounded-lg text-[9px] font-black transition-all border shadow-lg",
                            isDirty 
                                ? "bg-blue-600 border-blue-500 text-white hover:bg-blue-500" 
                                : "bg-zinc-800 border-zinc-700 text-zinc-500 opacity-50 cursor-not-allowed"
                        )}
                        disabled={!isDirty}
                    >
                        <FiCheck size={12} />
                        Apply changes
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 relative">
                    <MonacoEditor
                        theme="vs-dark"
                        language="json"
                        options={{
                            minimap: { enabled: true },
                            fontSize: 12,
                            lineNumbers: "on",
                            wordWrap: "on",
                            padding: { top: 20, bottom: 20 },
                            formatOnPaste: true,
                            formatOnType: true
                        }}
                        value={code}
                        onChange={(val) => {
                            setCode(val || "");
                            setIsDirty(val !== initialJson);
                        }}
                    />
                </div>

                <div className="w-80 bg-[#0c0c0e] border-l border-zinc-900 overflow-y-auto p-6 no-scrollbar shrink-0">
                    <div className="flex items-center gap-2 mb-6">
                        <FiInfo className="text-zinc-500" size={14} />
                        <h3 className="text-[10px] font-black text-white tracking-tight">Editing guide</h3>
                    </div>

                    <div className="space-y-8">
                        <section>
                            <div className="text-[9px] font-black text-zinc-500 tracking-tight mb-3 border-b border-zinc-800 pb-2">
                                JSON Schema
                            </div>
                            <pre className="text-[10px] font-mono text-zinc-400 bg-black/40 p-3 rounded border border-zinc-800/50 leading-relaxed whitespace-pre-wrap">
{`{
  "id": "string",
  "type": "html" | "json",
  "title": "string",
  "code": "js code",
  "colSpan": 1-12
}`}
                            </pre>
                        </section>

                        <section>
                            <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3 border-b border-zinc-800 pb-2 flex items-center gap-2">
                                <FiZap className="text-blue-500" size={10} />
                                <span>AI Assistance</span>
                            </div>
                            <p className="text-[10px] text-zinc-600 leading-relaxed">
                                Use the <span className="text-white font-bold">AI Assistant</span> button in the header to open the chat sidebar. It can generate these blocks for you and inject them directly into this JSON.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};
