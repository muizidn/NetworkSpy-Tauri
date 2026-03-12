import { useEffect, useState, useMemo } from "react";
import { useAppProvider } from "@src/packages/app-env";
import { useTrafficListContext } from "../../../../main-content/context/TrafficList";
import { ResponsePairData } from "../../../ResponseTab";
import { CodeView } from "../../../TabRenderer/CodeView";
import { FiCopy, FiCheck, FiInbox, FiClock } from "react-icons/fi";
import { SiRabbitmq } from "react-icons/si";

export const RabbitMQViewerMode = () => {
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

    const amqpMetadata = useMemo(() => ({
        "Exchange": "events.direct",
        "Routing Key": "user.login",
        "Content Type": "application/json",
        "Delivery Mode": "Persistent (2)",
        "Priority": "0",
        "Correlation ID": "corr-uuid-8899",
        "App ID": "auth-service"
    }), []);

    const decodedPayload = useMemo(() => {
        if (!data?.body) return "";
        try {
            const parsed = JSON.parse(data.body);
            return JSON.stringify(parsed, null, 2);
        } catch (e) { return data.body; }
    }, [data]);

    const handleCopy = () => {
        navigator.clipboard.writeText(decodedPayload);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!trafficId) return <Placeholder text="Select RabbitMQ traffic" />;
    if (loading) return <Placeholder text="Aggregating AMQP Frames..." />;

    return (
        <div className="bg-[#0a0a0a] flex flex-col min-h-full h-full font-sans">
            <div className="px-6 py-4 bg-[#111] border-b border-orange-500/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full scale-0 group-hover:scale-110 transition-transform"></div>
                        <div className="w-10 h-10 rounded-xl bg-orange-600/10 border border-orange-500/20 flex items-center justify-center text-[#F60] shadow-lg relative z-10">
                            <SiRabbitmq size={22} />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-white tracking-tight uppercase italic">RabbitMQ Inspector</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                             <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Protocol: </span>
                             <span className="text-[9px] font-mono text-orange-400/80">AMQP 0-9-1</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/50 border border-white/5 text-[10px] font-bold text-zinc-400 hover:text-white transition-all duration-300"
                    >
                        {copied ? <FiCheck className="text-emerald-500" size={12} /> : <FiCopy size={12} />}
                        {copied ? 'COPIED' : 'COPY PAYLOAD'}
                    </button>
                </div>
            </div>

            <div className="flex-grow flex h-full overflow-hidden">
                <div className="w-80 bg-[#0d0d0d] border-r border-white/5 flex flex-col p-4 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                         <div className="w-1 h-3 bg-orange-500 rounded-full"></div>
                         <h3 className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">Envelope Details</h3>
                    </div>
                    <div className="space-y-1.5">
                        {Object.entries(amqpMetadata).map(([k, v]) => (
                            <div key={k} className="flex flex-col bg-orange-500/[0.02] p-2.5 rounded-xl border border-white/5 space-y-1 hover:border-orange-500/20 transition-colors">
                                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{k}</span>
                                <span className="text-[10px] font-mono text-orange-200/90 truncate">{v}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex-grow relative bg-[#050505] flex flex-col">
                    <div className="p-3 bg-zinc-900/40 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                             <FiInbox size={12} className="text-zinc-500" />
                             <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Payload Body</span>
                        </div>
                    </div>
                    <div className="flex-grow relative h-full">
                        <CodeView data={decodedPayload} language="json" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const Placeholder = ({ text }: { text: string }) => (
    <div className="h-full flex items-center justify-center text-zinc-500 bg-[#0a0a0a] font-sans">
        <div className="text-center">
            <div className="w-20 h-20 bg-orange-600/5 rounded-3xl border border-orange-500/10 flex items-center justify-center text-orange-500 mx-auto mb-6 shadow-2xl relative">
                <div className="absolute inset-0 bg-orange-500/5 blur-2xl rounded-full animate-pulse"></div>
                <SiRabbitmq size={40} className="relative z-10" />
            </div>
            <div className="text-5xl font-black opacity-5 mb-3 italic tracking-tighter uppercase text-orange-500">AMQP</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-2">Message Broker Standby</div>
            <div className="text-xs italic">{text}</div>
        </div>
    </div>
);
