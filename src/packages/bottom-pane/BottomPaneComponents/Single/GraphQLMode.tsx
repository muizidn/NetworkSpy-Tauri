import { useEffect, useState, useMemo } from "react";
import { invoke } from "@tauri-apps/api";
import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { RequestPairData } from "../../RequestTab";
import { Editor } from "@monaco-editor/react";
import { twMerge } from "tailwind-merge";
import { FiActivity, FiCpu, FiBox, FiTerminal, FiInfo, FiLayers, FiCode } from "react-icons/fi";

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
    } catch (e) {}
    return null;
  }, [data]);

  const mockGqlData = {
    query: `query GetUserDetails($userId: ID!, $includePosts: Boolean!) {
  user(id: $userId) {
    id
    username
    email
    profile {
      avatarUrl
      bio
      location
      joinedDate
    }
    posts(first: 10) @include(if: $includePosts) {
      edges {
        node {
          id
          title
          excerpt
          createdAt
          likesCount
          commentsCount
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
    followersCount
    followingCount
  }
}`,
    variables: JSON.stringify({ 
        userId: "u_9821_alpha",
        includePosts: true
    }, null, 2),
    operationName: "GetUserDetails",
  };

  const activeData = gqlData || mockGqlData;

  if (!trafficId && !activeData) return <Placeholder text="Select a request to view GraphQL details" />;
  if (loading) return <Placeholder text="Loading GraphQL data..." />;

  return (
    <div className="h-full bg-[#0d0d0d] flex flex-col font-sans overflow-hidden">
      {/* Dynamic Header */}
      <div className="flex items-center px-4 py-3 border-b border-zinc-800 bg-zinc-900 justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-pink-600 flex items-center justify-center text-white font-bold shadow-lg shadow-pink-900/20">
            <FiActivity size={18} />
          </div>
          <div>
            <div className="text-sm font-bold text-zinc-200">{activeData.operationName}</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">GRAPHQL OPERATION</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800 rounded-full border border-zinc-700 shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-zinc-400">QUERY</span>
            </div>
        </div>
      </div>
      
      <div className="flex-grow flex overflow-hidden">
        {/* Main Content Areas */}
        <div className="flex-grow grid grid-cols-2 overflow-hidden bg-black/20">
            {/* Editor Pane: Query */}
            <div className="flex flex-col border-r border-zinc-900">
                <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800/50 bg-zinc-900/30">
                    <FiCode className="text-pink-500" size={14} />
                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Query Body</span>
                </div>
                <div className="flex-grow bg-black/30">
                    <Editor
                        height="100%"
                        defaultLanguage="graphql"
                        theme="vs-dark"
                        value={activeData.query}
                        options={{
                            readOnly: true,
                            minimap: { enabled: false },
                            fontSize: 12,
                            fontFamily: "JetBrains Mono, Menlo, monospace",
                            scrollBeyondLastLine: false,
                            lineNumbers: "on",
                            renderLineHighlight: "all",
                            padding: { top: 16 }
                        }}
                    />
                </div>
            </div>

            {/* Editor Pane: Variables */}
            <div className="flex flex-col">
                <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800/50 bg-zinc-900/30">
                    <FiLayers className="text-blue-500" size={14} />
                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Variables</span>
                </div>
                <div className="flex-grow bg-black/30">
                    <Editor
                        height="100%"
                        defaultLanguage="json"
                        theme="vs-dark"
                        value={activeData.variables}
                        options={{
                            readOnly: true,
                            minimap: { enabled: false },
                            fontSize: 12,
                            fontFamily: "JetBrains Mono, Menlo, monospace",
                            scrollBeyondLastLine: false,
                            lineNumbers: "on",
                            renderLineHighlight: "all",
                            padding: { top: 16 }
                        }}
                    />
                </div>
            </div>
        </div>

        {/* Intelligence Sidebar */}
        <div className="w-64 border-l border-zinc-800 bg-[#111] flex flex-col shrink-0">
            <div className="p-4 border-b border-zinc-800 bg-black/20">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 block mb-4">Inspection</span>
                
                <div className="space-y-4">
                    <SidebarItem icon={<FiCpu size={14} />} label="Validation" value="Success" color="text-emerald-500" />
                    <SidebarItem icon={<FiBox size={14} />} label="Nested Depth" value="4 Levels" />
                    <SidebarItem icon={<FiInfo size={14} />} label="Type" value="Query" />
                </div>
            </div>

            <div className="p-5 flex-grow">
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 block mb-4">Field Coverage</span>
                 <div className="space-y-4">
                    <ProgressField label="Selection Set" percentage={75} color="bg-pink-500" />
                    <ProgressField label="Arguments" percentage={40} color="bg-blue-500" />
                    <ProgressField label="Directives" percentage={15} color="bg-zinc-600" />
                 </div>
            </div>

            <div className="mt-auto p-4 border-t border-zinc-800 bg-black/40">
                <div className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest leading-relaxed">
                    Detected v1.4 GQL Schema <br/>
                    <span className="text-zinc-700">Apollo Client 3.0 compatible</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const SidebarItem = ({ icon, label, value, color }: { icon: any, label: string, value: string, color?: string }) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-400">
            {icon}
            <span className="text-[10px] font-bold tracking-tight">{label}</span>
        </div>
        <span className={twMerge("text-[10px] font-mono font-bold", color || "text-zinc-200")}>{value}</span>
    </div>
);

const ProgressField = ({ label, percentage, color }: { label: string, percentage: number, color: string }) => (
    <div className="space-y-2">
        <div className="flex justify-between text-[9px] font-bold uppercase tracking-tighter">
            <span className="text-zinc-500">{label}</span>
            <span className="text-zinc-300">{percentage}%</span>
        </div>
        <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div className={twMerge("h-full rounded-full transition-all duration-1000", color)} style={{ width: `${percentage}%` }} />
        </div>
    </div>
);

const Placeholder = ({ text }: { text: string }) => (
  <div className="h-full flex items-center justify-center text-zinc-500 bg-[#1e1e1e] p-10 text-center">
    <div>
      <div className="text-4xl mb-4 text-zinc-700 font-bold opacity-20">GraphQL</div>
      <div className="text-sm max-w-md mx-auto">{text}</div>
    </div>
  </div>
);
