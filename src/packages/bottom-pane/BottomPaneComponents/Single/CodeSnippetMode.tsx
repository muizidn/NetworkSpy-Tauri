import { useEffect, useState, useMemo } from "react";
import { useAppProvider } from "@src/packages/app-env";
import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { RequestPairData } from "../../RequestTab";
import { MonacoEditor } from "@src/packages/ui/MonacoEditor";
import { FiCode, FiTerminal, FiShield, FiCpu, FiAlertTriangle, FiInfo, FiCheckCircle, FiEdit2 } from "react-icons/fi";
import { twMerge } from "tailwind-merge";
import { CustomScriptManager } from "../../CustomScriptManager";
import { useCustomScripts, CodeSnippetFinding } from "../../useCustomScripts";
import { decodeBody } from "../../utils/bodyUtils";

import { FiChevronDown, FiGlobe, FiX, FiList, FiLayers } from "react-icons/fi";

const SnippetCard = ({ label, content, lang, isRunning }: { label: string, content: string, lang: string, isRunning?: boolean }) => (
    <div className="flex flex-col gap-3 h-[300px] mb-8 group">
        <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-[10px] font-black text-zinc-400 tracking-widest">{label}</span>
            </div>
            <div className="bg-black/50 backdrop-blur-md border border-white/5 rounded-lg px-3 py-1 text-[8px] font-black text-zinc-500 tracking-widest flex items-center gap-2">
                {isRunning ? <FiCpu className="animate-spin" /> : <FiTerminal />}
                {lang.toUpperCase()} TEMPLATE
            </div>
        </div>
        <div className="flex-grow rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl relative">
            <MonacoEditor
                height="100%"
                language={lang}
                theme="vs-dark"
                value={content}
                options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 12,
                    scrollBeyondLastLine: false,
                    lineNumbers: "on",
                    fontFamily: "JetBrains Mono, monospace",
                    padding: { top: 16, bottom: 16 },
                    automaticLayout: true
                }}
            />
        </div>
    </div>
);

const CustomDropdown = ({
    options,
    selectedId,
    onSelect,
    isRunning
}: {
    options: { id: string, label: string, icon: React.ReactNode, isCustom?: boolean }[],
    selectedId: string,
    onSelect: (id: string) => void,
    isRunning: boolean
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const selected = useMemo(() => options.find(o => o.id === selectedId), [options, selectedId]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isOpen && !(event.target as HTMLElement).closest('.custom-dropdown-container')) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className="relative min-w-[240px] custom-dropdown-container">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={twMerge(
                    "w-full flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-[10px] font-black tracking-widest text-zinc-400 hover:text-emerald-500 hover:border-emerald-500/30 transition-all shadow-xl group",
                    isOpen && "border-emerald-500 text-emerald-500 bg-black shadow-emerald-500/10"
                )}
            >
                <div className="flex items-center gap-3">
                    <span className="text-emerald-500/60 group-hover:text-emerald-500 transition-colors">
                        {isRunning ? <FiCpu className="animate-spin" /> : selected?.icon}
                    </span>
                    <span className="truncate">{selected?.label || "Select Snippet"}</span>
                </div>
                <FiChevronDown className={twMerge("transition-transform duration-300", isOpen && "rotate-180 text-emerald-500")} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-black/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-[100] overflow-hidden py-2 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-3 py-1 text-[8px] font-black text-zinc-600 tracking-widest mb-1 select-none">Built-in Templates</div>
                    {options.filter(o => !o.isCustom).map(o => (
                        <button
                            key={o.id}
                            onClick={() => { onSelect(o.id); setIsOpen(false); }}
                            className={twMerge(
                                "w-full flex items-center justify-between px-4 py-2.5 text-[10px] font-black tracking-widest text-zinc-500 hover:bg-emerald-600/10 hover:text-emerald-500 transition-all",
                                selectedId === o.id && "text-emerald-500 bg-emerald-600/5"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <span className={twMerge(selectedId === o.id ? "text-emerald-500" : "text-zinc-600")}>{o.icon}</span>
                                {o.label}
                            </div>
                            {selectedId === o.id && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" />}
                        </button>
                    ))}

                    {options.some(o => o.isCustom) && (
                        <>
                            <div className="h-px bg-white/5 my-2 mx-2" />
                            <div className="px-3 py-1 text-[8px] font-black text-zinc-600 tracking-widest mb-1 select-none">Custom Generator Results</div>
                            {options.filter(o => o.isCustom).map(o => (
                                <button
                                    key={o.id}
                                    onClick={() => { onSelect(o.id); setIsOpen(false); }}
                                    className={twMerge(
                                        "w-full flex items-center justify-between px-4 py-2.5 text-[10px] font-black tracking-widest text-zinc-500 hover:bg-emerald-600/10 hover:text-emerald-500 transition-all",
                                        selectedId === o.id && "text-emerald-500 bg-emerald-600/5"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={twMerge(selectedId === o.id ? "text-emerald-500" : "text-zinc-600")}><FiCpu /></span>
                                        {o.label}
                                    </div>
                                    {selectedId === o.id && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" />}
                                </button>
                            ))}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export const CodeSnippetMode = () => {
    const { provider } = useAppProvider();
    const { selections } = useTrafficListContext();
    const trafficId = useMemo(() => selections.firstSelected?.id as string, [selections]);
    const [data, setData] = useState<RequestPairData | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedOption, setSelectedOption] = useState("javascript");
    const [activeTab, setActiveTab] = useState<"Snippets" | "Custom Scripts">("Snippets");
    const [viewMode, setViewMode] = useState<"dropdown" | "stacked">("dropdown");

    const trafficData = useMemo(() => {
        return { body: decodeBody(data?.body || null), headers: data?.headers || [] };
    }, [data]);

    const { customFindings, isRunning, refreshScripts } = useCustomScripts<CodeSnippetFinding>('code_snippet', trafficData.body, trafficData.headers);

    useEffect(() => {
        if (!trafficId) return;
        setLoading(true);
        provider.getRequestPairData(trafficId)
            .then((res) => setData(res))
            .finally(() => setLoading(false));
    }, [trafficId, provider]);

    const builtInSnippets = useMemo(() => {
        if (!data || !selections.firstSelected) return { javascript: "", python: "" };
        const item = selections.firstSelected;

        const js = `fetch('${item.url}', {
    method: '${item.method}',
    headers: {
${data.headers.map(h => `        '${h.key}': '${h.value}'`).join(",\n")}
    }${data.body ? `,\n    body: JSON.stringify(${data.body})` : ""}
})
.then(response => response.json())
.then(data => console.log(data));`;

        const py = `import requests

url = '${item.url}'
headers = {
${data.headers.map(h => `    '${h.key}': '${h.value}'`).join(",\n")}
}
${data.body ? `data = ${data.body}\n` : ""}
response = requests.${String(item.method).toLowerCase()}(url, headers=headers${data.body ? ", json=data" : ""})
print(response.json())`;

        return { javascript: js, python: py };
    }, [data, selections.firstSelected]);

    const activeSnippet = useMemo(() => {
        if (selectedOption === "javascript") return { content: builtInSnippets.javascript, lang: "javascript", label: "JavaScript (Fetch)" };
        if (selectedOption === "python") return { content: builtInSnippets.python, lang: "python", label: "Python (Requests)" };

        const custom = customFindings.find(f => f.type === selectedOption);
        return {
            content: custom?.value || "// No output from script",
            lang: "javascript",
            label: custom?.type || selectedOption
        };
    }, [selectedOption, builtInSnippets, customFindings]);

    const getAllSnippets = useMemo(() => {
        const list = [
            { id: "javascript", label: "JavaScript (Fetch)", content: builtInSnippets.javascript, lang: "javascript" },
            { id: "python", label: "Python (Requests)", content: builtInSnippets.python, lang: "python" },
        ];
        customFindings.forEach(f => {
            list.push({ id: f.type, label: f.type, content: f.value, lang: "javascript" });
        });
        return list;
    }, [builtInSnippets, customFindings]);

    const options = useMemo(() => {
        return [
            { id: "javascript", label: "JavaScript (Fetch)", icon: <FiGlobe /> },
            { id: "python", label: "Python (Requests)", icon: <FiGlobe /> },
            ...customFindings.map(f => ({ id: f.type, label: f.type, icon: <FiCpu />, isCustom: true }))
        ];
    }, [customFindings]);

    if (!trafficId) return <Placeholder text="Select a request to generate code" />;
    if (loading) return <Placeholder text="Generating..." />;

    return (
        <div className="h-full bg-[#0a0a0a] flex flex-col overflow-hidden font-sans">
            <div className="px-6 pt-4 border-b border-zinc-900 bg-[#0a0a0a] flex flex-col shadow-lg shrink-0">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                            <FiTerminal size={18} />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-white tracking-tighter">Code Snippet Engine</h2>
                            <div className="text-[9px] text-zinc-500 font-bold tracking-widest italic leading-none whitespace-nowrap italic">
                                {activeTab === "Snippets" && viewMode === "stacked" ? "Stacked: Review Mode" : "Perspective Switcher"}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {activeTab === "Snippets" && (
                            <div className="flex items-center bg-zinc-900/50 rounded-xl p-1 border border-zinc-800">
                                <button
                                    onClick={() => setViewMode("dropdown")}
                                    className={twMerge(
                                        "p-2 rounded-lg transition-all",
                                        viewMode === "dropdown" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" : "text-zinc-500 hover:text-white"
                                    )}
                                    title="Focused Selector"
                                >
                                    <FiLayers size={14} />
                                </button>
                                <button
                                    onClick={() => setViewMode("stacked")}
                                    className={twMerge(
                                        "p-2 rounded-lg transition-all",
                                        viewMode === "stacked" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" : "text-zinc-500 hover:text-white"
                                    )}
                                    title="Stacked View (All)"
                                >
                                    <FiList size={14} />
                                </button>
                            </div>
                        )}

                        {activeTab === "Snippets" && (
                            viewMode === "dropdown" ? (
                                <CustomDropdown
                                    options={options}
                                    selectedId={selectedOption}
                                    onSelect={setSelectedOption}
                                    isRunning={isRunning}
                                />
                            ) : (
                                <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl px-4 py-2 text-[9px] font-black tracking-widest text-emerald-500 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]" />
                                    All Results Active
                                </div>
                            )
                        )}
                    </div>
                </div>

                <div className="flex gap-4">
                    {(["Snippets", "Custom Scripts"] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={twMerge(
                                "pb-3 text-[11px] font-black tracking-widest transition-all relative",
                                activeTab === tab ? tab === "Custom Scripts" ? "text-orange-500" : "text-emerald-500" : "text-zinc-600 hover:text-zinc-400"
                            )}
                        >
                            {tab}
                            {activeTab === tab && (
                                <div className={twMerge(
                                    "absolute bottom-0 left-0 right-0 h-0.5 shadow-lg",
                                    tab === "Custom Scripts" ? "bg-orange-500 shadow-orange-500/50" : "bg-emerald-500 shadow-emerald-500/50"
                                )} />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-grow overflow-y-auto no-scrollbar pb-10">
                {activeTab === "Custom Scripts" ? (
                    <div className="max-w-4xl mx-auto p-4 @sm:p-8">
                        <CustomScriptManager category="code_snippet" onUpdate={refreshScripts} />
                    </div>
                ) : (
                    <div className="h-full p-4 @sm:p-8">
                        {viewMode === "dropdown" ? (
                            <div className="h-full flex flex-col">
                                <div className="flex-grow rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl relative">
                                    <MonacoEditor
                                        height="100%"
                                        language={activeSnippet.lang}
                                        theme="vs-dark"
                                        value={activeSnippet.content}
                                        options={{
                                            readOnly: true,
                                            minimap: { enabled: false },
                                            fontSize: 13,
                                            scrollBeyondLastLine: false,
                                            lineNumbers: "on",
                                            fontFamily: "JetBrains Mono, monospace",
                                            padding: { top: 20, bottom: 20 }
                                        }}
                                    />
                                    <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md border border-white/10 rounded-lg px-3 py-1.5 text-[9px] font-black text-zinc-400 tracking-widest flex items-center gap-2">
                                        {isRunning ? <FiCpu className="animate-spin" /> : <FiTerminal />}
                                        {activeSnippet.label}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="max-w-5xl mx-auto pb-20">
                                {getAllSnippets.map(snippet => (
                                    <SnippetCard
                                        key={snippet.id}
                                        label={snippet.label}
                                        content={snippet.content}
                                        lang={snippet.lang}
                                        isRunning={isRunning}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const Placeholder = ({ text }: { text: string }) => (
    <div className="h-full flex flex-col items-center justify-center bg-[#050505] p-6 @sm:p-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-700 mb-6 rotate-12">
            <FiCode size={32} />
        </div>
        <h3 className="text-zinc-400 font-bold mb-1 italic">Snippet Engine Ready</h3>
        <p className="text-[11px] text-zinc-600 leading-relaxed max-w-[180px]">{text}</p>
    </div>
);

export default CodeSnippetMode;
