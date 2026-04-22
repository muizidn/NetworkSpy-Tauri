import { OnMount } from "@monaco-editor/react";
import { useEffect, useMemo, useState } from "react";
import { FiSearch, FiFile, FiTag, FiDatabase, FiEye, FiDownload } from "react-icons/fi";
import { useAppProvider } from "../../../app-env";
import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { HexView } from "../../TabRenderer/HexView";
import { MonacoEditor } from "@src/packages/ui/MonacoEditor";

interface MultipartPart {
    name: string;
    filename: string;
    contentType: string;
    value: Uint8Array;
    size: number;
}

export const MultipartFormDataMode = () => {
    const { selections } = useTrafficListContext();
    const { provider } = useAppProvider();
    const [parts, setParts] = useState<MultipartPart[]>([]);
    const [search, setSearch] = useState("");
    const [selectedPartIndex, setSelectedPartIndex] = useState<number | null>(0);
    const [viewMode, setViewMode] = useState<"text" | "hex">("text");
    const [isBeautified, setIsBeautified] = useState(false);
    const [boundary, setBoundary] = useState("");
    const [totalSize, setTotalSize] = useState(0);

    useEffect(() => {
        const load = async () => {
            const trafficId = selections.firstSelected?.id as string;
            if (trafficId) {
                try {
                    const req = await provider.getRequestPairData(trafficId);
                    if (req.body && req.content_type.toLowerCase().includes("multipart/form-data")) {
                        setTotalSize(req.body.length);
                        const boundaryMatch = req.content_type.split("boundary=")[1]?.split(";")[0];
                        if (boundaryMatch) {
                            setBoundary(boundaryMatch);
                            const parsed = parseMultipart(req.body, boundaryMatch);
                            setParts(parsed);
                        } else {
                            setParts([]);
                            setBoundary("");
                            setTotalSize(0);
                        }
                    } else {
                        setParts([]);
                        setBoundary("");
                        setTotalSize(0);
                    }
                } catch (e) {
                    console.error("Failed to load multipart data", e);
                    setParts([]);
                }
            } else {
                setParts([]);
                setBoundary("");
                setTotalSize(0);
            }
        };
        load();
    }, [selections.firstSelected, provider]);

    useEffect(() => {
        setViewMode("text");
        setIsBeautified(false);
    }, [selectedPartIndex]);

    const filteredParts = useMemo(() => {
        return parts.filter(p => {
            const lowSearch = search.toLowerCase();
            const textValue = new TextDecoder().decode(p.value.slice(0, 1000));
            return p.name.toLowerCase().includes(lowSearch) ||
                p.filename.toLowerCase().includes(lowSearch) ||
                textValue.toLowerCase().includes(lowSearch);
        });
    }, [parts, search]);

    const selectedPart = selectedPartIndex !== null && filteredParts[selectedPartIndex] ? filteredParts[selectedPartIndex] : null;

    const displayContent = useMemo(() => {
        if (!selectedPart) return "";

        if (viewMode === "hex") {
            return ""; // HexView handles this
        }

        const rawText = new TextDecoder().decode(selectedPart.value);
        if (isBeautified && selectedPart.contentType.toLowerCase().includes("json")) {
            try {
                return JSON.stringify(JSON.parse(rawText), null, 2);
            } catch {
                return rawText;
            }
        }
        return rawText;
    }, [selectedPart, viewMode, isBeautified]);

    return (
        <div className="h-full bg-[#0a0a0a] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-zinc-900 bg-[#0d0d0d]">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600/10 rounded-lg border border-blue-500/20">
                        <FiDatabase className="text-blue-500" size={16} />
                    </div>
                    <div className="flex flex-col">
                        <h2 className="text-sm font-black text-white tracking-widest">Multipart Inspector</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-zinc-600 font-bold tracking-tighter">{parts.length} Fields</span>
                            <span className="text-[10px] text-zinc-800">•</span>
                            <span className="text-[10px] text-zinc-600 font-bold tracking-tighter">Total: {totalSize.toLocaleString()} B</span>
                            {boundary && (
                                <>
                                    <span className="text-[10px] text-zinc-800">•</span>
                                    <span className="text-[10px] text-blue-500/50 font-mono font-bold tracking-tighter">Boundary: {boundary}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="relative group max-w-xs w-full">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors" size={14} />
                    <input
                        type="text"
                        placeholder="Filter form fields..."
                        className="w-full bg-[#171717] border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-xs text-zinc-300 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-medium"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-grow flex overflow-hidden">
                <div className="w-80 border-r border-zinc-900 overflow-y-auto bg-[#0d0d0d] flex flex-col no-scrollbar">
                    {filteredParts.map((part, idx) => (
                        <button
                            key={idx}
                            onClick={() => setSelectedPartIndex(idx)}
                            className={`flex flex-col p-4 text-left border-b border-zinc-900 transition-all relative ${selectedPartIndex === idx ? 'bg-blue-600/10' : 'hover:bg-zinc-900/40'}`}
                        >
                            {selectedPartIndex === idx && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 shadow-[0_0_10px_#3b82f6]" />}
                            <div className="flex items-center justify-between mb-1">
                                <span className={`text-xs font-black truncate max-w-[180px] ${selectedPartIndex === idx ? 'text-blue-400' : 'text-zinc-300'}`}>
                                    {part.name || "unnamed"}
                                </span>
                                <span className="text-[9px] font-mono text-zinc-600 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">{part.size} B</span>
                            </div>
                            {part.filename !== "-" && (
                                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 italic mt-0.5 mb-1 truncate">
                                    <FiFile size={10} />
                                    <span>{part.filename}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-600 tracking-widest mt-1">
                                <FiTag size={10} />
                                <span className="truncate">{part.contentType}</span>
                            </div>
                        </button>
                    ))}
                    {filteredParts.length === 0 && (
                        <div className="flex flex-col items-center justify-center p-12 text-center">
                            <FiSearch size={48} className="text-zinc-800 mb-4 opacity-50" />
                            <p className="text-[10px] text-zinc-600 font-black tracking-[0.2em]">No fields match search</p>
                        </div>
                    )}
                </div>

                <div className="flex-grow flex flex-col bg-[#0a0a0a]">
                    {selectedPart ? (
                        <div className="flex-grow flex flex-col h-full">
                            <div className="p-4 border-b border-zinc-900 bg-[#0d0d0d] flex items-center justify-between">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-black text-white">{selectedPart.name || "unnamed"}</span>
                                        {selectedPart.filename !== "-" && <span className="text-[10px] text-zinc-500 font-mono">({selectedPart.filename})</span>}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1 text-[10px] text-zinc-600 font-medium">
                                            <FiTag size={12} />
                                            <span>{selectedPart.contentType}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {selectedPart.contentType.toLowerCase().includes("json") && (
                                        <button
                                            onClick={() => setIsBeautified(!isBeautified)}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all border ${isBeautified ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'}`}
                                        >
                                            {isBeautified ? 'Raw' : 'Beautify'}
                                        </button>
                                    )}
                                    {(selectedPart.contentType.toLowerCase().includes("octet-stream") || selectedPart.filename !== "-") && (
                                        <button
                                            onClick={() => setViewMode(viewMode === 'hex' ? 'text' : 'hex')}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all border ${viewMode === 'hex' ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_15px_rgba(147,51,234,0.3)]' : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'}`}
                                        >
                                            {viewMode === 'hex' ? 'Text View' : 'Hex View'}
                                        </button>
                                    )}
                                    <button
                                        className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] font-black tracking-widest text-zinc-400 hover:text-white hover:border-zinc-700 transition-all active:scale-95 shadow-xl"
                                        onClick={() => {
                                            const blob = new Blob([selectedPart.value as any], { type: selectedPart.contentType });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = selectedPart.filename !== "-" ? selectedPart.filename : (selectedPart.name || "part.bin");
                                            a.click();
                                            URL.revokeObjectURL(url);
                                        }}
                                    >
                                        <FiDownload size={14} />
                                        <span>Download</span>
                                    </button>
                                </div>
                            </div>
                            <div className="flex-grow bg-[#1e1e1e] relative overflow-auto">
                                {viewMode === "hex" ? (
                                    <div className="p-4">
                                        <HexView data={selectedPart.value} />
                                    </div>
                                ) : (
                                    <MonacoEditor
                                        height="100%"
                                        language={selectedPart.contentType.toLowerCase().includes("json") ? "json" : (selectedPart.contentType.toLowerCase().includes("html") ? "html" : (selectedPart.contentType.toLowerCase().includes("javascript") ? "javascript" : "text"))}
                                        theme="vs-dark"
                                        value={displayContent}
                                        options={{
                                            readOnly: true,
                                            minimap: { enabled: false },
                                            fontSize: 12,
                                            scrollBeyondLastLine: false,
                                            wordWrap: "on",
                                            lineNumbers: "on",
                                            padding: { top: 10, bottom: 10 },
                                            fontFamily: "'JetBrains Mono', 'Fira Code', 'Menlo', monospace",
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-900">
                            <FiEye size={80} className="mb-6 opacity-10" />
                            <p className="text-xs font-black tracking-[0.4em] text-zinc-700">Select a part to analyze</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const parseMultipart = (body: Uint8Array, boundary: string) => {
    const dashBoundary = "--" + boundary;
    const boundaryBytes = new TextEncoder().encode(dashBoundary);
    const result: MultipartPart[] = [];

    let lastOffset = 0;
    while (lastOffset < body.length) {
        let foundBoundary = -1;
        for (let i = lastOffset; i <= body.length - boundaryBytes.length; i++) {
            let matches = true;
            for (let j = 0; j < boundaryBytes.length; j++) {
                if (body[i + j] !== boundaryBytes[j]) {
                    matches = false;
                    break;
                }
            }
            if (matches) {
                foundBoundary = i;
                break;
            }
        }

        if (foundBoundary === -1) break;

        const nextBoundarySearchStart = foundBoundary + boundaryBytes.length;
        let nextBoundary = -1;
        for (let i = nextBoundarySearchStart; i <= body.length - boundaryBytes.length; i++) {
            let matches = true;
            for (let j = 0; j < boundaryBytes.length; j++) {
                if (body[i + j] !== boundaryBytes[j]) {
                    matches = false;
                    break;
                }
            }
            if (matches) {
                nextBoundary = i;
                break;
            }
        }

        if (nextBoundary === -1) break;

        const partData = body.slice(foundBoundary + boundaryBytes.length + 2, nextBoundary); // +2 for \r\n

        let headerEnd = -1;
        for (let i = 0; i < partData.length - 3; i++) {
            if (partData[i] === 13 && partData[i + 1] === 10 && partData[i + 2] === 13 && partData[i + 3] === 10) {
                headerEnd = i;
                break;
            }
        }

        if (headerEnd === -1) {
            lastOffset = nextBoundary;
            continue;
        }

        const headerSection = new TextDecoder().decode(partData.slice(0, headerEnd));
        const bodyContent = partData.slice(headerEnd + 4, partData.length - 2); // -2 for trailing \r\n

        const headers = headerSection.split("\r\n");
        let name = "";
        let filename = "";
        let contentType = "";

        for (const h of headers) {
            if (h.toLowerCase().startsWith("content-disposition")) {
                const nameMatch = h.match(/name="([^"]+)"/);
                const filenameMatch = h.match(/filename="([^"]+)"/);
                if (nameMatch) name = nameMatch[1];
                if (filenameMatch) filename = filenameMatch[1];
            } else if (h.toLowerCase().startsWith("content-type")) {
                contentType = h.split(":")[1]?.trim();
            }
        }

        if (name || filename) {
            result.push({
                name: name || "",
                filename: filename || "-",
                contentType: contentType || "application/octet-stream",
                value: bodyContent,
                size: bodyContent.length
            });
        }

        lastOffset = nextBoundary;
    }

    return result;
};
