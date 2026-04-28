import React from "react";
import { twMerge } from "tailwind-merge";
import { MonacoEditor } from "@src/packages/ui/MonacoEditor";
import { ViewerBlock } from "@src/context/ViewerContext";
import { FiZap } from "react-icons/fi";

interface BlockEditorViewProps {
    block: ViewerBlock;
    result?: any;
    isMaximized: boolean;
    activeTab: 'js' | 'html' | 'css' | 'output';
    setActiveTab: (tab: 'js' | 'html' | 'css' | 'output') => void;
    onUpdate?: (updates: Partial<ViewerBlock>) => void;
}



const TabItem = ({ id, label, active, onClick, color, borderColor }: { id: string, label: string, active: boolean, onClick: () => void, color: string, borderColor: string }) => (
    <button
        onClick={onClick}
        className={twMerge(
            "text-[9px] font-bold pb-1 border-b-2 transition-all",
            active ? twMerge(color, borderColor) : "text-zinc-600 border-transparent hover:text-zinc-400"
        )}
    >
        {label}
    </button>
);

export const BlockEditorView = ({
    block,
    result,
    isMaximized,
    activeTab,
    setActiveTab,
    onUpdate
}: BlockEditorViewProps) => {   // ✅ FIX: close props + add type

    const editorRef = React.useRef<any>(null);

    const handleFormat = () => {
        editorRef.current?.getAction('editor.action.formatDocument')?.run();
    };

    return (
        <div
            className={twMerge(
                "animate-in fade-in slide-in-from-top-1 duration-200 border-b border-zinc-800 flex flex-col",
                (block.colSpan >= 8 || isMaximized)
                    ? "order-1 border-b-0 h-full min-h-[500px]"
                    : "order-2"
            )}
        >
            <div className="px-5 py-2 flex items-center justify-between bg-black/40 border-b border-zinc-800/50">
                <div className="flex items-center gap-6">
                    {block.type === 'html' ? (
                        <div className="flex gap-4">
                            <TabItem id="html" label="Markup (HTML)" active={activeTab === 'html'} onClick={() => setActiveTab('html')} color="text-pink-500" borderColor="border-pink-500" />
                            <TabItem id="css" label="Styles (CSS)" active={activeTab === 'css'} onClick={() => setActiveTab('css')} color="text-purple-500" borderColor="border-purple-500" />
                            <TabItem id="js" label="Logic (JS)" active={activeTab === 'js'} onClick={() => setActiveTab('js')} color="text-blue-500" borderColor="border-blue-500" />
                            <TabItem id="output" label="Output (RAW)" active={activeTab === 'output'} onClick={() => setActiveTab('output')} color="text-amber-500" borderColor="border-amber-500" />
                        </div>
                    ) : (
                        <div className="flex gap-4">
                            <TabItem id="js" label="Logic (JS)" active={activeTab === 'js'} onClick={() => setActiveTab('js')} color="text-blue-500" borderColor="border-blue-500" />
                            {result && (
                                <TabItem id="output" label="Output (RAW)" active={activeTab === 'output'} onClick={() => setActiveTab('output')} color="text-amber-500" borderColor="border-amber-500" />
                            )}
                        </div>
                    )}

                    {activeTab !== 'output' && (
                        <button
                            onClick={handleFormat}
                            className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded transition-all border border-blue-500/20 group/format"
                            title="Format Code"
                        >
                            <FiZap size={10} className="group-hover/format:scale-125 transition-transform" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Format</span>
                        </button>
                    )}
                </div>

                <div className="text-[8px] text-zinc-700 font-bold tracking-wider">
                    {activeTab === 'js'
                        ? 'Host Context'
                        : activeTab === 'html'
                            ? 'IFrame Source'
                            : 'IFrame Styles'}
                </div>
            </div>

            <div className="flex-1 min-h-[400px] border-y border-zinc-800/50">
                <MonacoEditor
                    height="100%"
                    onMount={(ed) => (editorRef.current = ed)}
                    language={
                        activeTab === 'js'
                            ? 'javascript'
                            : activeTab === 'html'
                                ? 'html'
                                : activeTab === 'css'
                                    ? 'css'
                                    : block.type === 'html'
                                        ? 'html'
                                        : 'json'
                    }
                    theme="vs-dark"
                    options={{
                        readOnly: activeTab === 'output',
                        minimap: { enabled: false },
                        fontSize: 11,
                    }}
                    value={
                        activeTab === 'js'
                            ? block.code
                            : activeTab === 'html'
                                ? block.html || ""
                                : activeTab === 'css'
                                    ? block.css || ""
                                    : typeof result === 'object'
                                        ? JSON.stringify(result, null, 2)
                                        : String(result || "")
                    }
                    onChange={(val) => {
                        if (activeTab === 'js') onUpdate?.({ code: val || "" });
                        else if (activeTab === 'html') onUpdate?.({ html: val || "" });
                        else if (activeTab === 'css') onUpdate?.({ css: val || "" });
                    }}
                />
            </div>
        </div>
    );
};