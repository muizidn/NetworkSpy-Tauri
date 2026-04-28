import React, { useState } from "react";
import { FiDatabase, FiSettings, FiChevronLeft, FiChevronRight, FiPlay, FiPlus, FiEdit2, FiLayers, FiGlobe, FiChevronDown } from "react-icons/fi";
import { twMerge } from "tailwind-merge";
import { ToolboxButton } from "./ToolboxButton";
import { ViewerBlock, ViewerMatcher } from "@src/context/ViewerContext";

interface ToolboxProps {
    isVisible: boolean;
    maximizedBlockId: string | null;
    selectedTraffic: any | null;
    testSource: 'live' | 'session';
    setIsSourceDialogOpen: (open: boolean) => void;
    goPrev: () => void;
    goNext: () => void;
    currentIndex: number;
    totalTraffic: number;
    runPreview: () => void;
    isRunning: boolean;
    addBlock: (type: ViewerBlock['type']) => void;
    matchers: ViewerMatcher[];
    setMatchers: (matchers: ViewerMatcher[]) => void;
}

const EditorInfo: React.FC = () => {
    const [isCollapsed, setIsCollapsed] = useState(true);

    return (
        <div className="p-4 border-t border-zinc-900">
            <div className="bg-blue-600/5 border border-blue-500/20 rounded-xl overflow-hidden">
                <button 
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="w-full p-4 flex items-center justify-between hover:bg-blue-500/5 transition-colors group"
                >
                    <h4 className="text-[10px] font-black uppercase text-blue-400">Editor Info</h4>
                    {isCollapsed ? (
                        <FiChevronRight size={12} className="text-zinc-600 group-hover:text-blue-400 transition-colors" />
                    ) : (
                        <FiChevronDown size={12} className="text-zinc-600 group-hover:text-blue-400 transition-colors" />
                    )}
                </button>
                
                {!isCollapsed && (
                    <div className="px-4 pb-4 text-[10px] text-zinc-500 leading-relaxed space-y-3">
                        <p>Strictly use <code className="text-zinc-300">async function code()</code> as the entry point.</p>

                        <div className="space-y-1">
                            <div className="text-zinc-600 font-bold uppercase text-[9px]">Available (Async):</div>
                            <ul className="space-y-0.5 text-zinc-400 font-mono text-[9px]">
                                <li>• readRequestHeaders()</li>
                                <li>• readRequestBody()</li>
                                <li>• readResponseHeaders()</li>
                                <li>• readResponseBody()</li>
                            </ul>
                        </div>
                        <p className="text-[9px] bg-orange-500/10 text-orange-400 p-2 rounded border border-orange-500/20">
                            <FiGlobe className="inline mr-1" /> Libraries: Use CDN tags!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export const Toolbox: React.FC<ToolboxProps> = ({
    isVisible, maximizedBlockId, selectedTraffic, testSource,
    setIsSourceDialogOpen, goPrev, goNext, currentIndex, totalTraffic,
    runPreview, isRunning, addBlock, matchers, setMatchers
}) => {
    if (!isVisible || maximizedBlockId) return null;

    return (
        <div className="w-72 border-l border-zinc-900 bg-[#0a0a0a] flex flex-col shrink-0 animate-in slide-in-from-right duration-300">
            <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
                {/* Test Data Source Selector */}
                <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        Test Context
                    </h3>

                    {!selectedTraffic ? (
                        <button
                            onClick={() => setIsSourceDialogOpen(true)}
                            className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-800 rounded-2xl text-zinc-600 hover:border-blue-500/50 hover:text-blue-400 transition-all group"
                        >
                            <FiDatabase size={24} className="mb-2 opacity-20 group-hover:opacity-100 transition-opacity" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Set Data Source</span>
                        </button>
                    ) : (
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={twMerge(
                                        "w-2 h-2 rounded-full",
                                        testSource === 'live' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                                    )}></div>
                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-tight">
                                        {testSource === 'live' ? 'Live Stream' : 'Session DB'}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setIsSourceDialogOpen(true)}
                                    className="p-1.5 text-zinc-600 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
                                    title="Change Data Source"
                                >
                                    <FiSettings size={14} />
                                </button>
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <span className={twMerge(
                                        "px-1.5 py-0.5 rounded text-[9px] font-black uppercase shrink-0",
                                        selectedTraffic.method === 'GET' ? "bg-green-500/10 text-green-500" :
                                            selectedTraffic.method === 'POST' ? "bg-blue-500/10 text-blue-500" : "bg-zinc-800 text-zinc-400"
                                    )}>
                                        {selectedTraffic.method}
                                    </span>
                                    <span className="text-[11px] font-medium text-zinc-400 truncate font-mono">
                                        {selectedTraffic.uri || selectedTraffic.url}
                                    </span>
                                </div>
                                <div className="text-[9px] font-mono text-zinc-600 truncate">
                                    ID: {selectedTraffic.id}
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={goPrev}
                                    disabled={currentIndex <= 0}
                                    className="flex-1 flex items-center justify-center py-2 bg-zinc-800/50 hover:bg-zinc-700 rounded-lg text-zinc-400 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                                >
                                    <FiChevronLeft size={16} />
                                </button>
                                <div className="px-3 text-[10px] font-bold text-zinc-600 font-mono">
                                    {currentIndex + 1} / {totalTraffic}
                                </div>
                                <button
                                    onClick={goNext}
                                    disabled={currentIndex >= totalTraffic - 1}
                                    className="flex-1 flex items-center justify-center py-2 bg-zinc-800/50 hover:bg-zinc-700 rounded-lg text-zinc-400 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                                >
                                    <FiChevronRight size={16} />
                                </button>
                            </div>

                            <button
                                onClick={runPreview}
                                disabled={isRunning}
                                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2"
                            >
                                {isRunning ? (
                                    <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <FiPlay size={12} className="fill-current" />
                                )}
                                {isRunning ? "Testing..." : "Run Preview"}
                            </button>
                        </div>
                    )}
                </div>

                <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                        <FiPlus className="text-blue-500" />
                        Add UI Blocks
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                        <ToolboxButton icon={FiEdit2} label="Text" onClick={() => addBlock('text')} color="text-blue-400" />
                        <ToolboxButton icon={FiLayers} label="JSON" onClick={() => addBlock('json')} color="text-orange-400" />
                        <ToolboxButton icon={FiLayers} label="Headers" onClick={() => addBlock('headers')} color="text-purple-400" />
                        <ToolboxButton icon={FiLayers} label="Table" onClick={() => addBlock('table')} color="text-green-400" />
                        <ToolboxButton icon={FiGlobe} label="HTML" onClick={() => addBlock('html')} color="text-pink-400" />
                    </div>
                </div>

                <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                        <FiSettings className="text-yellow-500" />
                        Auto-Matchers ({matchers.length})
                    </h3>
                    
                    <div className="space-y-3 mb-3">
                        {matchers.map((matcher, index) => (
                            <div key={index} className="bg-zinc-900/50 border border-zinc-800 p-2 rounded relative group">
                                <button
                                    onClick={() => setMatchers(matchers.filter((_, i) => i !== index))}
                                    className="absolute -top-2 -right-2 bg-red-500/20 text-red-400 rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    &times;
                                </button>
                                
                                {matcher.glob !== undefined ? (
                                    <div>
                                        <div className="text-[9px] text-zinc-600 mb-1">Glob pattern (URL)</div>
                                        <input
                                            className="w-full bg-black/50 border border-zinc-800 text-zinc-300 text-[10px] p-1.5 rounded outline-none focus:border-yellow-500"
                                            value={matcher.glob}
                                            onChange={e => {
                                                const newMatchers = [...matchers];
                                                newMatchers[index].glob = e.target.value;
                                                setMatchers(newMatchers);
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <div className="text-[9px] text-zinc-600 mb-1">JS Function (`traffic`)</div>
                                        <textarea
                                            className="w-full h-16 bg-black/50 border border-zinc-800 text-zinc-300 text-[10px] p-1.5 rounded font-mono outline-none focus:border-yellow-500 text-xs custom-scrollbar"
                                            value={matcher.js || ""}
                                            spellCheck={false}
                                            onChange={e => {
                                                const newMatchers = [...matchers];
                                                newMatchers[index].js = e.target.value;
                                                setMatchers(newMatchers);
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    
                    <div className="flex gap-2">
                        <button
                            onClick={() => setMatchers([...matchers, { glob: "*/api/*" }])}
                            className="bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 text-zinc-400 text-[9px] px-2 py-1 rounded"
                        >
                            + Glob
                        </button>
                        <button
                            onClick={() => setMatchers([...matchers, { js: "return true;" }])}
                            className="bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 text-zinc-400 text-[9px] px-2 py-1 rounded"
                        >
                            + JS Filter
                        </button>
                    </div>
                </div>
            </div>

            <EditorInfo />
        </div>
    );
};
