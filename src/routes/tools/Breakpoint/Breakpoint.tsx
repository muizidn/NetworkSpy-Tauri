import { Renderer, TableView } from "@src/packages/ui/TableView";
import React, { useState, useEffect } from "react";
import { ToolBaseHeader } from "@src/packages/ui/ToolBaseHeader";
import { v4 as uuidv4 } from "uuid";
import { BreakpointDialog, BreakpointModel as IBreakpointModel } from "./components/BreakpointDialog";
import { FiActivity, FiCheck, FiTrash2, FiEdit3 } from "react-icons/fi";
import { twMerge } from "tailwind-merge";
import { invoke } from "@tauri-apps/api/core";

export class BreakpointCellRenderer implements Renderer<IBreakpointModel> {
  type: keyof IBreakpointModel;
  onToggle?: (id: string, field: "enabled" | "request" | "response") => void;
  onDelete?: (id: string) => void;
  onEdit?: (item: IBreakpointModel) => void;

  constructor(
      type: keyof IBreakpointModel | "actions", 
      onToggle?: (id: string, field: "enabled" | "request" | "response") => void, 
      onDelete?: (id: string) => void,
      onEdit?: (item: IBreakpointModel) => void
  ) {
    this.type = type as any;
    this.onToggle = onToggle;
    this.onDelete = onDelete;
    this.onEdit = onEdit;
  }

  render({ input }: { input: IBreakpointModel }): React.ReactNode {
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
        content = <code className="text-[10px] bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-500 font-mono shadow-inner group-hover:border-zinc-700 transition-colors uppercase tracking-widest truncate max-w-[280px]">{input.matching_rule}</code>;
        break;
      case "actions":
        content = (
            <div className="flex items-center gap-1">
                <button 
                    onClick={() => this.onEdit?.(input)}
                    className="text-zinc-600 hover:text-blue-500 transition-all p-1.5 rounded-md hover:bg-blue-500/10 active:scale-90"
                >
                    <FiEdit3 size={14} />
                </button>
                <button 
                    onClick={() => this.onDelete?.(input.id)}
                    className="text-zinc-600 hover:text-red-500 transition-all p-1.5 rounded-md hover:bg-red-500/10 active:scale-90 h-6 w-6"
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

const BreakpointList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState<IBreakpointModel[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IBreakpointModel | null>(null);
  const [isGlobalEnabled, setIsGlobalEnabled] = useState(false);

  const fetchBreakpoints = async () => {
    try {
        const rules = await invoke<IBreakpointModel[]>("get_breakpoints");
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

  const handleSave = async (rule: IBreakpointModel) => {
    try {
        if (!rule.id) {
            rule.id = uuidv4();
        }
        await invoke("save_breakpoint", { rule });
        setData(prev => {
            const index = prev.findIndex(p => p.id === rule.id);
            if (index >= 0) {
                return prev.map(p => p.id === rule.id ? rule : p);
            }
            return [rule, ...prev];
        });
        setIsDialogOpen(false);
        setEditingItem(null);
    } catch (e) {
        console.error("Failed to save breakpoint:", e);
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
        onAdd={() => {
            setEditingItem(null);
            setIsDialogOpen(true);
        }}
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
                minWidth: 80,
                renderer: new BreakpointCellRenderer("actions", undefined, handleDelete, (item) => {
                    setEditingItem(item);
                    setIsDialogOpen(true);
                }),
            },
            ]}
            data={filteredData}
        />
      </div>

      <BreakpointDialog 
        isOpen={isDialogOpen} 
        onClose={() => {
            setIsDialogOpen(false);
            setEditingItem(null);
        }} 
        onSave={handleSave}
        initialData={editingItem}
      />
    </div>
  );
};

export default BreakpointList;
