import { useEffect, useState, useMemo } from "react";
import { useAppProvider } from "@src/packages/app-env";
import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { RequestPairData } from "../../RequestTab";
import { Editor } from "@monaco-editor/react";
import { FiCode, FiTerminal, FiShield, FiCpu, FiAlertTriangle, FiInfo, FiCheckCircle, FiEdit2 } from "react-icons/fi";
import { twMerge } from "tailwind-merge";
import { CustomScriptManager } from "../../CustomScriptManager";
import { useCustomScripts, CodeSnippetFinding } from "../../useCustomScripts";
import { decodeBody } from "../../utils/bodyUtils";

const FindingCard = ({ finding }: { finding: CodeSnippetFinding & { isCustom?: boolean, isError?: boolean, scriptName?: string } }) => (
    <div className={twMerge(
        "group overflow-hidden rounded-2xl border transition-all duration-300 shadow-xl mb-4",
        finding.isError
            ? "border-red-900/50 bg-red-950/10 hover:border-red-500/50"
            : "border-emerald-900/30 bg-emerald-950/5 hover:border-emerald-500/50"
    )}>
        <div className="p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                    <span className={twMerge(
                        "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
                        finding.isError ? "bg-red-500 text-white" : "bg-emerald-600 text-white"
                    )}>
                        {finding.type}
                    </span>
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">Snippet Logic</span>
                </div>
                <div className={twMerge(
                    "text-[8px] font-black px-2 py-0.5 rounded-full border uppercase tracking-tighter shadow-sm",
                    finding.isError
                        ? "bg-red-600 text-white border-red-500"
                        : "bg-emerald-950 text-emerald-400 border-emerald-900/30"
                )}>
                    {finding.isError ? "Runtime Error" : "Template Valid"}
                </div>
            </div>

            <div className={twMerge(
                "text-xs font-mono p-3 rounded-xl border leading-relaxed",
                finding.isError
                    ? "text-red-400 bg-red-950/20 border-red-500/20"
                    : "text-emerald-300 bg-black/30 border-white/5"
            )}>
                {finding.value}
            </div>
        </div>
    </div>
);

export const CodeSnippetMode = () => {
    const { provider } = useAppProvider();
    const { selections } = useTrafficListContext();
    const trafficId = useMemo(() => selections.firstSelected?.id as string, [selections]);
    const [data, setData] = useState<RequestPairData | null>(null);
    const [loading, setLoading] = useState(false);
    const [lang, setLang] = useState("javascript");
    const [activeTab, setActiveTab] = useState<"Snippets" | "Custom Scripts">("Snippets");

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

    const snippet = useMemo(() => {
        if (!data || !selections.firstSelected) return "";
        const item = selections.firstSelected;

        if (lang === "javascript") {
            return `fetch('${item.url}', {
    method: '${item.method}',
    headers: {
${data.headers.map(h => `        '${h.key}': '${h.value}'`).join(",\n")}
    }${data.body ? `,\n    body: JSON.stringify(${data.body})` : ""}
})
.then(response => response.json())
.then(data => console.log(data));`;
        }

        if (lang === "python") {
            return `import requests

url = '${item.url}'
headers = {
${data.headers.map(h => `    '${h.key}': '${h.value}'`).join(",\n")}
}
${data.body ? `data = ${data.body}\n` : ""}
response = requests.${String(item.method).toLowerCase()}(url, headers=headers${data.body ? ", json=data" : ""})
print(response.json())`;
        }

        return "// Language not implemented yet";
    }, [data, selections.firstSelected, lang]);

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
                            <h2 className="text-sm font-black text-white uppercase tracking-tighter">Code Snippet Engine</h2>
                            <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest italic leading-none">Auto-Generator</div>
                        </div>
                    </div>
                    {activeTab === "Snippets" && (
                        <div className="flex gap-2">
                            {["javascript", "python"].map(l => (
                                <button
                                    key={l}
                                    onClick={() => setLang(l)}
                                    className={twMerge(
                                        "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                        lang === l ? "bg-emerald-600 text-white" : "bg-zinc-900 text-zinc-500 hover:text-zinc-300"
                                    )}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex gap-4">
                    {(["Snippets", "Custom Scripts"] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={twMerge(
                                "pb-3 text-[11px] font-black uppercase tracking-widest transition-all relative",
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
                    <div className="h-full flex flex-col p-4 @sm:p-8">
                        {customFindings.length > 0 && (
                            <div className="mb-8">
                                <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4 pl-1 flex items-center gap-2">
                                    <FiCpu size={12} /> Custom Transformation Results
                                </div>
                                {customFindings.map((f, i) => <FindingCard key={i} finding={f} />)}
                            </div>
                        )}

                        <div className="flex-grow rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl relative">
                            <Editor
                                height="100%"
                                language={lang}
                                theme="vs-dark"
                                value={snippet}
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
                            <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md border border-white/10 rounded-lg px-3 py-1.5 text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                {isRunning ? <FiCpu className="animate-spin" /> : <FiTerminal />}
                                {lang.toUpperCase()} TEMPLATE
                            </div>
                        </div>
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
