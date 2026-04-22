import { useEffect, useState, useMemo } from "react";
import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { useAppProvider } from "@src/packages/app-env";
import { FiTarget, FiActivity, FiUser, FiInfo, FiHash } from "react-icons/fi";
import { SiFacebook, SiGoogleads, SiGoogleanalytics, SiTiktok, SiLinkedin } from "react-icons/si";

export const AdsViewerMode = () => {
    const { selections } = useTrafficListContext();
    const { provider } = useAppProvider();
    const trafficId = useMemo(() => selections.firstSelected?.id as string, [selections]);

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!trafficId) return;
        setLoading(true);
        provider.getRequestPairData(trafficId)
            .then(res => setData(res))
            .finally(() => setLoading(false));
    }, [trafficId, provider]);

    const url = data?.request?.url || "";
    const queryParams = useMemo(() => {
        if (!url) return {};
        try {
            const urlObj = new URL(url);
            return Object.fromEntries(urlObj.searchParams.entries());
        } catch {
            return {};
        }
    }, [url]);

    const adNetwork = useMemo(() => {
        if (!url) return "Generic Tracker";
        if (url.includes("facebook.com/tr") || url.includes("connect.facebook.net")) return "Meta Pixel";
        if (url.includes("google-analytics.com") || url.includes("googletagmanager.com/gtm.js") || url.includes("analytics.google.com")) return "Google Analytics";
        if (url.includes("google.com/ads") || url.includes("doubleclick.net") || url.includes("googleadservices.com")) return "Google Ads";
        if (url.includes("tiktok.com/api/v1/pixel")) return "TikTok Pixel";
        if (url.includes("snapchat.com/tr")) return "Snapchat Pixel";
        if (url.includes("linkedin.com/collect")) return "LinkedIn Insight";
        return "Generic Tracker";
    }, [url]);

    const extractedData = useMemo(() => {
        const res: any = {
            pixelId: "N/A",
            event: "Unknown",
            params: {},
            userData: {}
        };

        if (adNetwork === "Meta Pixel") {
            res.pixelId = queryParams["id"] || "N/A";
            res.event = queryParams["ev"] || "N/A";
            // Meta often encodes custom data in 'cd' and user data in 'ud'
            const cd = queryParams["cd"];
            if (cd) {
                try { res.params = JSON.parse(cd); } catch { res.params = { raw: cd }; }
            }
            const ud = queryParams["ud"];
            if (ud) {
                try { res.userData = JSON.parse(ud); } catch { res.userData = { raw: ud }; }
            }
        } else if (adNetwork === "Google Analytics") {
            res.pixelId = queryParams["tid"] || queryParams["en"] || "N/A";
            res.event = queryParams["en"] || queryParams["t"] || "N/A";
            res.params = queryParams;
        } else if (adNetwork === "TikTok Pixel") {
            res.pixelId = queryParams["pixel_code"] || "N/A";
            res.event = queryParams["event"] || "N/A";
        }

        return res;
    }, [adNetwork, queryParams]);

    if (!trafficId) return <Placeholder text="Select an Ad/Tracker request to inspect" />;

    const getIcon = () => {
        switch (adNetwork) {
            case "Meta Pixel": return <SiFacebook className="text-blue-500" />;
            case "Google Analytics": return <SiGoogleanalytics className="text-orange-500" />;
            case "Google Ads": return <SiGoogleads className="text-blue-400" />;
            case "TikTok Pixel": return <SiTiktok className="text-pink-500" />;
            case "LinkedIn Insight": return <SiLinkedin className="text-blue-700" />;
            default: return <FiTarget className="text-zinc-500" />;
        }
    }

    return (
        <div className="h-full bg-[#050505] flex flex-col overflow-hidden">
            <div className="flex flex-col @sm:flex-row items-start @sm:items-center px-4 @sm:px-4 @sm:px-6 py-4 border-b border-zinc-900 bg-[#0a0a0a] justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                        {getIcon()}
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-white tracking-tighter">{adNetwork} Inspector</h2>
                        <div className="text-[9px] text-zinc-500 font-bold tracking-widest">Marketing & Ads Network</div>
                    </div>
                </div>
            </div>

            <div className="flex-grow p-4 @sm:p-4 @sm:p-6 overflow-y-auto no-scrollbar pb-10">
                <div className="grid grid-cols-1 @sm:grid-cols-2 gap-4 max-w-6xl">
                    {/* Target Card */}
                    <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-4 text-emerald-500">
                            <FiTarget size={16} />
                            <h3 className="text-xs font-black text-zinc-400 tracking-wider">Target Identity</h3>
                        </div>
                        <div className="space-y-3">
                            <DetailRow label="Account ID" value={extractedData.pixelId} isCode />
                            <DetailRow label="Network" value={adNetwork} />
                        </div>
                    </div>

                    {/* Event Card */}
                    <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-4 text-blue-500">
                            <FiActivity size={16} />
                            <h3 className="text-xs font-black text-zinc-400 tracking-wider">Event Trigger</h3>
                        </div>
                        <div className="space-y-3">
                            <DetailRow label="Event Name" value={extractedData.event} />
                            <DetailRow label="Method" value={data?.request?.method || "GET"} />
                        </div>
                    </div>

                    {/* User Data Card (if any) */}
                    {Object.keys(extractedData.userData).length > 0 && (
                        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 @sm:col-span-2">
                            <div className="flex items-center gap-2 mb-4 text-purple-500">
                                <FiUser size={16} />
                                <h3 className="text-xs font-black text-zinc-400 tracking-wider">Hashed User Information</h3>
                            </div>
                            <div className="grid grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-3 gap-3">
                                {Object.entries(extractedData.userData).map(([k, v]) => (
                                    <DetailRow key={k} label={k} value={String(v)} isCode />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Payload Card */}
                    <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 @sm:col-span-2">
                        <div className="flex items-center gap-2 mb-4 text-amber-500">
                            <FiHash size={16} />
                            <h3 className="text-xs font-black text-zinc-400 tracking-wider">Custom Event Data</h3>
                        </div>
                        <div className="bg-black/50 rounded-xl p-4 font-mono text-xs overflow-x-auto border border-zinc-800/50">
                            <pre className="text-zinc-300">
                                {Object.keys(extractedData.params).length > 0
                                    ? JSON.stringify(extractedData.params, null, 2)
                                    : "// No additional parameters detected"}
                            </pre>
                        </div>
                    </div>

                    <div className="@sm:col-span-2 opacity-50">
                        <div className="flex items-start gap-2 p-4 bg-zinc-900/20 border border-zinc-800 rounded-xl">
                            <FiInfo className="mt-0.5 text-zinc-500" size={14} />
                            <p className="text-[10px] text-zinc-500 leading-relaxed font-bold tracking-tight">
                                Ad networks often obfuscate user identifiers using SHA-256 hashing before transmission.
                                NetworkSpy helps you verify that correctly formatted data is being sent to your marketing partners.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DetailRow = ({ label, value, isCode }: { label: string, value: string, isCode?: boolean }) => (
    <div className="flex justify-between items-center text-[11px]">
        <span className="text-zinc-500 font-bold tracking-tighter">{label}</span>
        <span className={`${isCode ? 'font-mono bg-zinc-800/50 px-1.5 py-0.5 rounded text-[10px]' : 'font-black'} text-zinc-200 truncate max-w-[200px]`}>{value}</span>
    </div>
);

const Placeholder = ({ text }: { text: string }) => (
    <div className="h-full flex flex-col items-center justify-center bg-[#050505] p-6 @sm:p-10 text-center">
        <div className="w-16 h-16 @sm:w-20 @sm:h-20 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-800 mb-6 border border-zinc-800">
            <FiTarget className="w-8 h-8 @sm:w-10 @sm:h-10 opacity-20" />
        </div>
        <h3 className="text-zinc-400 font-bold mb-1 italic tracking-widest text-xs">Ads Inspector</h3>
        <p className="text-[10px] text-zinc-600 max-w-[200px] leading-relaxed font-bold tracking-tight">{text}</p>
    </div>
);

export default AdsViewerMode;
