import React, { useState } from "react";
import { FiDatabase, FiSettings, FiChevronLeft, FiChevronRight, FiPlay, FiPlus, FiEdit2, FiLayers, FiGlobe, FiChevronDown } from "react-icons/fi";
import { twMerge } from "tailwind-merge";
import { ToolboxButton } from "./ToolboxButton";
import { ViewerBlock, ViewerMatcher } from "@src/context/ViewerContext";

interface ToolboxProps {
    isVisible: boolean;
    maximizedBlockId: string | null;
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
    isVisible, maximizedBlockId, addBlock, matchers, setMatchers
}) => {
    if (!isVisible || maximizedBlockId) return null;

    return (
        <div className="w-72 border-l border-zinc-900 bg-[#0a0a0a] flex flex-col shrink-0 animate-in slide-in-from-right duration-300">
            <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
                
                <div>
                    <h3 className="text-[10px] font-black tracking-tight text-zinc-500 mb-4 flex items-center gap-2">
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
                    <h3 className="text-[10px] font-black tracking-tight text-zinc-500 mb-4 flex items-center gap-2">
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
