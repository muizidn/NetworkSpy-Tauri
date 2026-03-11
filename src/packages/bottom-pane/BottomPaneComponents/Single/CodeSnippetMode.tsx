import { useEffect, useState, useMemo } from "react";
import { invoke } from "@tauri-apps/api";
import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { RequestPairData } from "../../RequestTab";
import { Editor } from "@monaco-editor/react";

export const CodeSnippetMode = () => {
    const { selections } = useTrafficListContext();
    const trafficId = useMemo(() => selections.firstSelected?.id as string, [selections]);
    const [data, setData] = useState<RequestPairData | null>(null);
    const [loading, setLoading] = useState(false);
    const [lang, setLang] = useState("javascript");
  
    useEffect(() => {
      if (!trafficId) return;
      setLoading(true);
      invoke<RequestPairData>("get_request_pair_data", { trafficId })
        .then((res) => setData(res))
        .finally(() => setLoading(false));
    }, [trafficId]);

    const snippet = useMemo(() => {
        if (!data || !selections.firstSelected) return "";
        const item = selections.firstSelected;
        
        if (lang === "javascript") {
            return `fetch('${item.url}', {
    method: '${item.method}',
    headers: {
${data.headers.map(h => `        '${h.key}': '${h.value}'`).join(",\n")}
    }${data.body ? `,\n    body: JSON.stringify(${data.body})` : ""}
})
.then(response => response.json())
.then(data => console.log(data));`;
        }

        if (lang === "python") {
            return `import requests

url = '${item.url}'
headers = {
${data.headers.map(h => `    '${h.key}': '${h.value}'`).join(",\n")}
}
${data.body ? `data = ${data.body}\n` : ""}
response = requests.${String(item.method).toLowerCase()}(url, headers=headers${data.body ? ", json=data" : ""})
print(response.json())`;
        }

        return "// Language not implemented yet";
    }, [data, selections.firstSelected, lang]);
  
    if (!trafficId) return <Placeholder text="Select a request to generate code" />;
    if (loading) return <Placeholder text="Generating..." />;
  
    return (
      <div className="h-full bg-[#1e1e1e] flex flex-col">
         <div className="p-2 bg-zinc-900 border-b border-zinc-800 flex gap-4">
             {["javascript", "python"].map(l => (
                 <button 
                   key={l}
                   onClick={() => setLang(l)}
                   className={`text-[10px] font-bold uppercase tracking-widest ${lang === l ? 'text-blue-500' : 'text-zinc-500'}`}
                 >
                     {l}
                 </button>
             ))}
         </div>
         <div className="flex-grow relative">
            <Editor
              height="100%"
              language={lang}
              theme="vs-dark"
              value={snippet}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 12,
                scrollBeyondLastLine: false,
                lineNumbers: "on",
              }}
            />
         </div>
      </div>
    );
  };
  
  const Placeholder = ({ text }: { text: string }) => (
      <div className="h-full flex items-center justify-center text-zinc-500 bg-[#1e1e1e]">
          <div className="text-center">
              <div className="text-4xl font-bold opacity-10 mb-2">CODE SNIPPET</div>
              <div className="text-sm">{text}</div>
          </div>
      </div>
  );
