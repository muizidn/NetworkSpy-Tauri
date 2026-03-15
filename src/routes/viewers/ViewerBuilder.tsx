import React, { useState, useEffect, useMemo } from "react";
import { FiPlus, FiTrash2, FiCode, FiLayers, FiPlay, FiSave, FiEdit2, FiCheck, FiX, FiAlertCircle, FiSearch, FiChevronLeft, FiChevronRight, FiDatabase, FiSettings } from "react-icons/fi";
import { twMerge } from "tailwind-merge";
import { Viewer, ViewerBlock, ViewerContent, useViewerContext } from "@src/context/ViewerContext";
import { ToolBaseHeader } from "@src/packages/ui/ToolBaseHeader";
import Editor from "@monaco-editor/react";
import { useTrafficListContext } from "@src/packages/main-content/context/TrafficList";
import { useSessionContext } from "@src/context/SessionContext";
import { useAppProvider } from "@src/packages/app-env";
import { invoke } from "@tauri-apps/api/core";
import { JSONTree } from "react-json-tree";

const theme = {
    scheme: 'monokai',
    author: 'wimer hazenberg (http://www.monokai.nl)',
    base00: 'transparent',
    base01: '#383830',
    base02: '#49483e',
    base03: '#75715e',
    base04: '#a59f85',
    base05: '#f8f8f2',
    base06: '#f5f4f1',
    base07: '#f9f8f5',
    base08: '#f92672',
    base09: '#fd971f',
    base0A: '#f4bf75',
    base0B: '#a6e22e',
    base0C: '#a1efe4',
    base0D: '#66d9ef',
    base0E: '#ae81ff',
    base0F: '#cc6633',
};

interface ViewerBuilderProps {
    viewer: Viewer;
}

const ViewerBuilder: React.FC<ViewerBuilderProps> = ({ viewer: initialViewer }) => {
    const { saveViewer } = useViewerContext();
    const [viewerName, setViewerName] = useState(initialViewer.name);
    const [isEditingName, setIsEditingName] = useState(false);
    
    // Parse content
    const parsedContent: ViewerContent = useMemo(() => {
        try {
            return JSON.parse(initialViewer.content);
        } catch (e) {
            return { blocks: [] };
        }
    }, [initialViewer.content]);

    const [blocks, setBlocks] = useState<ViewerBlock[]>(parsedContent.blocks);
    
    // Test Data States (Restore from previewConfig if exists)
    const { trafficList } = useTrafficListContext();
    const { sessions } = useSessionContext();
    const { provider } = useAppProvider();
    
    const [testSource, setTestSource] = useState<'live' | 'session'>(parsedContent.previewConfig?.testSource || 'live');
    const [selectedSessionId, setSelectedSessionId] = useState<string>(parsedContent.previewConfig?.selectedSessionId || "");
    const [selectedTrafficId, setSelectedTrafficId] = useState<string>(parsedContent.previewConfig?.selectedTrafficId || "");
    const [filter, setFilter] = useState<string>(parsedContent.previewConfig?.filter || "");
    const [isSourceDialogOpen, setIsSourceDialogOpen] = useState(false);
    
    const [sessionTraffic, setSessionTraffic] = useState<any[]>([]);
    const [testResults, setTestResults] = useState<Record<string, any>>({});
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        if (testSource === 'session' && selectedSessionId) {
            invoke("get_session_traffic", { id: selectedSessionId })
                .then((data: any) => setSessionTraffic(data))
                .catch(console.error);
        } else {
            setSessionTraffic([]);
        }
    }, [testSource, selectedSessionId]);

    const runPreview = async () => {
        if (!selectedTrafficId) return;
        setIsRunning(true);
        const results: Record<string, any> = {};

        const decoder = new TextDecoder();

        const normalizeHeaders = (headers: any) => {
            if (Array.isArray(headers)) {
                return headers.reduce((acc, h) => ({ ...acc, [h.key || h.name]: h.value }), {});
            }
            return headers || {};
        };

        const executeBlock = async (block: ViewerBlock) => {
            const userCode = block.code.trim();
            if (!userCode) return null;

            const readRequestHeaders = async () => {
                if (testSource === 'live') {
                    const data = await provider.getRequestPairData(selectedTrafficId);
                    return normalizeHeaders(data?.headers);
                }
                const data: any = await invoke("get_session_request_data", { sessionId: selectedSessionId, trafficId: selectedTrafficId });
                return normalizeHeaders(data?.headers);
            };

            const readRequestBody = async () => {
                let body: any;
                if (testSource === 'live') body = (await provider.getRequestPairData(selectedTrafficId))?.body;
                else body = await invoke("get_session_request_data", { sessionId: selectedSessionId, trafficId: selectedTrafficId }).then((d: any) => d?.body);
                
                if (!body) return "";
                if (body instanceof Uint8Array || Array.isArray(body)) return decoder.decode(new Uint8Array(body));
                return body;
            };

            const readResponseHeaders = async () => {
                if (testSource === 'live') {
                    const data = await provider.getResponsePairData(selectedTrafficId);
                    return normalizeHeaders(data?.headers);
                }
                const data: any = await invoke("get_session_response_data", { sessionId: selectedSessionId, trafficId: selectedTrafficId });
                return normalizeHeaders(data?.headers);
            };

            const readResponseBody = async () => {
                let body: any;
                if (testSource === 'live') body = (await provider.getResponsePairData(selectedTrafficId))?.body;
                else body = await invoke("get_session_response_data", { sessionId: selectedSessionId, trafficId: selectedTrafficId }).then((d: any) => d?.body);
                
                if (!body) return "";
                if (body instanceof Uint8Array || Array.isArray(body)) return decoder.decode(new Uint8Array(body));
                return body;
            };

            try {
                // Strictly expect a named function 'code' to be defined in user script
                const finalCode = `${userCode}\nreturn await code();`;

                const wrappedCode = `
                    return (async () => {
                        try {
                            ${finalCode}
                        } catch (e) {
                            return { error: e.toString() };
                        }
                    })()
                `;
                
                const asyncFn = new Function('readRequestHeaders', 'readRequestBody', 'readResponseHeaders', 'readResponseBody', wrappedCode);
                return await asyncFn(readRequestHeaders, readRequestBody, readResponseHeaders, readResponseBody);
            } catch (e: any) {
                return { error: e.toString() };
            }
        };

        for (const block of blocks) {
            results[block.id] = await executeBlock(block);
        }

        setTestResults(results);
        setIsRunning(false);
    };

    useEffect(() => {
        if (selectedTrafficId && blocks.length > 0) {
            runPreview();
        }
    }, [selectedTrafficId, blocks]);

    // Derived filtered list
    const currentDataSource = testSource === 'live' ? trafficList : sessionTraffic;
    const filteredTraffic = useMemo(() => {
        if (!filter.trim()) return currentDataSource;
        const lowFilter = filter.toLowerCase();
        return currentDataSource.filter((t: any) => 
            (t.method || "").toLowerCase().includes(lowFilter) || 
            (t.uri || t.url || "").toLowerCase().includes(lowFilter) ||
            t.id.includes(lowFilter)
        );
    }, [currentDataSource, filter]);

    const currentIndex = filteredTraffic.findIndex(t => t.id === selectedTrafficId);
    
    const goNext = () => {
        if (currentIndex < filteredTraffic.length - 1) {
            setSelectedTrafficId(filteredTraffic[currentIndex + 1].id);
        }
    };

    const goPrev = () => {
        if (currentIndex > 0) {
            setSelectedTrafficId(filteredTraffic[currentIndex - 1].id);
        }
    };

    const selectedTraffic = filteredTraffic.find(t => t.id === selectedTrafficId);

    useEffect(() => {
        setViewerName(initialViewer.name);
        setBlocks(parsedContent.blocks);
        // Sync test states too
        setTestSource(parsedContent.previewConfig?.testSource || 'live');
        setSelectedSessionId(parsedContent.previewConfig?.selectedSessionId || "");
        setSelectedTrafficId(parsedContent.previewConfig?.selectedTrafficId || "");
        setFilter(parsedContent.previewConfig?.filter || "");
    }, [initialViewer, parsedContent]);

    const handleSave = async () => {
        const content: ViewerContent = { 
            blocks,
            previewConfig: {
                testSource,
                selectedSessionId,
                filter,
                selectedTrafficId
            }
        };
        await saveViewer(viewerName, JSON.stringify(content), initialViewer.id, initialViewer.folderId);
        alert("Viewer saved successfully!");
    };

    const addBlock = (type: ViewerBlock['type']) => {
        const newBlock: ViewerBlock = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            title: `New ${type.toUpperCase()} Block`,
            code: getDefaultCode(type)
        };
        setBlocks([...blocks, newBlock]);
    };

    const deleteBlock = (id: string) => {
        setBlocks(blocks.filter(b => b.id !== id));
    };

    const updateBlock = (id: string, updates: Partial<ViewerBlock>) => {
        setBlocks(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
    };

    return (
        <div className="flex flex-col h-full bg-[#050505]">
            <ToolBaseHeader 
                title={
                    <div className="flex items-center gap-2">
                        {isEditingName ? (
                            <div className="flex items-center gap-2">
                                <input 
                                    autoFocus
                                    value={viewerName}
                                    onChange={(e) => setViewerName(e.target.value)}
                                    className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm font-bold text-white focus:outline-none focus:border-blue-500"
                                    onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                                />
                                <button onClick={() => setIsEditingName(false)} className="text-green-500"><FiCheck size={16}/></button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 group">
                                <span>{viewerName}</span>
                                <button onClick={() => setIsEditingName(true)} className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-blue-400 transition-all">
                                    <FiEdit2 size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                }
                description="Build custom UI view for network traffic"
                icon={<FiLayers size={22} />}
                actions={
                    <button 
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-blue-500/20"
                    >
                        <FiSave />
                        SAVE VIEWER
                    </button>
                }
            />

            <div className="flex-1 flex overflow-hidden">
                {/* Canvas Area */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
                    <div className="max-w-4xl mx-auto space-y-6 pb-20">
                        {blocks.length === 0 ? (
                            <div className="border-2 border-dashed border-zinc-800 rounded-2xl p-20 flex flex-col items-center justify-center text-zinc-600">
                                <FiLayers size={48} className="mb-4 opacity-20" />
                                <p className="text-sm font-medium">Your canvas is empty</p>
                                <p className="text-xs mt-1">Add blocks from the right panel to start building</p>
                            </div>
                        ) : (
                            blocks.map((block) => (
                                <BlockItem 
                                    key={block.id} 
                                    block={block} 
                                    result={testResults[block.id]}
                                    onDelete={() => deleteBlock(block.id)}
                                    onUpdate={(updates) => updateBlock(block.id, updates)}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Toolbox Area */}
                <div className="w-80 border-l border-zinc-900 bg-[#080808] flex flex-col overflow-hidden">
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
                                            {currentIndex + 1} / {filteredTraffic.length}
                                        </div>
                                        <button 
                                            onClick={goNext}
                                            disabled={currentIndex >= filteredTraffic.length - 1}
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
                                <ToolboxButton icon={FiCode} label="JSON" onClick={() => addBlock('json')} color="text-orange-400" />
                                <ToolboxButton icon={FiLayers} label="Headers" onClick={() => addBlock('headers')} color="text-purple-400" />
                                <ToolboxButton icon={FiLayers} label="Table" onClick={() => addBlock('table')} color="text-green-400" />
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-zinc-900">
                        <div className="bg-blue-600/5 border border-blue-500/20 rounded-xl p-4">
                            <h4 className="text-[10px] font-black uppercase text-blue-400 mb-2">Editor Info</h4>
                            <div className="text-[10px] text-zinc-500 leading-relaxed space-y-3">
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

                                <div className="p-2 bg-black/40 rounded border border-zinc-800 font-mono text-[9px] text-zinc-400 leading-normal">
                                    <div className="text-blue-400 mb-1">// Standard Template</div>
                                    <span className="text-orange-400">async function</span> <span className="text-blue-400">code</span>() &#123;<br/>
                                    &nbsp;&nbsp;<span className="text-orange-400">const</span> h = <span className="text-blue-400">await</span> readRequestHeaders();<br/>
                                    &nbsp;&nbsp;<span className="text-orange-400">return</span> h[<span className="text-green-400">'host'</span>];<br/>
                                    &#125;
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Source Selection Dialog */}
            {isSourceDialogOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsSourceDialogOpen(false)}></div>
                    <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-900 rounded-3xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-8 py-6 border-b border-zinc-900 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-black text-white uppercase tracking-tight">Set Preview Context</h2>
                                <p className="text-xs text-zinc-500 mt-1">Select the traffic data you want to use for viewer testing</p>
                            </div>
                            <button onClick={() => setIsSourceDialogOpen(false)} className="p-2 hover:bg-zinc-900 rounded-xl transition-colors">
                                <FiX size={20} className="text-zinc-500" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-hidden flex flex-col p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest pl-1">Source Type</label>
                                    <div className="flex bg-zinc-900 p-1 rounded-2xl border border-zinc-800">
                                        <button 
                                            onClick={() => { setTestSource('live'); setSelectedTrafficId(""); }}
                                            className={twMerge(
                                                "flex-1 py-3 rounded-xl text-xs font-bold transition-all",
                                                testSource === 'live' ? "bg-zinc-800 text-white shadow-xl shadow-black/50" : "text-zinc-500 hover:text-zinc-300"
                                            )}
                                        >
                                            Live Stream
                                        </button>
                                        <button 
                                            onClick={() => { setTestSource('session'); setSelectedTrafficId(""); }}
                                            className={twMerge(
                                                "flex-1 py-3 rounded-xl text-xs font-bold transition-all",
                                                testSource === 'session' ? "bg-zinc-800 text-white shadow-xl shadow-black/50" : "text-zinc-500 hover:text-zinc-300"
                                            )}
                                        >
                                            Saved Session
                                        </button>
                                    </div>
                                </div>

                                {testSource === 'session' && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest pl-1">Target Session</label>
                                        <select 
                                            value={selectedSessionId}
                                            onChange={(e) => { setSelectedSessionId(e.target.value); setSelectedTrafficId(""); }}
                                            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-xs text-zinc-300 focus:outline-none focus:border-blue-500/50 appearance-none"
                                        >
                                            <option value="">-- Choose Session --</option>
                                            {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 overflow-hidden flex flex-col space-y-4">
                                <div className="relative">
                                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                                    <input 
                                        placeholder="Filter traffic items by method, URI, or ID..."
                                        value={filter}
                                        onChange={(e) => setFilter(e.target.value)}
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-11 pr-4 py-4 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-blue-500/50 transition-all"
                                    />
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar border border-zinc-900 rounded-2xl bg-black/40">
                                    {filteredTraffic.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center p-12 text-zinc-700">
                                            <FiAlertCircle size={32} className="mb-3 opacity-20" />
                                            <p className="text-sm font-medium">No matches found</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-zinc-900">
                                            {filteredTraffic.map((t: any) => (
                                                <button 
                                                    key={t.id}
                                                    onClick={() => { setSelectedTrafficId(t.id); setIsSourceDialogOpen(false); }}
                                                    className={twMerge(
                                                        "w-full px-6 py-4 flex items-center justify-between text-left hover:bg-zinc-900/50 transition-all",
                                                        selectedTrafficId === t.id ? "bg-blue-600/5" : ""
                                                    )}
                                                >
                                                    <div className="flex items-center gap-4 min-w-0">
                                                        <span className={twMerge(
                                                            "w-12 h-6 flex items-center justify-center rounded text-[10px] font-black uppercase shrink-0",
                                                            t.method === 'GET' ? "bg-green-500/10 text-green-500 border border-green-500/20" :
                                                            t.method === 'POST' ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" : 
                                                            "bg-zinc-800 text-zinc-400 border border-zinc-700/50"
                                                        )}>
                                                            {t.method}
                                                        </span>
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-medium text-zinc-200 truncate font-mono">{t.uri || t.url}</div>
                                                            <div className="text-[10px] text-zinc-600 mt-0.5 truncate uppercase tracking-widest font-black">ID: {t.id}</div>
                                                        </div>
                                                    </div>
                                                    {selectedTrafficId === t.id && (
                                                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/40">
                                                            <FiCheck size={14} className="text-white" />
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="px-8 py-6 border-t border-zinc-900 bg-zinc-900/20 flex items-center justify-between">
                            <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">
                                {filteredTraffic.length} Items Available
                            </span>
                            <button 
                                onClick={() => setIsSourceDialogOpen(false)}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all"
                            >
                                CLOSE
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const BlockItem = ({ block, result, onDelete, onUpdate }: { block: ViewerBlock, result?: any, onDelete: () => void, onUpdate: (updates: Partial<ViewerBlock>) => void }) => {
    const [isEditingCode, setIsEditingCode] = useState(false);

    return (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden group hover:border-zinc-700/50 transition-all shadow-xl">
            <div className="px-5 py-3 bg-zinc-900/60 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest bg-black/40 px-2 py-0.5 rounded border border-zinc-800">{block.type}</span>
                    <input 
                        value={block.title}
                        onChange={(e) => onUpdate({ title: e.target.value })}
                        className="bg-transparent border-none focus:outline-none text-sm font-bold text-zinc-200 w-64"
                    />
                </div>
                <div className="flex items-center gap-1.5">
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
                        <div className="px-5 py-2 flex items-center justify-between bg-black/40">
                            <label className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">Logic Script (Async JavaScript)</label>
                        </div>
                        <div className="h-[300px] border-y border-zinc-800/50">
                            <Editor
                                height="100%"
                                defaultLanguage="javascript"
                                theme="vs-dark"
                                value={block.code}
                                onChange={(val) => onUpdate({ code: val || "" })}
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 12,
                                    lineNumbers: 'on',
                                    scrollBeyondLastLine: false,
                                    padding: { top: 12, bottom: 12 },
                                    fontFamily: 'JetBrains Mono, Menlo, Monaco, Courier New, monospace',
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

const renderResult = (type: ViewerBlock['type'], data: any) => {
    if (data === undefined || data === null) {
        return (
            <div className="h-20 flex flex-col items-center justify-center border border-dashed border-zinc-800/50 rounded-2xl bg-zinc-950/30">
                <FiPlay size={18} className="text-zinc-700 mb-1" />
                <span className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em]">Ready for Preview</span>
                <p className="text-[8px] text-zinc-700 mt-1">Select a traffic item from the right to run</p>
            </div>
        );
    }

    switch (type) {
        case 'text':
            return <div className="text-zinc-300 font-medium text-sm leading-relaxed">{String(data)}</div>;
        case 'json':
        case 'headers':
            return (
                <div className="bg-black/20 rounded-2xl p-5 border border-zinc-800/50">
                    <JSONTree 
                        data={data} 
                        theme={theme}
                        invertTheme={false} 
                        hideRoot={true}
                        labelRenderer={(keyPath: ReadonlyArray<string | number>) => <span className="text-zinc-500 font-mono text-xs font-bold">{keyPath[0]}:</span>}
                        valueRenderer={(val: any) => <span className="text-orange-400 font-mono text-xs">{String(val)}</span>}
                    />
                </div>
            );
        case 'table':
            if (!Array.isArray(data)) return <div className="text-red-400 text-xs">Table block expected an array of objects.</div>;
            const keys = data.length > 0 ? Object.keys(data[0]) : [];
            return (
                <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-black/20">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-800/40">
                                {keys.map(k => (
                                    <th key={k} className="px-5 py-3 text-[10px] font-black uppercase text-zinc-500 tracking-wider border-b border-zinc-800">{k}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, i) => (
                                <tr key={i} className="hover:bg-zinc-800/30 transition-colors">
                                    {keys.map(k => (
                                        <td key={k} className="px-5 py-3 border-b border-zinc-800/30 text-xs text-zinc-400 font-mono">{String(row[k])}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        default:
            return <pre className="text-xs text-zinc-400 font-mono whitespace-pre-wrap bg-black/40 p-5 rounded-2xl border border-zinc-800">{JSON.stringify(data, null, 2)}</pre>;
    }
};

const ToolboxButton = ({ icon: Icon, label, onClick, color }: { icon: any, label: string, onClick: () => void, color: string }) => (
    <button 
        onClick={onClick}
        className="flex flex-col items-center justify-center p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:bg-zinc-800 hover:border-zinc-700 hover:scale-[1.02] transition-all group active:scale-95"
    >
        <Icon size={20} className={twMerge("mb-2 group-hover:scale-110 transition-transform", color)} />
        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-zinc-300">{label}</span>
    </button>
);

const getDefaultCode = (type: ViewerBlock['type']) => {
    switch (type) {
        case 'text':
            return `async function code() {\n  const headers = await readRequestHeaders();\n  return "Content-Type: " + (headers['content-type'] || 'unknown');\n}`;
        case 'json':
            return `async function code() {\n  const body = await readRequestBody();\n  try {\n    return JSON.parse(body);\n  } catch (e) {\n    return { error: "Not a valid JSON" };\n  }\n}`;
        case 'headers':
            return `async function code() {\n  return await readResponseHeaders();\n}`;
        case 'table':
            return `async function code() {\n  // Return an array of objects for table view\n  return [\n    { key: "Method", value: "GET" },\n    { key: "Status", value: 200 }\n  ];\n}`;
        default:
            return `async function code() {\n  return "Hello World";\n}`;
    }
};

export default ViewerBuilder;
