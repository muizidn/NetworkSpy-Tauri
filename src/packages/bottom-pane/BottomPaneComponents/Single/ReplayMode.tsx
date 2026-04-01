import { useEffect, useState, useMemo } from "react";
import { useAppProvider } from "@src/packages/app-env";
import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { RequestPairData } from "../../RequestTab";

export const ReplayMode = () => {
  const { provider } = useAppProvider();
  const { selections } = useTrafficListContext();
  const trafficId = useMemo(() => selections.firstSelected?.id as string, [selections]);
  const [data, setData] = useState<RequestPairData | null>(null);
  const [replaying, setReplaying] = useState(false);
  const [replays, setReplays] = useState<any[]>([]);

  useEffect(() => {
    if (!trafficId) return;
    provider.getRequestPairData(trafficId)
      .then((res) => setData(res));
  }, [trafficId, provider]);

  const handleReplay = () => {
    setReplaying(true);
    // Mock replay
    setTimeout(() => {
      setReplays(prev => [{
        id: Date.now(),
        time: new Date().toLocaleTimeString(),
        status: "200",
        duration: "124ms"
      }, ...prev]);
      setReplaying(false);
    }, 1500);
  };

  if (!trafficId) return <div className="h-full flex items-center justify-center text-zinc-500">Select a request to replay</div>;

  return (
    <div className="h-full bg-[#1e1e1e] p-4 @sm:p-6 flex flex-col items-center overflow-auto">
      <div className="max-w-xl w-full">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 mb-8 text-center shadow-xl">
          <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-purple-900/40">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Request Replayer</h3>
          <p className="text-xs text-zinc-500 mb-6 uppercase tracking-widest font-black">ID: {trafficId}</p>

          <button
            onClick={handleReplay}
            disabled={replaying}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-8 rounded-full transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center gap-3 mx-auto"
          >
            {replaying ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : null}
            {replaying ? 'Replaying...' : 'Execute Replay'}
          </button>
        </div>

        <div className="space-y-4">
          <h4 className="text-[10px] font-black uppercase text-zinc-600 tracking-widest pl-2">Previous Replays</h4>
          <div className="space-y-2">
            {replays.length === 0 ? (
              <div className="text-center py-8 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-lg text-zinc-600 text-xs">No replay history for this session</div>
            ) : (
              replays.map(r => (
                <div key={r.id} className="flex items-center justify-between bg-zinc-900 p-3 rounded-lg border border-zinc-800 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-3">
                    <span className="bg-green-900/30 text-green-500 text-[10px] font-bold px-1.5 py-0.5 rounded border border-green-900/50">{r.status}</span>
                    <span className="text-xs text-zinc-300">{r.time}</span>
                  </div>
                  <span className="text-xs text-zinc-500 font-mono">{r.duration}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
