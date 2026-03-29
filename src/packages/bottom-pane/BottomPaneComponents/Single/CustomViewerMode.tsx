import React, { useState, useEffect, useMemo } from "react";
import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { useAppProvider } from "@src/packages/app-env";
import { useViewerContext, Viewer, ViewerBlock, ViewerContent } from "@src/context/ViewerContext";
import { FiSearch, FiEye, FiLayers, FiAlertCircle, FiCode, FiZap } from "react-icons/fi";
import { JSONTree } from "react-json-tree";
import { twMerge } from "tailwind-merge";
import { useSessionContext } from "@src/context/SessionContext";
import { invoke } from "@tauri-apps/api/core";
import { renderResult } from "@src/routes/viewers/builder-utils/renderResult";
import { BlockItem } from "@src/routes/viewers/builder-components/BlockItem";
import { Canvas } from "@src/routes/viewers/builder-components/Canvas";

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

interface CustomViewerModeProps {
    viewerId?: string;
}

export const CustomViewerMode: React.FC<CustomViewerModeProps> = ({ viewerId }) => {
    const { provider } = useAppProvider();
    const { selections } = useTrafficListContext();
    const { viewers } = useViewerContext();
    const { isReviewMode, reviewedSession } = useSessionContext();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedViewer, setSelectedViewer] = useState<Viewer | null>(null);
    const [runningViewers, setRunningViewers] = useState<Record<string, any>>({});
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (viewerId) {
            const v = viewers.find(v => v.id === viewerId);
            if (v) setSelectedViewer(v);
        } else {
            const savedId = localStorage.getItem("last-selected-custom-viewer");
            if (savedId && viewers.length > 0) {
                const v = viewers.find(v => v.id === savedId);
                if (v) setSelectedViewer(v);
            }
        }
    }, [viewers, viewerId]);

    useEffect(() => {
        if (selectedViewer && !viewerId) {
            localStorage.setItem("last-selected-custom-viewer", selectedViewer.id);
        }
    }, [selectedViewer, viewerId]);

    const trafficId = useMemo(() => selections.firstSelected?.id as string, [selections]);

    const filteredViewers = useMemo(() => {
        return viewers.filter(v => v.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [viewers, searchTerm]);

    const executeBlock = async (block: ViewerBlock) => {
        if (!trafficId) return { error: "No traffic selected" };

        const decoder = new TextDecoder();

        const normalizeHeaders = (headers: any) => {
            if (Array.isArray(headers)) {
                return headers.reduce((acc, h) => ({ ...acc, [h.key || h.name]: h.value }), {});
            }
            return headers || {};
        };

        const readRequestHeaders = async () => {
            if (!isReviewMode) {
                const data = await provider.getRequestPairData(trafficId);
                return normalizeHeaders(data?.headers);
            }
            const data: any = await invoke("get_session_request_data", { sessionId: reviewedSession?.id, trafficId });
            return normalizeHeaders(data?.headers);
        };

        const readRequestBody = async () => {
            let body: any;
            if (!isReviewMode) body = (await provider.getRequestPairData(trafficId))?.body;
            else body = await invoke("get_session_request_data", { sessionId: reviewedSession?.id, trafficId }).then((d: any) => d?.body);

            if (!body) return "";
            if (body instanceof Uint8Array || Array.isArray(body)) return decoder.decode(new Uint8Array(body));
            return body;
        };

        const readResponseHeaders = async () => {
            if (!isReviewMode) {
                const data = await provider.getResponsePairData(trafficId);
                return normalizeHeaders(data?.headers);
            }
            const data: any = await invoke("get_session_response_data", { sessionId: reviewedSession?.id, trafficId });
            return normalizeHeaders(data?.headers);
        };

        const readResponseBody = async () => {
            let body: any;
            if (!isReviewMode) body = (await provider.getResponsePairData(trafficId))?.body;
            else body = await invoke("get_session_response_data", { sessionId: reviewedSession?.id, trafficId }).then((d: any) => d?.body);

            if (!body) return "";
            if (body instanceof Uint8Array || Array.isArray(body)) return decoder.decode(new Uint8Array(body));
            return body;
        };

        try {
            const userCode = block.code.trim();
            if (!userCode) return null;

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

            const fn = new Function('readRequestHeaders', 'readRequestBody', 'readResponseHeaders', 'readResponseBody', wrappedCode);
            const data = await fn(readRequestHeaders, readRequestBody, readResponseHeaders, readResponseBody);

            if (block.type === 'html' && data && typeof data === 'object' && !data.error) {
                return `
                    <style>${block.css || ''}</style>
                    <script>window.DATA = ${JSON.stringify(data)};</script>
                    ${block.html || ''}
                `;
            }
            return data;
        } catch (e: any) {
            return { error: e.toString() };
        }
    };

    useEffect(() => {
        if (!selectedViewer || !trafficId) {
            setRunningViewers({});
            return;
        }

        const runViewer = async () => {
            setIsLoading(true);
            try {
                const content: ViewerContent = JSON.parse(selectedViewer.content);
                const results: Record<string, any> = {};

                for (const block of content.blocks) {
                    results[block.id] = await executeBlock(block);
                }

                setRunningViewers(results);
            } catch (e) {
                console.error("Failed to run viewer", e);
            } finally {
                setIsLoading(false);
            }
        };

        runViewer();
    }, [selectedViewer, trafficId, isReviewMode, reviewedSession]);

    if (!trafficId) return <Placeholder text="Select a request to apply custom viewer" />;

    return (
        <div className="h-full bg-[#0a0a0a] flex flex-col overflow-hidden">
            {/* Header / Selection - Only show if no viewerId prop is provided */}
            {!viewerId && (
                <div className="px-4 @sm:px-6 py-4 border-b border-zinc-900 flex justify-between items-center bg-[#0c0c0c] shrink-0">
                    <div className="flex items-center gap-4 flex-1">
                        <div>
                            <h2 className="text-lg font-black text-white italic tracking-tighter uppercase">Viewer Selector</h2>
                            <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Apply custom inspection logic</div>
                        </div>

                        <div className="relative flex-1 max-w-md ml-8">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                            <input
                                type="text"
                                placeholder="Search your viewers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm text-zinc-300 focus:outline-none focus:border-blue-500/50 transition-all font-medium"
                            />

                            {searchTerm && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-[#121212] border border-zinc-800 rounded-xl shadow-2xl z-[100] max-h-60 overflow-y-auto overflow-hidden custom-scrollbar animate-in fade-in slide-in-from-top-1">
                                    {filteredViewers.length > 0 ? (
                                        filteredViewers.map(v => (
                                            <button
                                                key={v.id}
                                                onClick={() => { setSelectedViewer(v); setSearchTerm(""); }}
                                                className="w-full px-4 py-3 text-left hover:bg-zinc-800 flex items-center gap-3 transition-colors border-b border-zinc-900 last:border-0"
                                            >
                                                <FiEye size={14} className="text-blue-400" />
                                                <span className="text-sm text-zinc-300 font-bold">{v.name}</span>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="px-4 py-3 text-xs text-zinc-600 italic">No custom viewers found</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {selectedViewer && (
                        <div className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2">
                            <FiEye size={14} className="text-blue-400" />
                            <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">{selectedViewer.name}</span>
                            <button
                                onClick={() => { setSelectedViewer(null); setRunningViewers({}); }}
                                className="ml-2 text-zinc-600 hover:text-red-400 transition-colors"
                            >
                                <FiZap size={14} />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Viewer Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#080808]">
                {!selectedViewer ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-30 grayscale cursor-default">
                        <FiLayers className="text-6xl text-zinc-500" />
                        <div className="text-center">
                            <div className="text-sm font-black text-zinc-400 uppercase tracking-widest">No Viewer Selected</div>
                            <div className="text-[10px] text-zinc-600 font-medium">Search and select a custom viewer above to start analysis.</div>
                        </div>
                    </div>
                ) : isLoading ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-8 h-8 @sm:w-10 @sm:h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Executing Logic Blocks...</span>
                        </div>
                    </div>
                ) : (
                    <Canvas
                        blocks={JSON.parse(selectedViewer.content).blocks}
                        testResults={runningViewers}
                        isViewerMode={true}
                    />
                )}
            </div>
        </div>
    );
};

const Placeholder = ({ text }: { text: string }) => (
    <div className="h-full flex items-center justify-center text-zinc-500 bg-[#0a0a0a]">
        <div className="text-center">
            <div className="text-5xl font-black opacity-5 mb-4 italic tracking-tighter">CUSTOM VIEWER</div>
            <div className="text-xs uppercase tracking-[0.2em] font-bold text-zinc-700">{text}</div>
        </div>
    </div>
)