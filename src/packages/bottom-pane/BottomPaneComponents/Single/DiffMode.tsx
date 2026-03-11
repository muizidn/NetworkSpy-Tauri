import { useEffect, useState, useMemo } from "react";
import { invoke } from "@tauri-apps/api";
import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { RequestPairData } from "../../RequestTab";
import { DiffEditor } from "@monaco-editor/react";

export const DiffMode = () => {
  const { selections } = useTrafficListContext();
  const trafficId = useMemo(() => selections.firstSelected?.id as string, [selections]);
  const [reqData, setReqData] = useState<RequestPairData | null>(null);
  const [resData, setResData] = useState<RequestPairData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!trafficId) return;
    setLoading(true);
    Promise.all([
        invoke<RequestPairData>("get_request_pair_data", { trafficId }),
        invoke<RequestPairData>("get_response_pair_data", { trafficId })
    ]).then(([req, res]) => {
        setReqData(req);
        setResData(res);
    }).finally(() => setLoading(false));
  }, [trafficId]);

  if (!trafficId) return <Placeholder text="Select a request to view Diff" />;
  if (loading) return <Placeholder text="Loading data for comparison..." />;

  return (
    <div className="h-full bg-[#1e1e1e] flex flex-col">
      <div className="flex items-center px-4 py-2 border-b border-zinc-800 bg-zinc-900 justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black bg-yellow-600 text-white px-2 py-0.5 rounded uppercase tracking-tighter">Diff View</span>
          <span className="text-[10px] text-zinc-500 font-mono uppercase">Request Body (Left) vs Response Body (Right)</span>
        </div>
      </div>
      
      <div className="flex-grow relative">
        <DiffEditor
          height="100%"
          language="json"
          theme="vs-dark"
          original={reqData?.body || ""}
          modified={resData?.body || ""}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 12,
            renderSideBySide: true,
            scrollBeyondLastLine: false,
          }}
        />
      </div>
    </div>
  );
};

const Placeholder = ({ text }: { text: string }) => (
    <div className="h-full flex items-center justify-center text-zinc-500 bg-[#1e1e1e]">
      <div className="text-center">
        <div className="text-4xl font-bold opacity-10 mb-2">DIFF</div>
        <div className="text-sm">{text}</div>
      </div>
    </div>
);
