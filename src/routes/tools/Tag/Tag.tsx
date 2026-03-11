import { ToolMethod } from "@src/models/ToolMethod";
import { Renderer, TableView } from "@src/packages/ui/TableView";
import React, { useState } from "react";
import { ToolBaseHeader } from "@src/packages/ui/ToolBaseHeader";
import { FiTag, FiCheck } from "react-icons/fi";
import { twMerge } from "tailwind-merge";

interface TagModel {
  enabled: boolean;
  name: string;
  method: ToolMethod;
  matchingRule: string;
  script: string;
}

const mock = {
  data: [
    {
      enabled: true,
      name: "Identify Auth",
      method: "ALL",
      matchingRule: "*/v1/auth/*",
      script: "AUTH_DOMAIN"
    },
    {
      enabled: false,
      name: "Static Content",
      method: "GET",
      matchingRule: "*.png,*.jpg",
      script: "ASSETS"
    },
  ] as TagModel[],
};

export class TagCellRenderer implements Renderer<TagModel> {
  type: keyof TagModel;
  onToggle?: () => void;

  constructor(type: keyof TagModel, onToggle?: () => void) {
    this.type = type;
    this.onToggle = onToggle;
  }

  render({ input }: { input: TagModel }): React.ReactNode {
    let content: React.ReactNode;

    switch (this.type) {
      case "enabled":
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
      case "script":
        content = <span className="font-mono text-zinc-500 truncate">{input[this.type]}</span>;
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

const TagList: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [data, setData] = useState(mock.data);
  
    const filteredData = data.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.matchingRule.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="flex flex-col h-full bg-[#050505]">
      <ToolBaseHeader
        title="Traffic Tagging"
        description="Automatically label network requests based on custom rules"
        icon={<FiTag size={22} />}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAdd={() => {}}
        onClear={() => setData([])}
      />
      
      <div className="flex-grow min-h-0">
        <TableView
            headers={[
            {
                title: "Active",
                minWidth: 80,
                renderer: new TagCellRenderer("enabled"),
            },
            {
                title: "Tag Rule Name",
                minWidth: 200,
                renderer: new TagCellRenderer("name"),
            },
            {
                title: "Method",
                minWidth: 100,
                renderer: new TagCellRenderer("method"),
            },
            {
                title: "Pattern",
                minWidth: 250,
                renderer: new TagCellRenderer("matchingRule"),
            },
            {
                title: "Applied Tag",
                minWidth: 250,
                renderer: new TagCellRenderer("script"),
            },
            ]}
            data={filteredData}
        />
      </div>
    </div>
  );
};

export default TagList;
