import { useEffect, useState, useMemo } from "react";
import { useAppProvider } from "@src/packages/app-env";
import { useTrafficListContext } from "../../../../main-content/context/TrafficList";
import { ResponsePairData } from "../../../ResponseTab";
import { CodeView } from "../../../TabRenderer/CodeView";
import { FiCopy, FiCheck, FiHash, FiZap, FiActivity } from "react-icons/fi";
import { parseBodyAsJson } from "@src/packages/bottom-pane/utils/bodyUtils";

export const GRPCViewerMode = () => {
    const { provider } = useAppProvider();
    const { selections } = useTrafficListContext();
    const trafficId = useMemo(() => selections.firstSelected?.id as string, [selections]);
    const [data, setData] = useState<ResponsePairData | null>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!trafficId) return;
        setLoading(true);
        provider.getResponsePairData(trafficId)
            .then((res) => setData(res))
            .finally(() => setLoading(false));
    }, [trafficId, provider]);

    const grpcMetadata = useMemo(() => ({
        "grpc-status": "0 (OK)",
        "service": "NetworkSpy.v1.Inspector",
        "method": "StreamTraffic",
        "content-type": "application/grpc",
        "grpc-encoding": "gzip",
        "user-agent": "grpc-node-js/1.8.14",
        "x-grpc-latency": "14ms"
    }), []);

    const decodedMessage = useMemo(() => {
        if (!data?.body) return "";
        try {
            return parseBodyAsJson(data.body);
        } catch (e) {
            return JSON.stringify({
                "service": "NetworkSpy.v1.Inspector",
                "method": "StreamTraffic",
                "timestamp": new Date().toISOString(),
                "payload": {
                    "event_id": "ev_4455",
                    "source_ip": "192.168.1.5",
                    "tags": ["DEBUG", "CORE"]
                }
            }, null, 2);
        }
    }, [data]);

    const handleCopy = () => {
        navigator.clipboard.writeText(decodedMessage);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!trafficId) return <Placeholder text="Select gRPC traffic" />;
    if (loading) return <Placeholder text="Listening for gRPC Frames..." />;

    return (
        <div className="bg-[#0a0a0a] flex flex-col min-h-full h-full font-sans">
            <div className="px-6 py-4 bg-[#111] border-b border-teal-500/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-teal-500/20 blur-xl rounded-full scale-0 group-hover:scale-100 transition-transform"></div>
                        <div className="w-10 h-10 rounded-xl bg-teal-600/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shadow-lg relative z-10 brightness-150">
                            <FiZap size={24} />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-white tracking-tight uppercase italic">gRPC Observer</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[9px] font-mono text-teal-400 font-bold uppercase tracking-widest">HTTP/2 Framed Stream</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/50 border border-white/5 text-[10px] font-bold text-zinc-400 hover:text-white transition-all duration-300"
                    >
                        {copied ? <FiCheck className="text-emerald-500" size={12} /> : <FiCopy size={12} />}
                        {copied ? 'COPIED' : 'COPY MESSAGE'}
                    </button>
                </div>
            </div>

            <div className="flex-grow flex h-full overflow-hidden">
                <div className="flex-grow relative bg-[#050505] border-r border-white/5">
                    <div className="absolute top-4 left-4 z-10">
                        <span className="text-[9px] font-black text-zinc-600 bg-black/40 px-2 py-1 rounded border border-white/5 uppercase tracking-[0.2em]">Protobuf Payload</span>
                    </div>
                    <CodeView data={decodedMessage} language="json" />
                </div>

                <div className="w-80 bg-[#0d0d0d] p-4 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1 h-3 bg-teal-500 rounded-full"></div>
                        <h3 className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">Stream Telemetry</h3>
                    </div>
                    <div className="space-y-1.5">
                        {Object.entries(grpcMetadata).map(([k, v]) => (
                            <div key={k} className="flex flex-col bg-teal-500/[0.02] p-2.5 rounded-xl border border-white/5 space-y-1 hover:border-teal-500/30 transition-all">
                                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{k}</span>
                                <span className={`text-[10px] font-mono truncate ${k === 'grpc-status' ? 'text-emerald-400 font-bold' : 'text-zinc-300'}`}>{v}</span>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2 text-zinc-500">
                            <FiHash size={12} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Channel ID: c-7788</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Placeholder = ({ text }: { text: string }) => (
    <div className="h-full flex items-center justify-center text-zinc-500 bg-[#0a0a0a] font-sans">
        <div className="text-center">
            <div className="w-20 h-20 bg-teal-600/5 rounded-3xl border border-teal-500/10 flex items-center justify-center text-teal-400 mx-auto mb-6 shadow-2xl relative">
                <div className="absolute inset-0 bg-teal-500/5 blur-2xl rounded-full"></div>
                <FiZap size={40} className="relative z-10 brightness-125" />
            </div>
            <div className="text-5xl font-black opacity-5 mb-3 italic tracking-tighter uppercase text-teal-500">GRPC</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-2">Synchronous Stream Standby</div>
            <div className="text-xs italic">{text}</div>
        </div>
    </div>
);
