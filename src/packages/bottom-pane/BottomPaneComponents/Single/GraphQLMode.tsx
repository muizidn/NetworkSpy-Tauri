import { useEffect, useState, useMemo } from "react";
import { invoke } from "@tauri-apps/api";
import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { RequestPairData } from "../../RequestTab";
import { Editor } from "@monaco-editor/react";

export const GraphQLMode = () => {
  const { selections } = useTrafficListContext();
  const trafficId = useMemo(() => selections.firstSelected?.id as string, [selections]);
  const [data, setData] = useState<RequestPairData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!trafficId) return;
    setLoading(true);
    invoke<RequestPairData>("get_request_pair_data", { trafficId })
      .then((res) => setData(res))
      .finally(() => setLoading(false));
  }, [trafficId]);

  const gqlData = useMemo(() => {
    if (!data?.body) return null;
    try {
      const parsed = JSON.parse(data.body);
      if (parsed.query) {
        return {
          query: parsed.query,
          variables: parsed.variables ? JSON.stringify(parsed.variables, null, 2) : "{}",
          operationName: parsed.operationName || "Unnamed Operation",
        };
      }
    } catch (e) {
      // Not JSON or doesn't have query
    }
    return null;
  }, [data]);

  if (!trafficId) return <Placeholder text="Select a request to view GraphQL details" />;
  if (loading) return <Placeholder text="Loading GraphQL data..." />;
  if (!gqlData) return <Placeholder text="No GraphQL query detected in this request. Make sure it's a JSON POST with a 'query' field." />;

  return (
    <div className="h-full bg-[#1e1e1e] flex flex-col">
      <div className="flex items-center px-4 py-2 border-b border-zinc-800 bg-zinc-900 justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold bg-pink-600 text-white px-2 py-0.5 rounded">GQL</span>
          <span className="text-sm font-mono text-zinc-300">{gqlData.operationName}</span>
        </div>
      </div>
      
      <div className="flex-grow grid grid-cols-2 overflow-hidden">
        <div className="flex flex-col border-r border-zinc-800">
          <div className="bg-zinc-900 px-3 py-1 text-[10px] uppercase font-bold text-zinc-500 border-b border-zinc-800">Query</div>
          <div className="flex-grow relative">
            <Editor
              height="100%"
              defaultLanguage="graphql"
              theme="vs-dark"
              value={gqlData.query}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 12,
                scrollBeyondLastLine: false,
                lineNumbers: "on",
                renderLineHighlight: "none",
              }}
            />
          </div>
        </div>
        
        <div className="flex flex-col">
          <div className="bg-zinc-900 px-3 py-1 text-[10px] uppercase font-bold text-zinc-500 border-b border-zinc-800">Variables</div>
          <div className="flex-grow relative border-b border-zinc-800">
            <Editor
              height="100%"
              defaultLanguage="json"
              theme="vs-dark"
              value={gqlData.variables}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 12,
                scrollBeyondLastLine: false,
                lineNumbers: "on",
                renderLineHighlight: "none",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const Placeholder = ({ text }: { text: string }) => (
  <div className="h-full flex items-center justify-center text-zinc-500 bg-[#1e1e1e] p-10 text-center">
    <div>
      <div className="text-4xl mb-4 text-zinc-700 font-bold opacity-20">GraphQL</div>
      <div className="text-sm max-w-md mx-auto">{text}</div>
    </div>
  </div>
);
