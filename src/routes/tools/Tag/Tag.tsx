import { ToolMethod } from "@src/models/ToolMethod";
import { Renderer, TableView } from "@src/packages/ui/TableView";
import React, { useState } from "react";
import { ToolBaseHeader } from "@src/packages/ui/ToolBaseHeader";
import { FiTag, FiCheck, FiPlus, FiX, FiTrash2, FiEdit3, FiZap, FiClock } from "react-icons/fi";
import { twMerge } from "tailwind-merge";
import { useTagContext, TagModel } from "@src/context/TagContext";

// Local TagModel interface removed in favor of TagContext's TagModel

// Removed mock data as we now use TagContext

export class TagCellRenderer implements Renderer<TagModel> {
  type: keyof TagModel | "actions";
  onToggle?: (id: string) => void;
  onEdit?: (tag: TagModel) => void;
  onDelete?: (id: string) => void;

  constructor(
    type: keyof TagModel | "actions", 
    handlers: { 
      onToggle?: (id: string) => void, 
      onEdit?: (tag: TagModel) => void,
      onDelete?: (id: string) => void 
    } = {}
  ) {
    this.type = type;
    this.onToggle = handlers.onToggle;
    this.onEdit = handlers.onEdit;
    this.onDelete = handlers.onDelete;
  }

  render({ input }: { input: TagModel }): React.ReactNode {
    let content: React.ReactNode;

    switch (this.type) {
      case "enabled":
        const isChecked = input.enabled;
        content = (
          <button
            onClick={() => this.onToggle?.(input.id)}
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
      case "tag":
        content = <span className="font-mono text-zinc-500 truncate">{input[this.type as keyof TagModel]?.toString()}</span>;
        break;
      case "isSync":
        content = (
          <div className={twMerge(
            "flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider",
            input.isSync ? "text-amber-400 bg-amber-400/10" : "text-zinc-500 bg-zinc-800/50"
          )}>
            {input.isSync ? <FiZap size={10} /> : <FiClock size={10} />}
            {input.isSync ? "SYNC" : "ASYNC"}
          </div>
        );
        break;
      case "actions":
        content = (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => this.onEdit?.(input)}
              className="p-1.5 hover:bg-white/5 rounded-md text-zinc-500 hover:text-blue-400 transition-colors"
            >
              <FiEdit3 size={14} />
            </button>
            <button 
              onClick={() => this.onDelete?.(input.id)}
              className="p-1.5 hover:bg-white/5 rounded-md text-zinc-500 hover:text-red-400 transition-colors"
            >
              <FiTrash2 size={14} />
            </button>
          </div>
        );
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
    const { tags, addTag, updateTag, deleteTag, toggleTag } = useTagContext();
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTag, setEditingTag] = useState<TagModel | null>(null);

    const filteredData = tags.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.matchingRule.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tag.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSaveTag = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const tagData = {
        name: formData.get("name") as string,
        method: formData.get("method") as ToolMethod,
        matchingRule: formData.get("matchingRule") as string,
        tag: formData.get("tag") as string,
        enabled: editingTag ? editingTag.enabled : true,
        isSync: formData.get("isSync") === "true",
      };

      if (editingTag) {
        updateTag(editingTag.id, tagData);
      } else {
        addTag(tagData);
      }
      setIsModalOpen(false);
      setEditingTag(null);
    };

  return (
    <div className="flex flex-col h-full bg-[#050505] relative">
      <ToolBaseHeader
        title="Traffic Tagging"
        description="Automatically label network requests based on custom rules"
        icon={<FiTag size={22} />}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAdd={() => {
          setEditingTag(null);
          setIsModalOpen(true);
        }}
        onClear={() => {
          if (confirm("Are you sure you want to delete all tags?")) {
            tags.forEach(t => deleteTag(t.id));
          }
        }}
      />
      
      <div className="flex-grow min-h-0">
        <TableView
            headers={[
            {
                title: "Active",
                minWidth: 80,
                renderer: new TagCellRenderer("enabled", { onToggle: toggleTag }),
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
                title: "Type",
                minWidth: 100,
                renderer: new TagCellRenderer("isSync"),
            },
            {
                title: "Pattern",
                minWidth: 250,
                renderer: new TagCellRenderer("matchingRule"),
            },
            {
                title: "Applied Tag",
                minWidth: 250,
                renderer: new TagCellRenderer("tag"),
            },
            {
              title: "Actions",
              minWidth: 100,
              renderer: new TagCellRenderer("actions", { 
                onEdit: (tag) => {
                  setEditingTag(tag);
                  setIsModalOpen(true);
                }, 
                onDelete: deleteTag 
              }),
            }
            ]}
            data={filteredData}
        />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111111] border border-zinc-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                {editingTag ? <FiEdit3 className="text-blue-400" /> : <FiPlus className="text-blue-400" />}
                {editingTag ? "Edit Tagging Rule" : "Create Tagging Rule"}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-white/10 rounded-md text-zinc-500 hover:text-white transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveTag} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Rule Name</label>
                <input 
                  name="name"
                  defaultValue={editingTag?.name}
                  required
                  placeholder="e.g. Identity Authentication"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Method</label>
                  <select 
                    name="method"
                    defaultValue={editingTag?.method || "ALL"}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                  >
                    <option value="ALL">ALL</option>
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Tag Mode</label>
                  <select 
                    name="isSync"
                    defaultValue={editingTag?.isSync ? "true" : "false"}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                  >
                    <option value="true">⚡ Synchronous</option>
                    <option value="false">🕒 Asynchronous</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Applied Tag</label>
                <input 
                  name="tag"
                  defaultValue={editingTag?.tag}
                  required
                  placeholder="e.g. AUTH"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm font-bold text-blue-400 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-500">URL Pattern (Glob)</label>
                <input 
                  name="matchingRule"
                  defaultValue={editingTag?.matchingRule}
                  required
                  placeholder="e.g. */v1/auth/* or *.png"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-blue-500/50 transition-colors"
                />
                <p className="text-[10px] text-zinc-600">Use asterisks (*) as wildcards. Multiple patterns can be comma-separated.</p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg text-xs font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                >
                  {editingTag ? "Save Changes" : "Create Rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TagList;
