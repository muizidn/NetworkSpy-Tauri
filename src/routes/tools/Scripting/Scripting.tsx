import { ToolMethod } from "@src/models/ToolMethod";
import { Renderer, TableView } from "@src/packages/ui/TableView";
import React, { useState } from "react";
import { ToolBaseHeader } from "@src/packages/ui/ToolBaseHeader";
import { FiCode, FiCheck, FiPlus } from "react-icons/fi";
import { twMerge } from "tailwind-merge";

interface ScriptingModel {
  enabled: boolean;
  name: string;
  method: ToolMethod;
  matchingRule: string;
  script: string;
  request: boolean;
  response: boolean;
}

const mock = {
  data: [
    {
      enabled: true,
      name: "JWT Header Injector",
      method: "ALL",
      matchingRule: "*/api/*",
      script: "context.request.headers['Authorization'] = 'Bearer ...'",
      request: true,
      response: false,
    },
    {
      enabled: false,
      name: "Latency Simulator",
      method: "GET",
      matchingRule: "*",
      script: "await sleep(2000)",
      request: true,
      response: false,
    },
    {
      enabled: true,
      name: "JSON Response Modifier",
      method: "GET",
      matchingRule: "*/v1/profile",
      script: "body.is_admin = true; return body;",
      request: false,
      response: true,
    },
  ] as ScriptingModel[],
};

export class ScriptingCellRenderer implements Renderer<ScriptingModel> {
  type: keyof ScriptingModel;
  onToggle?: () => void;

  constructor(type: keyof ScriptingModel, onToggle?: () => void) {
    this.type = type;
    this.onToggle = onToggle;
  }

  render({ input }: { input: ScriptingModel }): React.ReactNode {
    let content: React.ReactNode;

    switch (this.type) {
      case "enabled":
      case "request":
      case "response":
        const isChecked = input[this.type] as boolean;
        content = (
          <button
            onClick={() => this.onToggle?.()}
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
                input.method === 'GET' ? 'bg-blue-950/30 text-blue-400 border-blue-900/50' 
                : input.method === 'ALL' ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                : 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50'
            )}>
                {input.method}
            </span>
        );
        break;
      case "matchingRule":
        content = <span className="font-mono text-zinc-500 truncate">{input.matchingRule}</span>;
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
    const [data, setData] = useState(mock.data);
  
    const filteredData = data.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.matchingRule.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="flex flex-col h-full bg-[#050505]">
      <ToolBaseHeader
        title="Custom Scripting"
        description="Write Javascript to manipulate requests and responses in real-time"
        icon={<FiCode size={22} />}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAdd={() => {}}
        onClear={() => setData([])}
      />
      
      <div className="flex-grow min-h-0">
        <TableView
            headers={[
            {
                title: "Status",
                minWidth: 80,
                renderer: new ScriptingCellRenderer("enabled"),
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
                minWidth: 250,
                renderer: new ScriptingCellRenderer("matchingRule"),
            },
            {
                title: "REQ",
                minWidth: 60,
                renderer: new ScriptingCellRenderer("request"),
            },
            {
                title: "RES",
                minWidth: 60,
                renderer: new ScriptingCellRenderer("response"),
            },
            ]}
            data={filteredData}
        />
      </div>
    </div>
  );
};

export default ScriptingList;
