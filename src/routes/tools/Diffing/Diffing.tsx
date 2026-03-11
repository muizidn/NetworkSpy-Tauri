import { TrafficItemMap } from "@src/packages/main-content/model/TrafficItemMap";
import { Renderer, TableView } from "@src/packages/ui/TableView";
import React, { useState } from "react";
import { ToolBaseHeader } from "@src/packages/ui/ToolBaseHeader";
import { FiLayers, FiCheck, FiX } from "react-icons/fi";
import { twMerge } from "tailwind-merge";

interface DiffingModel extends TrafficItemMap {
  note: string;
}

const mock = {
  data: [
    {
      id: "1",
      note: "Login Request",
      method: "GET",
      is_ssl: true,
      url: "/v1/auth/login",
    },
    {
      id: "2",
      note: "Create Profile",
      method: "POST",
      is_ssl: true,
      url: "/v1/users/create",
    },
    {
      id: "3",
      note: "Update Settings",
      method: "PUT",
      is_ssl: false,
      url: "/v1/settings/update",
    },
  ] as DiffingModel[],
};

interface DiffingModelRuntimeData {
  __runtime__index: number;
  __runtime__isDiffLeft: boolean;
  __runtime__isDiffRight: boolean;
}

type __RendererModel = DiffingModel & DiffingModelRuntimeData;

export class DiffingCellRenderer implements Renderer<__RendererModel> {
  type: keyof __RendererModel;
  onClickDiff?: (index: number, side: "left" | "right", checked: boolean) => void;

  constructor(
    type: keyof __RendererModel,
    onClickDiff?: (index: number, side: "left" | "right", checked: boolean) => void
  ) {
    this.type = type;
    this.onClickDiff = onClickDiff;
  }

  render({ input }: { input: __RendererModel }): React.ReactNode {
    let content: React.ReactNode;

    switch (this.type) {
      case "is_ssl":
        content = input.is_ssl ? (
            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-bold border border-emerald-500/20">
                <FiCheck size={10} />
                SSL
            </span>
        ) : (
            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-zinc-800 text-zinc-500 rounded-full text-[10px] font-bold border border-zinc-700">
                <FiX size={10} />
                PLAIN
            </span>
        );
        break;
      case "__runtime__isDiffLeft":
      case "__runtime__isDiffRight":
        const side = this.type === "__runtime__isDiffLeft" ? "left" : "right";
        const isChecked = input[this.type] as boolean;
        content = (
          <button
            onClick={() => this.onClickDiff?.(input.__runtime__index, side, !isChecked)}
            className={twMerge(
                "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                isChecked 
                    ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/40 scale-110" 
                    : "bg-zinc-900 border-zinc-800 text-transparent hover:border-zinc-700"
            )}
          >
            <FiCheck size={12} />
          </button>
        );
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
      case "note":
        content = <span className="font-bold text-zinc-200">{input.note}</span>;
        break;
      default:
        content = input[this.type as keyof __RendererModel] as React.ReactNode;
        break;
    }

    return (
      <div className="flex items-center h-full">
        {content}
      </div>
    );
  }
}

const DiffingList: React.FC = () => {
  const [diffLeft, setDiffLeft] = useState<number | null>(null);
  const [diffRight, setDiffRight] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleDiff = (index: number, side: "left" | "right", checked: boolean) => {
    if (side === "left") {
      setDiffLeft(checked ? index : null);
    } else {
      setDiffRight(checked ? index : null);
    }
  };

  const filteredData = mock.data.filter(item => 
    (item.note as string).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.url as string)?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const data: __RendererModel[] = filteredData.map((datum, index) => ({
    ...datum,
    __runtime__index: index,
    __runtime__isDiffLeft: diffLeft === index,
    __runtime__isDiffRight: diffRight === index,
  }));

  return (
    <div className="flex flex-col h-full bg-[#050505]">
      <ToolBaseHeader
        title="Session Diffing"
        description="Select two requests from history to compare their payloads and headers"
        icon={<FiLayers size={22} />}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onClear={() => { setDiffLeft(null); setDiffRight(null); }}
        actions={
            <div className="flex items-center gap-2 mr-2">
                <div className={twMerge(
                    "px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all",
                    diffLeft !== null ? "bg-blue-600/10 border-blue-500/50 text-blue-400" : "bg-zinc-900 border-zinc-800 text-zinc-600"
                )}>
                    LEFT: {diffLeft !== null ? `RULE #${diffLeft + 1}` : "NONE"}
                </div>
                <div className={twMerge(
                    "px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all",
                    diffRight !== null ? "bg-blue-600/10 border-blue-500/50 text-blue-400" : "bg-zinc-900 border-zinc-800 text-zinc-600"
                )}>
                    RIGHT: {diffRight !== null ? `RULE #${diffRight + 1}` : "NONE"}
                </div>
            </div>
        }
      />
      
      <div className="flex-grow min-h-0">
        <TableView
            headers={[
            {
                title: "Left",
                minWidth: 60,
                renderer: new DiffingCellRenderer("__runtime__isDiffLeft", handleDiff),
            },
            {
                title: "Right",
                minWidth: 60,
                renderer: new DiffingCellRenderer("__runtime__isDiffRight", handleDiff),
            },
            {
                title: "Note",
                minWidth: 200,
                renderer: new DiffingCellRenderer("note"),
            },
            {
                title: "Method",
                minWidth: 100,
                renderer: new DiffingCellRenderer("method"),
            },
            {
                title: "SSL",
                minWidth: 100,
                renderer: new DiffingCellRenderer("is_ssl"),
            },
            {
                title: "URL",
                minWidth: 300,
                renderer: new (class implements Renderer<__RendererModel> {
                    render({ input }: { input: __RendererModel }) {
                        return <span className="font-mono text-zinc-500">{input.url}</span>;
                    }
                })(),
            }
            ]}
            data={data}
        />
      </div>
    </div>
  );
};

export default DiffingList;
