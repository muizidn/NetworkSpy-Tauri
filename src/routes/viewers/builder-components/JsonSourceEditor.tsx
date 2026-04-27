import React, { useState, useEffect } from "react";
import { MonacoEditor } from "@src/packages/ui/MonacoEditor";
import { ViewerBlock, ViewerMatcher } from "@src/context/ViewerContext";
import { FiAlertCircle, FiCheck, FiInfo, FiRefreshCw } from "react-icons/fi";
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
                        <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Raw JSON Definition</h4>
                        <p className="text-[9px] text-zinc-600 font-bold uppercase mt-1">Directly edit the viewer structure (blocks & matchers)</p>
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
                        className="flex items-center gap-2 px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-white rounded-lg text-[9px] font-black uppercase transition-all border border-zinc-800"
                        disabled={!isDirty}
                    >
                        <FiRefreshCw size={12} />
                        Reset
                    </button>

                    <button
                        onClick={handleApply}
                        className={twMerge(
                            "flex items-center gap-2 px-6 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all border shadow-lg",
                            isDirty 
                                ? "bg-blue-600 border-blue-500 text-white hover:bg-blue-500" 
                                : "bg-zinc-800 border-zinc-700 text-zinc-500 opacity-50 cursor-not-allowed"
                        )}
                        disabled={!isDirty}
                    >
                        <FiCheck size={12} />
                        Apply Changes
                    </button>
                </div>
            </div>

            <div className="flex-1">
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
        </div>
    );
};
