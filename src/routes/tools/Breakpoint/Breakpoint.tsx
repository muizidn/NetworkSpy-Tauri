import { ToolMethod } from "@src/models/ToolMethod";
import { Renderer, TableView } from "@src/packages/ui/TableView";
import React, { useState } from "react";
import { ToolBaseHeader } from "@src/packages/ui/ToolBaseHeader";
import { FiActivity, FiCheck, FiX, FiPlus } from "react-icons/fi";
import { twMerge } from "tailwind-merge";

interface BreakpointModel {
  enabled: boolean;
  name: string;
  method: ToolMethod;
  matchingRule: string;
  request: boolean;
  response: boolean;
}

const mock = {
  data: [
    {
      enabled: true,
      name: "API Authentication",
      method: "POST",
      matchingRule: "*/v1/auth/*",
      request: true,
      response: false,
    },
    {
      enabled: false,
      name: "Static Assets",
      method: "GET",
      matchingRule: "*.png",
      request: false,
      response: true,
    },
    {
      enabled: true,
      name: "Payment Gateway",
      method: "PUT",
      matchingRule: "payment.NetworkSpy.io/*",
      request: true,
      response: true,
    },
  ] as BreakpointModel[],
};

export class BreakpointCellRenderer implements Renderer<BreakpointModel> {
  type: keyof BreakpointModel;
  onToggle?: (field: "enabled" | "request" | "response") => void;

  constructor(type: keyof BreakpointModel, onToggle?: (field: "enabled" | "request" | "response") => void) {
    this.type = type;
    this.onToggle = onToggle;
  }

  render({ input }: { input: BreakpointModel }): React.ReactNode {
    let content: React.ReactNode;

    switch (this.type) {
      case "enabled":
      case "request":
      case "response":
        const isChecked = input[this.type] as boolean;
        content = (
          <button
            onClick={() => this.onToggle?.(this.type as any)}
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
                : 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50'
            )}>
                {input.method}
            </span>
        );
        break;
      case "matchingRule":
        content = <span className="font-mono text-zinc-500">{input.matchingRule}</span>;
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
  const [data, setData] = useState(mock.data);

  const filteredData = data.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.matchingRule.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#050505]">
      <ToolBaseHeader
        title="Breakpoints"
        description="Pause network traffic when it matches specific criteria"
        icon={<FiActivity size={22} />}
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
                renderer: new BreakpointCellRenderer("enabled"),
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
                renderer: new BreakpointCellRenderer("matchingRule"),
            },
            {
                title: "REQ",
                minWidth: 60,
                renderer: new BreakpointCellRenderer("request"),
            },
            {
                title: "RES",
                minWidth: 60,
                renderer: new BreakpointCellRenderer("response"),
            },
            ]}
            data={filteredData}
        />
      </div>
    </div>
  );
};

export default BreakpointList;
