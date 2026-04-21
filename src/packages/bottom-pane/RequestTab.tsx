import { OnMount } from "@monaco-editor/react";
import { useEffect, useMemo, useState } from "react";
import { useTrafficListContext } from "../main-content/context/TrafficList";
import { NSTabs, Tab } from "../ui/NSTabs";
import { TableView } from "../ui/TableView";
import { KeyValueRenderer } from "./KeyValueRenderer";
import { decodeBody } from "./utils/bodyUtils";
import { MonacoEditor } from "../ui/MonacoEditor";

export type RequestPairData = {
  headers: { key: string; value: string }[];
  params: { key: string; value: string | string[] }[];
  body?: Uint8Array;
  body_path?: string | null;
  content_type: string;
  intercepted: boolean;
};

export const RequestTab = (props: {
  loadData: (traffic: { id: string }) => Promise<RequestPairData>;
}) => {
  const { selections } = useTrafficListContext();
  const trafficId = useMemo(
    () => selections.firstSelected?.id as string,
    [selections]
  );

  const [data, setData] = useState<RequestPairData | null>(null);

  async function loadRequestPairData(traffic: { id: string }) {
    const requestPairData = await props.loadData(traffic);
    setData(requestPairData);
  }

  useEffect(() => {
    if (!trafficId) {
      return;
    }
    loadRequestPairData({ id: trafficId as string });
  }, [trafficId]);

  const [isBeautified, setIsBeautified] = useState(false);

  const decodedBody = useMemo(() => {
    const raw = decodeBody(data?.body, data?.content_type);
    const ct = data?.content_type.toLowerCase() || "";

    if (isBeautified) {
      try {
        // Try standard JSON first
        return JSON.stringify(JSON.parse(raw), null, 2);
      } catch (e) {
        // If not standard JSON, check if it's a known JSON type to try stream strategy
        if (ct.includes("json") || ct.includes("stream")) {
          try {
            const objects: string[] = [];

            // Strategy 1: Line-separated
            const lines = raw.split(/\n/).filter(l => l.trim().length > 0);
            let success = false;

            if (lines.length > 1) {
              const parsedLines = lines.map(line => {
                try { return JSON.stringify(JSON.parse(line), null, 2); }
                catch { return null; }
              });
              if (parsedLines.every(pl => pl !== null)) {
                return parsedLines.join("\n\n---\n\n");
              }
            }

            // Strategy 2: Concatenated braces {...}{...}
            let braceCount = 0;
            let currentObject = "";
            let inString = false;

            for (let i = 0; i < raw.length; i++) {
              const char = raw[i];
              currentObject += char;

              if (char === '"' && raw[i - 1] !== '\\') inString = !inString;
              if (!inString) {
                if (char === '{') braceCount++;
                if (char === '}') braceCount--;
              }

              if (braceCount === 0 && currentObject.trim().length > 0) {
                try {
                  const parsed = JSON.parse(currentObject);
                  objects.push(JSON.stringify(parsed, null, 2));
                  currentObject = "";
                } catch {
                  // Keep appending
                }
              }
            }

            if (objects.length > 0) {
              return objects.join("\n\n/* --- Stream Object --- */\n\n");
            }
          } catch (err) {
            console.error("JSON Stream parse failed:", err);
          }
          return raw;
        }
      }
      return raw;
    }
    return raw
  }, [data?.body, data?.content_type, isBeautified]);

  const isJson = useMemo(() => {
    if (!data) return false;
    if (data.content_type.includes("json") || data.content_type.includes("stream")) return true;
    const raw = decodeBody(data.body, data.content_type);
    try {
      JSON.parse(raw);
      return true;
    } catch {
      return false;
    }
  }, [data?.body, data?.content_type]);

  if (!trafficId || !data) {
    return null;
  }

  const tabs: Tab[] = [
    {
      id: "header",
      title: "Headers",
      content: (
        <TableView
          headers={[
            {
              title: "Key",
              minWidth: 250,
              renderer: new KeyValueRenderer("key"),
            },
            {
              title: "Value",
              minWidth: 250,
              renderer: new KeyValueRenderer("value"),
            },
          ]}
          data={data.headers}
        />
      ),
    },
    {
      id: "params",
      title: "Params",
      content: (
        <TableView
          headers={[
            {
              title: "Key",
              minWidth: 250,
              renderer: new KeyValueRenderer("key"),
            },
            {
              title: "Value",
              minWidth: 250,
              renderer: new KeyValueRenderer("value"),
            },
          ]}
          data={data.params.map(p => ({ key: p.key, value: Array.isArray(p.value) ? p.value.join(', ') : p.value }))}
        />
      ),
    },
    {
      id: "body",
      title: "Body",
      content: (
        <div className='h-full bg-[#1e1e1e] relative'>
          {isJson && (
            <button
              onClick={() => setIsBeautified(!isBeautified)}
              className={`absolute top-4 right-10 z-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md border transition-all duration-300 shadow-xl opacity-50 hover:opacity-100 ${isBeautified
                ? "bg-blue-600 border-blue-400 text-white shadow-blue-900/40 opacity-100"
                : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
                }`}
            >
              {isBeautified ? "Original" : "Beautify"}
            </button>
          )}
          <MonacoEditor
            height="100%"
            language={data.content_type.includes("json") ? "json" : "text"}
            theme="vs-dark"
            value={decodedBody}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 12,
              scrollBeyondLastLine: false,
              wordWrap: "on",
            }}
          />
        </div>
      ),
    },
  ];

  return <NSTabs title="REQUEST" tabs={tabs} initialTab="header" designStyle="basic" />;
};
