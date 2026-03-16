import { useState, useEffect, useMemo, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Viewer, ViewerBlock, ViewerContent, useViewerContext } from "@src/context/ViewerContext";
import { useTrafficListContext } from "@src/packages/main-content/context/TrafficList";
import { useSessionContext } from "@src/context/SessionContext";
import { useAppProvider } from "@src/packages/app-env";
import { getDefaultCode, getDefaultHtml, getDefaultCss } from "../builder-utils/defaults";

export const useViewerBuilderState = (initialViewer: Viewer) => {
    const { saveViewer } = useViewerContext();
    const { trafficList } = useTrafficListContext();
    const { sessions } = useSessionContext();
    const { provider } = useAppProvider();

    const [viewerName, setViewerName] = useState(initialViewer.name);
    const [isEditingName, setIsEditingName] = useState(false);

    const parsedContent: ViewerContent = useMemo(() => {
        try {
            return JSON.parse(initialViewer.content);
        } catch (e) {
            return { blocks: [] };
        }
    }, [initialViewer.content]);

    const [blocks, setBlocks] = useState<ViewerBlock[]>(parsedContent.blocks);
    const [testSource, setTestSource] = useState<'live' | 'session'>(parsedContent.previewConfig?.testSource || 'live');
    const [selectedSessionId, setSelectedSessionId] = useState<string>(parsedContent.previewConfig?.selectedSessionId || "");
    const [selectedTrafficId, setSelectedTrafficId] = useState<string>(parsedContent.previewConfig?.selectedTrafficId || "");
    const [filter, setFilter] = useState<string>(parsedContent.previewConfig?.filter || "");
    
    const [isToolboxVisible, setIsToolboxVisible] = useState(true);
    const [maximizedBlockId, setMaximizedBlockId] = useState<string | null>(null);
    const [sessionTraffic, setSessionTraffic] = useState<any[]>([]);
    const [testResults, setTestResults] = useState<Record<string, any>>({});
    const [isRunning, setIsRunning] = useState(false);
    const [isSourceDialogOpen, setIsSourceDialogOpen] = useState(false);

    useEffect(() => {
        if (testSource === 'session' && selectedSessionId) {
            invoke("get_session_traffic", { id: selectedSessionId })
                .then((data: any) => setSessionTraffic(data))
                .catch(console.error);
        } else {
            setSessionTraffic([]);
        }
    }, [testSource, selectedSessionId]);

    const runPreview = useCallback(async () => {
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
                const data = await asyncFn(readRequestHeaders, readRequestBody, readResponseHeaders, readResponseBody);

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

        for (const block of blocks) {
            results[block.id] = await executeBlock(block);
        }

        setTestResults(results);
        setIsRunning(false);
    }, [selectedTrafficId, blocks, testSource, selectedSessionId, provider]);

    useEffect(() => {
        if (selectedTrafficId && blocks.length > 0) {
            runPreview();
        }
    }, [selectedTrafficId, blocks, runPreview]);

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
    const selectedTraffic = filteredTraffic.find(t => t.id === selectedTrafficId);

    useEffect(() => {
        setViewerName(initialViewer.name);
        setBlocks(parsedContent.blocks);
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
            code: getDefaultCode(type),
            html: type === 'html' ? getDefaultHtml() : undefined,
            css: type === 'html' ? getDefaultCss() : undefined
        };
        setBlocks([...blocks, newBlock]);
    };

    const deleteBlock = (id: string) => {
        setBlocks(blocks.filter(b => b.id !== id));
    };

    const updateBlock = (id: string, updates: Partial<ViewerBlock>) => {
        setBlocks(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
    };

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

    return {
        viewerName, setViewerName,
        isEditingName, setIsEditingName,
        blocks, setBlocks,
        testSource, setTestSource,
        selectedSessionId, setSelectedSessionId,
        selectedTrafficId, setSelectedTrafficId,
        filter, setFilter,
        isToolboxVisible, setIsToolboxVisible,
        maximizedBlockId, setMaximizedBlockId,
        testResults,
        isRunning,
        isSourceDialogOpen, setIsSourceDialogOpen,
        filteredTraffic,
        currentIndex,
        selectedTraffic,
        handleSave,
        addBlock,
        deleteBlock,
        updateBlock,
        runPreview,
        goNext,
        goPrev,
        sessions
    };
};
