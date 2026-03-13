import { useEffect, useState, useMemo } from "react";
import { useAppProvider } from "@src/packages/app-env";
import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { ResponsePairData } from "../../ResponseTab";
import { FiMusic, FiPlay, FiVolume2 } from "react-icons/fi";

export const AudioViewerMode = () => {
    const { provider } = useAppProvider();
    const { selections } = useTrafficListContext();
    const trafficId = useMemo(() => selections.firstSelected?.id as string, [selections]);
    const [data, setData] = useState<ResponsePairData | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!trafficId) return;
        setLoading(true);
        provider.getResponsePairData(trafficId)
            .then((res) => setData(res))
            .finally(() => setLoading(false));
    }, [trafficId, provider]);

    if (!trafficId) return <Placeholder text="Select a request to play audio" />;
    if (loading) return <Placeholder text="Loading audio stream..." />;

    const isAudio = data?.content_type?.toLowerCase().includes('audio');

    return (
        <div className="bg-[#0a0a0a] flex flex-col items-center justify-center p-12 min-h-full">
            <div className="max-w-md w-full bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 flex flex-col items-center shadow-2xl">
                <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 border border-blue-500/20">
                    <FiMusic className="text-blue-500" size={32} />
                </div>

                <h3 className="text-sm font-bold text-white mb-1">Audio Stream Detected</h3>
                <p className="text-[10px] text-zinc-500 mb-8 uppercase tracking-widest">{data?.content_type || 'Unknown Format'}</p>

                {isAudio ? (
                    <div className="w-full flex flex-col gap-4">
                        <div className="bg-black/40 rounded-2xl p-4 border border-white/5 flex items-center gap-4">
                            <button className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/40 hover:scale-105 transition-transform">
                                <FiPlay className="text-white fill-current" size={16} />
                            </button>
                            <div className="flex-grow">
                                <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full w-1/3 bg-blue-500 rounded-full" />
                                </div>
                                <div className="flex justify-between mt-2">
                                    <span className="text-[9px] font-mono text-zinc-500 tracking-tighter">00:42</span>
                                    <span className="text-[9px] font-mono text-zinc-500 tracking-tighter">03:15</span>
                                </div>
                            </div>
                            <FiVolume2 className="text-zinc-600" size={16} />
                        </div>
                        <p className="text-[9px] text-zinc-600 text-center italic">Streaming from {new URL(selections.firstSelected?.url as string).hostname}</p>
                    </div>
                ) : (
                    <div className="text-rose-500/80 text-xs font-medium bg-rose-500/5 px-4 py-2 rounded-full border border-rose-500/10">
                        Response is not a valid audio stream
                    </div>
                )}
            </div>
        </div>
    );
};

const Placeholder = ({ text }: { text: string }) => (
    <div className="h-full flex items-center justify-center text-zinc-500 bg-[#0a0a0a]">
        <div className="text-center">
            <div className="text-4xl font-black opacity-10 mb-2 italic">AUDIO</div>
            <div className="text-sm">{text}</div>
        </div>
    </div>
);
