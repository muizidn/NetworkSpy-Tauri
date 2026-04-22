import { useEffect, useState, useMemo } from "react";
import { useAppProvider } from "@src/packages/app-env";
import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { RequestPairData } from "../../RequestTab";
import { decodeBody } from "../../utils/bodyUtils";

export const JWTDecoderMode = () => {
    const { provider } = useAppProvider();
    const { selections } = useTrafficListContext();
    const trafficId = useMemo(() => selections.firstSelected?.id as string, [selections]);
    const [requestData, setRequestData] = useState<RequestPairData | null>(null);
    const [responseData, setResponseData] = useState<RequestPairData | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!trafficId) return;
        setLoading(true);
        Promise.all([
            provider.getRequestPairData(trafficId),
            provider.getResponsePairData(trafficId)
        ]).then(([req, res]) => {
            setRequestData(req);
            setResponseData(res);
        }).finally(() => setLoading(false));
    }, [trafficId, provider]);

    const detectedTokens = useMemo(() => {
        const tokens: { source: string, token: string }[] = [];

        const scan = (data: RequestPairData | null, prefix: string) => {
            if (!data) return;
            // Check URI (for query params)
            const uri = String(selections.firstSelected?.uri || "");
            const uriMatch = uri.match(/ey[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g);
            if (uriMatch) {
                uriMatch.forEach((m: string) => {
                    if (m.split('.').length >= 2) {
                        // Prevent duplicates
                        if (!tokens.some(t => t.token === m)) {
                            tokens.push({ source: `URI Query`, token: m });
                        }
                    }
                });
            }

            // Check Headers
            data.headers.forEach(h => {
                const val = String(h.value || "");
                const matches = val.match(/ey[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g);
                if (matches) {
                    matches.forEach((m: string) => {
                        if (m.split('.').length >= 2) {
                            tokens.push({ source: `${prefix} Header: ${h.key}`, token: m });
                        }
                    });
                }
            });

            // Check Body
            const decodedBody = decodeBody(data.body);
            if (decodedBody) {
                const matches = decodedBody.match(/ey[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g);
                if (matches) {
                    matches.forEach((m: string) => {
                        if (m.split('.').length >= 2) {
                            tokens.push({ source: `${prefix} Body`, token: m });
                        }
                    });
                }
            }
        };

        scan(requestData, "Request");
        scan(responseData, "Response");

        return tokens;
    }, [requestData, responseData]);

    const [selectedTokenIndex, setSelectedTokenIndex] = useState(0);
    const currentToken = detectedTokens[selectedTokenIndex]?.token;

    const decoded = useMemo(() => {
        if (!currentToken) return null;
        try {
            const parts = currentToken.split('.');

            const base64UrlDecode = (str: string) => {
                const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
                const pad = base64.length % 4;
                const padded = pad ? base64 + "=".repeat(4 - pad) : base64;
                const jsonPayload = decodeURIComponent(atob(padded).split('').map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                return JSON.parse(jsonPayload);
            };

            const header = base64UrlDecode(parts[0]);
            const payload = base64UrlDecode(parts[1]);
            return { header, payload, signature: parts[2] };
        } catch (e) {
            console.error("JWT Decode Error", e);
            return null;
        }
    }, [currentToken]);

    if (!trafficId) return <Placeholder text="Select a request to decode JWT" />;
    if (loading) return <Placeholder text="Scanning for tokens..." />;

    return (
        <div className="h-full bg-[#0a0a0a] overflow-hidden flex flex-col">
            <div className="px-4 @sm:px-6 py-4 border-b border-zinc-800 flex justify-between items-end bg-[#0c0c0c]">
                <div>
                    <h2 className="text-xl font-black text-white italic tracking-tighter">JWT Decoder</h2>
                    <div className="text-[10px] text-zinc-500 font-bold tracking-widest mt-0.5">Deep Packet Inspection • Auth Tokens</div>
                </div>
                <div className="flex gap-2">
                    {detectedTokens.length > 1 && (
                        <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                            {detectedTokens.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setSelectedTokenIndex(i)}
                                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${selectedTokenIndex === i ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    Token {i + 1}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-auto p-4 @sm:p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    {detectedTokens.length === 0 ? (
                        <div className="py-20 text-center bg-zinc-900/20 rounded-3xl border border-dashed border-zinc-800/50">
                            <div className="text-zinc-600 text-sm mb-2 font-medium">No JSON Web Tokens detected in this exchange.</div>
                            <div className="text-[10px] text-zinc-700 tracking-widest">Scanned: Headers, Query, Cookies, Body</div>
                        </div>
                    ) : (
                        <>
                            {/* Token Preview */}
                            <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-4">
                                <div className="text-[10px] font-black text-zinc-500 mb-2 tracking-widest flex justify-between items-center">
                                    <span>Raw Token ({detectedTokens[selectedTokenIndex]?.source})</span>
                                    <span className="text-blue-500/50">MATCHED ENTROPY</span>
                                </div>
                                <div className="font-mono text-[10px] break-all text-zinc-400 leading-relaxed bg-black/30 p-3 rounded-xl border border-zinc-800/50">
                                    {currentToken?.split('.').map((part, i) => (
                                        <span key={i} className={i === 0 ? 'text-pink-400' : i === 1 ? 'text-purple-400' : 'text-cyan-400'}>
                                            {part}{i < 2 ? '.' : ''}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 @sm:grid-cols-2 gap-4 @sm:p-6">
                                {/* Header */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 px-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.5)]"></div>
                                        <h3 className="text-[10px] font-black text-zinc-400 tracking-widest">Header</h3>
                                    </div>
                                    <div className="bg-[#111] rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
                                        <div className="p-4 overflow-auto">
                                            <pre className="text-xs text-pink-300/80 font-mono leading-relaxed">
                                                {decoded ? JSON.stringify(decoded.header, null, 2) : "Invalid Header"}
                                            </pre>
                                        </div>
                                    </div>
                                </div>

                                {/* Payload */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 px-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"></div>
                                        <h3 className="text-[10px] font-black text-zinc-400 tracking-widest">Payload</h3>
                                    </div>
                                    <div className="bg-[#111] rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
                                        <div className="p-4 overflow-auto">
                                            <pre className="text-xs text-purple-300/80 font-mono leading-relaxed">
                                                {decoded ? JSON.stringify(decoded.payload, null, 2) : "Invalid Payload"}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Token Metadata/Info */}
                            <div className="grid grid-cols-1 @sm:grid-cols-3 gap-4">
                                <div className="bg-zinc-900/30 border border-zinc-800/50 p-4 rounded-2xl">
                                    <div className="text-[9px] font-bold text-zinc-500 mb-1">Algorithm</div>
                                    <div className="text-sm font-black text-white">{decoded?.header?.alg || 'Unknown'}</div>
                                </div>
                                <div className="bg-zinc-900/30 border border-zinc-800/50 p-4 rounded-2xl">
                                    <div className="text-[9px] font-bold text-zinc-500 mb-1">Issued At</div>
                                    <div className="space-y-1">
                                        <div className="text-xs font-black text-white">
                                            {decoded?.payload?.iat ? new Date(decoded.payload.iat * 1000).toUTCString() : 'N/A'}
                                            <span className="ml-2 text-[8px] text-blue-500/50 font-bold tracking-tighter">UTC</span>
                                        </div>
                                        <div className="text-[10px] text-zinc-400 font-mono">
                                            {decoded?.payload?.iat ? new Date(decoded.payload.iat * 1000).toLocaleString() : 'N/A'}
                                            <span className="ml-2 text-[8px] text-zinc-600 font-bold tracking-tighter">Local</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-zinc-900/30 border border-zinc-800/50 p-4 rounded-2xl">
                                    <div className="text-[9px] font-bold text-zinc-500 mb-1">Expires</div>
                                    <div className="space-y-1">
                                        <div className="text-xs font-black text-white">
                                            {decoded?.payload?.exp ? new Date(decoded.payload.exp * 1000).toUTCString() : 'N/A'}
                                            <span className="ml-2 text-[8px] text-blue-500/50 font-bold tracking-tighter">UTC</span>
                                        </div>
                                        <div className="text-[10px] text-zinc-400 font-mono">
                                            {decoded?.payload?.exp ? new Date(decoded.payload.exp * 1000).toLocaleString() : 'N/A'}
                                            <span className="ml-2 text-[8px] text-zinc-600 font-bold tracking-tighter">Local</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const Placeholder = ({ text }: { text: string }) => (
    <div className="h-full flex items-center justify-center text-zinc-500 bg-[#0a0a0a]">
        <div className="text-center">
            <div className="text-4xl font-black opacity-10 mb-2">JWT</div>
            <div className="text-sm">{text}</div>
        </div>
    </div>
);
