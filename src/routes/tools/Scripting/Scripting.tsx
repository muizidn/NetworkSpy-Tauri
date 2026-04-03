import { ToolMethod } from "@src/models/ToolMethod";
import { Renderer, TableView } from "@src/packages/ui/TableView";
import React, { useEffect, useState } from "react";
import { ToolBaseHeader } from "@src/packages/ui/ToolBaseHeader";
import { FiCode, FiCheck, FiPlus, FiTrash2, FiEdit2 } from "react-icons/fi";
import { twMerge } from "tailwind-merge";
import { invoke } from "@tauri-apps/api/core";
import { ScriptEditor } from "./ScriptEditor";

export interface ScriptingModel {
  id: string;
  enabled: boolean;
  name: string;
  method: string;
  matchingRule: string;
  script: string;
  request: boolean;
  response: boolean;
  error?: string;
}

export class ScriptingCellRenderer implements Renderer<ScriptingModel> {
  type: keyof ScriptingModel | "actions";
  onAction?: (action: "toggle" | "delete" | "edit" | "toggle-req" | "toggle-res") => void;

  constructor(type: keyof ScriptingModel | "actions", onAction?: (action: "toggle" | "delete" | "edit" | "toggle-req" | "toggle-res") => void) {
    this.type = type;
    this.onAction = onAction;
  }

  render({ input }: { input: ScriptingModel }): React.ReactNode {
    let content: React.ReactNode;

    switch (this.type) {
      case "enabled":
        const isChecked = input.enabled;
        content = (
          <button
            onClick={() => this.onAction?.("toggle")}
            className={twMerge(
                "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                isChecked 
                    ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/40" 
                    : "bg-zinc-900 border-zinc-800 text-transparent hover:border-zinc-700"
            )}
          >
            <FiCheck size={12} />
          </button>
        );
        break;
      case "request":
      case "response":
        const val = input[this.type] as boolean;
        content = (
          <button
            onClick={() => this.onAction?.(this.type === "request" ? "toggle-req" : "toggle-res")}
            className={twMerge(
                "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                val 
                    ? "bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-900/40" 
                    : "bg-zinc-900 border-zinc-800 text-transparent hover:border-zinc-700"
            )}
          >
            <FiCheck size={12} />
          </button>
        );
        break;
      case "name":
        content = <span className="font-bold text-zinc-200">{input.name}</span>;
        break;
      case "error":
        content = input.error ? (
          <span className="text-[10px] text-red-500 font-mono truncate max-w-[200px]" title={input.error}>
            {input.error}
          </span>
        ) : (
          <span className="text-[10px] text-zinc-600 italic">None</span>
        );
        break;
      case "method":
        content = (
            <span className={twMerge(
                "px-2 py-0.5 rounded text-[10px] font-black tracking-widest border uppercase",
                input.method === 'GET' ? 'bg-blue-950/30 text-blue-400 border-blue-900/50' 
                : input.method === 'ALL' || input.method === 'ANY' ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                : 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50'
            )}>
                {input.method}
            </span>
        );
        break;
      case "matchingRule":
        content = <span className="font-mono text-zinc-500 truncate max-w-[200px]">{input.matchingRule}</span>;
        break;
      case "actions":
        content = (
          <div className="flex items-center space-x-2">
             <button 
                onClick={() => this.onAction?.("edit")}
                className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                title="Edit Script"
             >
                <FiEdit2 size={14} />
             </button>
             <button 
                onClick={() => this.onAction?.("delete")}
                className="p-1.5 rounded hover:bg-red-950/30 text-zinc-400 hover:text-red-400 transition-colors"
                title="Delete Script"
             >
                <FiTrash2 size={14} />
             </button>
          </div>
        )
        break;
      default:
        content = null;
        break;
    }

    return (
      <div className="flex items-center h-full">
        {content}
      </div>
    );
  }
}

const ScriptingList: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [data, setData] = useState<ScriptingModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingScript, setEditingScript] = useState<ScriptingModel | null | "new">(null);
    const [isGlobalEnabled, setIsGlobalEnabled] = useState(true);
  
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const scripts = await invoke<any[]>("get_scripts");
        const mapped = scripts.map(s => ({
          id: s.id,
          enabled: s.enabled,
          name: s.name,
          method: s.method,
          matchingRule: s.matching_rule,
          script: s.script,
          request: s.request,
          response: s.response,
          error: s.error
        }));
        setData(mapped);
        const enabled = await invoke<boolean>("get_script_enabled");
        setIsGlobalEnabled(enabled);
      } catch (e) {
        console.error("Failed to fetch scripts:", e);
      } finally {
        setIsLoading(false);
      }
    };

    const toggleGlobal = async () => {
      const newState = !isGlobalEnabled;
      try {
          await invoke("set_script_enabled", { enabled: newState });
          setIsGlobalEnabled(newState);
      } catch (e) {
          console.error("Failed to toggle global scripting:", e);
      }
    };

    useEffect(() => {
      fetchData();
    }, []);

    const handleAction = async (item: ScriptingModel, action: string) => {
      if (action === "delete") {
        if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
          await invoke("delete_script", { id: item.id });
          fetchData();
        }
        return;
      }

      if (action === "edit") {
        setEditingScript(item);
        return;
      }

      let updated = { ...item };
      if (action === "toggle") updated.enabled = !item.enabled;
      if (action === "toggle-req") updated.request = !item.request;
      if (action === "toggle-res") updated.response = !item.response;

      try {
        await invoke("save_script", { 
          rule: {
            id: updated.id,
            enabled: updated.enabled,
            name: updated.name,
            method: updated.method,
            matching_rule: updated.matchingRule,
            script: updated.script,
            request: updated.request,
            response: updated.response,
            error: null
          } 
        });
        fetchData();
      } catch (e) {
        console.error("Failed to update script:", e);
      }
    };

    const filteredData = data.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.matchingRule.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (editingScript) {
      return (
        <ScriptEditor 
          script={editingScript === "new" ? undefined : editingScript} 
          onClose={() => setEditingScript(null)}
          onSave={() => {
            setEditingScript(null);
            fetchData();
          }}
        />
      );
    }

  return (
    <div className="flex flex-col h-full bg-[#050505]">
      <ToolBaseHeader
        title="Custom Scripting"
        description="Write Javascript to manipulate requests and responses in real-time"
        icon={<FiCode size={22} />}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAdd={() => setEditingScript("new")}
        onClear={() => {}}
        actions={
          <div 
              onClick={toggleGlobal}
              className={twMerge(
                  "flex items-center gap-3 px-4 py-2 rounded-xl border transition-all cursor-pointer select-none",
                  isGlobalEnabled 
                      ? "bg-amber-950/20 border-amber-500/50 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.1)]" 
                      : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-400"
              )}
          >
              <div className={twMerge(
                  "w-2 h-2 rounded-full",
                  isGlobalEnabled ? "bg-amber-500 shadow-[0_0_10px_#f59e0b] animate-pulse" : "bg-zinc-700"
              )} />
              <span className="text-[11px] font-black uppercase tracking-widest whitespace-nowrap">
                  {isGlobalEnabled ? "Scripting Active" : "Scripting Paused"}
              </span>
              <div className={twMerge(
                  "w-8 h-4 rounded-full relative transition-all bg-zinc-800/50",
                  isGlobalEnabled ? "bg-amber-500/30" : "bg-zinc-800"
              )}>
                  <div className={twMerge(
                      "absolute top-1 w-2 h-2 rounded-full transition-all duration-300",
                      isGlobalEnabled ? "right-1 bg-amber-400" : "left-1 bg-zinc-600"
                  )} />
              </div>
          </div>
        }
      />
      
      <div className="flex-grow min-h-0">
        <TableView
            headers={[
            {
                title: "Status",
                minWidth: 80,
                renderer: {
                   render: ({ input }) => new ScriptingCellRenderer("enabled", (a) => handleAction(input, a)).render({ input })
                },
            },
            {
                title: "Script Name",
                minWidth: 200,
                renderer: new ScriptingCellRenderer("name"),
            },
            {
                title: "Method",
                minWidth: 100,
                renderer: new ScriptingCellRenderer("method"),
            },
            {
                title: "Pattern",
                minWidth: 220,
                renderer: new ScriptingCellRenderer("matchingRule"),
            },
            {
                title: "REQ",
                minWidth: 50,
                renderer: {
                   render: ({ input }) => new ScriptingCellRenderer("request", (a) => handleAction(input, a)).render({ input })
                },
            },
            {
                title: "RES",
                minWidth: 50,
                renderer: {
                   render: ({ input }) => new ScriptingCellRenderer("response", (a) => handleAction(input, a)).render({ input })
                },
            },
            {
                title: "Error",
                minWidth: 200,
                renderer: new ScriptingCellRenderer("error"),
            },
            {
                title: "Actions",
                minWidth: 100,
                renderer: {
                   render: ({ input }) => new ScriptingCellRenderer("actions", (a) => handleAction(input, a)).render({ input })
                },
            }
            ]}
            data={filteredData}
        />
      </div>
    </div>
  );
};

export default ScriptingList;
