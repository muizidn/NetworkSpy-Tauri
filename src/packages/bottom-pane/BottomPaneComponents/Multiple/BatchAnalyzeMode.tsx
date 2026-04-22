import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { useMemo } from "react";

export const BatchAnalyzeMode = () => {
    const { selections } = useTrafficListContext();
    const selectedItems = selections.others || [];

    const analysis = useMemo(() => {
        const total = selectedItems.length;
        const totalDuration = selectedItems.reduce((acc, item) => {
            const d = String(item.duration || "0ms").replace('ms', '');
            return acc + (parseInt(d) || 0);
        }, 0);

        const domains: Record<string, number> = {};
        selectedItems.forEach(item => {
            try {
                const url = new URL(String(item.url));
                domains[url.hostname] = (domains[url.hostname] || 0) + 1;
            } catch (e) { }
        });

        return { total, avgDuration: total > 0 ? (totalDuration / total).toFixed(1) : 0, domains };
    }, [selectedItems]);

    if (selectedItems.length === 0) {
        return <div className="h-full flex items-center justify-center text-zinc-500">Select multiple items for batch analysis</div>;
    }

    return (
        <div className="h-full bg-[#1e1e1e] p-4 @sm:p-6 overflow-auto">
            <div className="max-w-3xl mx-auto">
                <h2 className="text-xl font-bold mb-8 text-pink-500 flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    Batch Analysis
                </h2>

                <div className="grid grid-cols-1 @sm:grid-cols-2 gap-4 @sm:p-6 mb-8">
                    <div className="bg-zinc-900 p-4 @sm:p-6 rounded-2xl border border-zinc-800 shadow-xl">
                        <div className="text-[10px] font-black text-zinc-500 mb-1">Performance</div>
                        <div className="text-3xl font-bold text-white">{analysis.avgDuration}ms</div>
                        <div className="text-xs text-zinc-500 mt-1">Average Response Time</div>
                    </div>
                    <div className="bg-zinc-900 p-4 @sm:p-6 rounded-2xl border border-zinc-800 shadow-xl">
                        <div className="text-[10px] font-black text-zinc-500 mb-1">Scale</div>
                        <div className="text-3xl font-bold text-white">{analysis.total}</div>
                        <div className="text-xs text-zinc-500 mt-1">Parallel Requests Processed</div>
                    </div>
                </div>

                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                    <div className="px-4 @sm:px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
                        <h3 className="text-xs font-bold tracking-widest text-zinc-400">Domain Distribution</h3>
                    </div>
                    <div className="p-4 @sm:p-6 space-y-4">
                        {Object.entries(analysis.domains).map(([domain, count]) => (
                            <div key={domain} className="flex flex-col gap-1">
                                <div className="flex justify-between text-xs font-mono">
                                    <span className="text-zinc-300">{domain}</span>
                                    <span className="text-pink-500 font-bold">{count}</span>
                                </div>
                                <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                                    <div className="bg-pink-600 h-full rounded-full" style={{ width: `${(count / analysis.total) * 100}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
