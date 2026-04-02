import { ToolMethod } from "@src/models/ToolMethod";
import { Renderer, TableView } from "@src/packages/ui/TableView";
import React, { useState, useEffect } from "react";
import { ToolBaseHeader } from "@src/packages/ui/ToolBaseHeader";
import { FiActivity, FiCheck, FiX, FiPlus, FiTrash2, FiSave } from "react-icons/fi";
import { twMerge } from "tailwind-merge";
import { invoke } from "@tauri-apps/api/core";
import { v4 as uuidv4 } from "uuid";

interface BreakpointModel {
  id: string;
  enabled: boolean;
  name: string;
  method: string;
  matching_rule: string;
  request: boolean;
  response: boolean;
}

export class BreakpointCellRenderer implements Renderer<BreakpointModel> {
  type: keyof BreakpointModel;
  onToggle?: (id: string, field: "enabled" | "request" | "response") => void;
  onDelete?: (id: string) => void;

  constructor(type: keyof BreakpointModel | "actions", onToggle?: (id: string, field: "enabled" | "request" | "response") => void, onDelete?: (id: string) => void) {
    this.type = type as any;
    this.onToggle = onToggle;
    this.onDelete = onDelete;
  }

  render({ input }: { input: BreakpointModel }): React.ReactNode {
    let content: React.ReactNode;

    switch (this.type as string) {
      case "enabled":
      case "request":
      case "response":
        const isChecked = input[this.type as "enabled" | "request" | "response"] as boolean;
        content = (
          <button
            onClick={() => this.onToggle?.(input.id, this.type as any)}
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
      case "name":
        content = <span className="font-bold text-zinc-200">{input.name}</span>;
        break;
      case "method":
        content = (
            <span className={twMerge(
                "px-2 py-0.5 rounded text-[10px] font-black tracking-widest border",
                input.method === 'GET' ? 'bg-blue-950/30 text-blue-400 border-blue-900/50' : 
                input.method === 'POST' ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50' :
                'bg-zinc-900/30 text-zinc-400 border-zinc-800/50'
            )}>
                {input.method || 'ALL'}
            </span>
        );
        break;
      case "matching_rule":
        content = <span className="font-mono text-zinc-500 truncate max-w-[280px]">{input.matching_rule}</span>;
        break;
      case "actions":
        content = (
            <button 
                onClick={() => this.onDelete?.(input.id)}
                className="btn btn-xs btn-ghost text-zinc-600 hover:text-red-500 p-0 h-6 w-6 min-h-0"
            >
                <FiTrash2 size={14} />
            </button>
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

const BreakpointList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState<BreakpointModel[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRule, setNewRule] = useState<Partial<BreakpointModel>>({
    name: "",
    method: "ALL",
    matching_rule: "*",
    enabled: true,
    request: true,
    response: true
  });

  const [isGlobalEnabled, setIsGlobalEnabled] = useState(false);

  const fetchBreakpoints = async () => {
    try {
        const rules = await invoke<BreakpointModel[]>("get_breakpoints");
        setData(rules);
        const enabled = await invoke<boolean>("get_breakpoint_enabled");
        setIsGlobalEnabled(enabled);
    } catch (e) {
        console.error("Failed to fetch breakpoint state:", e);
    }
  };

  useEffect(() => {
    fetchBreakpoints();
  }, []);

  const toggleGlobal = async () => {
    const newState = !isGlobalEnabled;
    try {
        await invoke("set_breakpoint_enabled", { enabled: newState });
        setIsGlobalEnabled(newState);
    } catch (e) {
        console.error("Failed to toggle global breakpoint:", e);
    }
  };

  const handleToggle = async (id: string, field: "enabled" | "request" | "response") => {
    const item = data.find(d => d.id === id);
    if (!item) return;

    const updatedItem = { ...item, [field]: !item[field] };
    try {
        await invoke("save_breakpoint", { rule: updatedItem });
        setData(prev => prev.map(d => d.id === id ? updatedItem : d));
    } catch (e) {
        console.error("Failed to update breakpoint:", e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
        await invoke("delete_breakpoint", { id });
        setData(prev => prev.filter(d => d.id !== id));
    } catch (e) {
        console.error("Failed to delete breakpoint:", e);
    }
  };

  const handleCreate = async () => {
    if (!newRule.name || !newRule.matching_rule) return;
    
    const rule: BreakpointModel = {
        id: uuidv4(),
        enabled: true,
        name: newRule.name || "Untitled Breakpoint",
        method: newRule.method || "ALL",
        matching_rule: newRule.matching_rule || "*",
        request: newRule.request ?? true,
        response: newRule.response ?? true,
    };

    try {
        await invoke("save_breakpoint", { rule });
        setData(prev => [rule, ...prev]);
        setShowAddForm(false);
        setNewRule({ name: "", method: "ALL", matching_rule: "*", request: true, response: true });
    } catch (e) {
        console.error("Failed to create breakpoint:", e);
    }
  };

  const filteredData = data.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.matching_rule.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#050505] relative overflow-hidden">
      <ToolBaseHeader
        title="Breakpoints"
        description="Pause network traffic when it matches specific criteria"
        icon={<FiActivity size={22} />}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAdd={() => setShowAddForm(true)}
        onClear={async () => {
             for (const item of data) {
                 await handleDelete(item.id);
             }
        }}
        actions={
            <div 
                onClick={toggleGlobal}
                className={twMerge(
                    "flex items-center gap-3 px-4 py-2 rounded-xl border transition-all cursor-pointer select-none",
                    isGlobalEnabled 
                        ? "bg-red-950/20 border-red-500/50 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)]" 
                        : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-400"
                )}
            >
                <div className={twMerge(
                    "w-2 h-2 rounded-full",
                    isGlobalEnabled ? "bg-red-500 shadow-[0_0_10px_#ef4444] animate-pulse" : "bg-zinc-700"
                )} />
                <span className="text-[11px] font-black uppercase tracking-widest whitespace-nowrap">
                    {isGlobalEnabled ? "Breakpoints Active" : "Interception Paused"}
                </span>
                <div className={twMerge(
                    "w-8 h-4 rounded-full relative transition-all bg-zinc-800/50",
                    isGlobalEnabled ? "bg-red-500/30" : "bg-zinc-800"
                )}>
                    <div className={twMerge(
                        "absolute top-1 w-2 h-2 rounded-full transition-all duration-300",
                        isGlobalEnabled ? "right-1 bg-red-400" : "left-1 bg-zinc-600"
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
                renderer: new BreakpointCellRenderer("enabled", handleToggle),
            },
            {
                title: "Name",
                minWidth: 200,
                renderer: new BreakpointCellRenderer("name"),
            },
            {
                title: "Method",
                minWidth: 100,
                renderer: new BreakpointCellRenderer("method"),
            },
            {
                title: "Pattern",
                minWidth: 300,
                renderer: new BreakpointCellRenderer("matching_rule"),
            },
            {
                title: "REQ",
                minWidth: 60,
                renderer: new BreakpointCellRenderer("request", handleToggle),
            },
            {
                title: "RES",
                minWidth: 60,
                renderer: new BreakpointCellRenderer("response", handleToggle),
            },
            {
                title: "",
                minWidth: 50,
                renderer: new BreakpointCellRenderer("actions", undefined, handleDelete),
            },
            ]}
            data={filteredData}
        />
      </div>

      {showAddForm && (
        <div className="absolute inset-0 z-50 flex items-start justify-end pr-8 pt-20 pointer-events-none">
            <div className="w-[360px] bg-[#1a1c1e] border border-zinc-800 rounded-xl shadow-2xl p-6 pointer-events-auto animate-in slide-in-from-right-8 duration-300">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-200">New Breakpoint</h3>
                    <button onClick={() => setShowAddForm(false)} className="text-zinc-500 hover:text-zinc-300">
                        <FiX size={18} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1.5 ml-1">Friendly Name</label>
                        <input 
                            className="input input-sm w-full bg-zinc-900 border-zinc-800 rounded focus:border-blue-500 focus:outline-none text-xs" 
                            placeholder="e.g. Auth Breakpoint"
                            value={newRule.name}
                            onChange={e => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-1">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1.5 ml-1">Method</label>
                            <select 
                                className="select select-sm w-full bg-zinc-900 border-zinc-800 rounded focus:border-blue-500 focus:outline-none text-[10px]"
                                value={newRule.method}
                                onChange={e => setNewRule(prev => ({ ...prev, method: e.target.value }))}
                            >
                                <option value="ALL">ALL</option>
                                <option value="GET">GET</option>
                                <option value="POST">POST</option>
                                <option value="PUT">PUT</option>
                                <option value="DELETE">DELETE</option>
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1.5 ml-1">Match Pattern</label>
                            <input 
                                className="input input-sm w-full bg-zinc-900 border-zinc-800 rounded focus:border-blue-500 focus:outline-none text-[10px] font-mono" 
                                placeholder="*/api/v1/*"
                                value={newRule.matching_rule}
                                onChange={e => setNewRule(prev => ({ ...prev, matching_rule: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-6 pt-2">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setNewRule(prev => ({ ...prev, request: !prev.request }))}
                                className={twMerge(
                                    "w-4 h-4 rounded border flex items-center justify-center transition-all",
                                    newRule.request ? "bg-blue-600 border-blue-500 text-white" : "bg-zinc-950 border-zinc-800 text-transparent"
                                )}
                            >
                                <FiCheck size={10} />
                            </button>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Request</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setNewRule(prev => ({ ...prev, response: !prev.response }))}
                                className={twMerge(
                                    "w-4 h-4 rounded border flex items-center justify-center transition-all",
                                    newRule.response ? "bg-blue-600 border-blue-500 text-white" : "bg-zinc-950 border-zinc-800 text-transparent"
                                )}
                            >
                                <FiCheck size={10} />
                            </button>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Response</span>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button 
                            onClick={handleCreate}
                            className="btn btn-sm btn-primary w-full bg-blue-600 hover:bg-blue-500 border-none rounded text-white font-bold h-9 min-h-0"
                        >
                            <FiSave className="mr-2" />
                            Save Rule
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default BreakpointList;
