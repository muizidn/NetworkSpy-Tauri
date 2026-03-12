import React, { useState } from "react";
import { ToolMethod } from "@src/models/ToolMethod";
import { ToolBaseHeader } from "@src/packages/ui/ToolBaseHeader";
import { FiTag, FiCheck, FiPlus, FiX, FiTrash2, FiEdit3, FiZap, FiClock, FiSearch, FiCode, FiFolder, FiChevronDown, FiChevronRight, FiFolderPlus } from "react-icons/fi";
import { twMerge } from "tailwind-merge";
import { useTagContext, TagModel } from "@src/context/TagContext";
import { Renderer, TableView } from "@src/packages/ui/TableView";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

const DND_ITEM_TYPE = "TAG_RULE";

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
    return <DraggableCell type={this.type} input={input} handlers={this} />;
  }
}

const DraggableCell = ({ type, input, handlers }: { type: string, input: TagModel, handlers: any }) => {
  const [{ isDragging }, drag] = useDrag({
    type: DND_ITEM_TYPE,
    item: { id: input.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  let content: React.ReactNode;

  switch (type) {
    case "enabled":
      const isChecked = input.enabled;
      content = (
        <button
          onClick={() => handlers.onToggle?.(input.id)}
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
      content = (
        <div ref={drag} className="flex items-center gap-2 cursor-grab active:cursor-grabbing">
          <FiTag size={12} className="text-zinc-600" />
          <span className="font-bold text-zinc-200">{input.name}</span>
        </div>
      );
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
    case "tag":
      content = (
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-current"
          style={{
            color: input.color || '#60a5fa',
            backgroundColor: input.bgColor || '#3b82f61a',
            borderColor: `${input.color || '#60a5fa'}33`
          }}
        >
          {input.tag}
        </span>
      );
      break;
    case "scope":
      content = (
        <div className={twMerge(
          "flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider",
          input.scope === 'body' ? "text-purple-400 bg-purple-400/10" : "text-zinc-500 bg-zinc-800/50"
        )}>
          {input.scope === 'body' ? <FiCode size={10} /> : <FiSearch size={10} />}
          {input.scope === 'body' ? "DEEP" : "SIMPLE"}
        </div>
      );
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
            onClick={() => handlers.onEdit?.(input)}
            className="p-1.5 hover:bg-white/5 rounded-md text-zinc-500 hover:text-blue-400 transition-colors"
          >
            <FiEdit3 size={14} />
          </button>
          <button
            onClick={() => handlers.onDelete?.(input.id)}
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
    <div className={twMerge("flex items-center h-full", isDragging && "opacity-20")}>
      {content}
    </div>
  );
};

const TagList: React.FC = () => {
  const { tags, folders, addTag, updateTag, deleteTag, deleteFolder, addFolder, moveTag, toggleTag, toggleFolder } = useTagContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagModel | null>(null);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const toggleFolderCollapse = (folder: string) => {
    setCollapsedFolders((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(folder)) next.delete(folder);
      else next.add(folder);
      return next;
    });
  };

  // Separate root items (no folder) and folder items
  const rootItems = tags.filter(t => !t.folder && (
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.matchingRule.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.tag.toLowerCase().includes(searchTerm.toLowerCase())
  ));

  const folderGroups = folders.map(folderName => ({
    name: folderName,
    items: tags.filter(t => t.folder === folderName && (
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.matchingRule.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.tag.toLowerCase().includes(searchTerm.toLowerCase())
    ))
  }));

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
      scope: formData.get("scope") as 'metadata' | 'body',
      color: formData.get("color") as string,
      bgColor: formData.get("bgColor") as string,
      folder: (formData.get("folder") as string) || "Default",
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
    <DndProvider backend={HTML5Backend}>
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
              folders.forEach(f => deleteFolder(f));
            }
          }}
          actions={
            <button
              onClick={() => setIsFolderModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold transition-all border border-zinc-700"
            >
              <FiFolderPlus size={14} />
              NEW FOLDER
            </button>
          }
        />

        <div className="flex-grow min-h-0 overflow-y-auto no-scrollbar pb-20">
          {/* Root Level Table */}
          {rootItems.length > 0 && (
            <div className="border-b border-zinc-900 bg-black/10">
              <TableView
                headers={[
                  { title: "Active", minWidth: 80, renderer: new TagCellRenderer("enabled", { onToggle: toggleTag }) },
                  { title: "Tag Rule Name", minWidth: 200, renderer: new TagCellRenderer("name") },
                  { title: "Method", minWidth: 100, renderer: new TagCellRenderer("method") },
                  { title: "Scope", minWidth: 100, renderer: new TagCellRenderer("scope") },
                  { title: "Type", minWidth: 100, renderer: new TagCellRenderer("isSync") },
                  { title: "Pattern", minWidth: 250, renderer: new TagCellRenderer("matchingRule") },
                  { title: "Applied Tag", minWidth: 250, renderer: new TagCellRenderer("tag") },
                  {
                    title: "Actions",
                    minWidth: 100,
                    renderer: new TagCellRenderer("actions", {
                      onEdit: (tag) => { setEditingTag(tag); setIsModalOpen(true); },
                      onDelete: deleteTag
                    }),
                  }
                ]}
                data={rootItems}
              />
            </div>
          )}

          {/* Folders */}
          {folderGroups.map(group => (
            <FolderGroup
              key={group.name}
              group={group}
              isCollapsed={collapsedFolders.has(group.name)}
              onToggleCollapse={() => toggleFolderCollapse(group.name)}
              onToggleFolder={toggleFolder}
              onDeleteFolder={deleteFolder}
              onMoveTag={moveTag}
              handlers={{
                toggleTag,
                editTag: (tag: TagModel) => {
                  setEditingTag(tag);
                  setIsModalOpen(true);
                },
                deleteTag
              }}
            />
          ))}

          {/* Root Drop Zone Indicator (if dragging) */}
          <RootDropZone onDrop={() => { }} onMoveToRoot={(id) => moveTag(id, "")} />
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Folder (Optional)</label>
                    <input
                      name="folder"
                      defaultValue={editingTag?.folder || ""}
                      placeholder="None (Root Level)"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                  </div>
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Matching Scope</label>
                    <select
                      name="scope"
                      defaultValue={editingTag?.scope || "metadata"}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                    >
                      <option value="metadata">🔍 Simple (Metadata only)</option>
                      <option value="body">⚙️ Deep (Payload/Details)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Processing Tier</label>
                    <select
                      name="isSync"
                      defaultValue={editingTag?.isSync ? "true" : "false"}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                    >
                      <option value="true">⚡ Synchronous (Metadata only)</option>
                      <option value="false">🕒 Asynchronous (Incl. Body/Heavy)</option>
                    </select>
                    <p className="text-[10px] text-zinc-600 italic">Sync is limited to 10 rules. Deep matching (Body) is always forced to Asynchronous.</p>
                  </div>
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
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Applied Tag</label>
                    <input
                      name="tag"
                      defaultValue={editingTag?.tag}
                      required
                      placeholder="e.g. AUTH"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm font-bold text-blue-400 focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Text Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        name="color"
                        defaultValue={editingTag?.color || "#60a5fa"}
                        className="w-10 h-10 bg-transparent border-none cursor-pointer p-0 overflow-hidden rounded"
                      />
                      <input
                        type="text"
                        value={editingTag?.color || "#60a5fa"}
                        disabled
                        className="flex-grow bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Background Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        name="bgColor"
                        defaultValue={editingTag?.bgColor || "#1e3a8a33"}
                        className="w-10 h-10 bg-transparent border-none cursor-pointer p-0 overflow-hidden rounded"
                      />
                      <input
                        type="text"
                        value={editingTag?.bgColor || "#1e3a8a33"}
                        disabled
                        className="flex-grow bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-500"
                      />
                    </div>
                  </div>
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
        {isFolderModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#111111] border border-zinc-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
                <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                  <FiFolderPlus className="text-blue-400" />
                  Create New Folder
                </h3>
                <button
                  onClick={() => setIsFolderModalOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-md text-zinc-500 hover:text-white transition-colors"
                >
                  <FiX size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Folder Name</label>
                  <input
                    autoFocus
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newFolderName.trim()) {
                        addFolder(newFolderName.trim());
                        setNewFolderName("");
                        setIsFolderModalOpen(false);
                      }
                      if (e.key === 'Escape') setIsFolderModalOpen(false);
                    }}
                    placeholder="e.g. Analytics Rules"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setIsFolderModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!newFolderName.trim()}
                    onClick={() => {
                      addFolder(newFolderName.trim());
                      setNewFolderName("");
                      setIsFolderModalOpen(false);
                    }}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg text-xs font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                  >
                    Create Folder
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
};

const FolderGroup = ({
  group,
  isCollapsed,
  onToggleCollapse,
  onToggleFolder,
  onDeleteFolder,
  onMoveTag,
  handlers
}: {
  group: any,
  isCollapsed: boolean,
  onToggleCollapse: () => void,
  onToggleFolder: (f: string, e: boolean) => void,
  onDeleteFolder: (f: string) => void,
  onMoveTag: (tagId: string, folder: string) => void,
  handlers: any
}) => {
  const [{ isOver }, drop] = useDrop({
    accept: DND_ITEM_TYPE,
    drop: (item: { id: string }) => {
      onMoveTag(item.id, group.name);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const allEnabled = group.items.length > 0 && group.items.every((t: any) => t.enabled);
  const someEnabled = group.items.some((t: any) => t.enabled);

  return (
    <div ref={drop} className={twMerge(
      "flex flex-col border-b border-zinc-900 last:border-0 transition-colors",
      isOver && "bg-blue-600/5 shadow-[inset_0_0_20px_rgba(59,130,246,0.1)]"
    )}>
      {/* Folder Header */}
      <div
        className={twMerge(
          "flex items-center gap-3 px-4 py-2.5 bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors group cursor-pointer border-l-2 border-transparent",
          isOver && "border-blue-500"
        )}
        onClick={onToggleCollapse}
      >

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFolder(group.name, !allEnabled);
          }}
          className={twMerge(
            "w-5 h-5 rounded border flex items-center justify-center transition-all",
            allEnabled ? "bg-blue-600 border-blue-500 text-white" :
              someEnabled ? "bg-blue-600/40 border-blue-500/40 text-white" :
                "bg-zinc-800 border-zinc-700 text-transparent"
          )}
        >
          <FiCheck size={10} />
        </button>

        {/* // Chevron here */}
        {isCollapsed ? <FiChevronRight size={12} /> : <FiChevronDown size={12} />}

        <div className="ml-6 flex items-center gap-2 flex-grow">
          <FiFolder className={twMerge("transition-colors", isOver ? "text-blue-400" : "text-zinc-500")} size={16} />
          <span className={twMerge(
            "text-xs font-black uppercase tracking-widest transition-colors",
            isOver ? "text-blue-400" : "text-zinc-400"
          )}>{group.name}</span>
          <span className="text-[10px] text-zinc-600 font-mono">({group.items.length})</span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Are you sure you want to delete folder "${group.name}"? This will delete ${group.items.length} tags.`)) {
              onDeleteFolder(group.name);
            }
          }}
          className="p-1 px-2 rounded hover:bg-red-500/10 text-zinc-600 hover:text-red-400 text-[10px] font-bold transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100"
        >
          <FiTrash2 size={12} />
          DELETE
        </button>
      </div>

      {/* Tags Table */}
      {!isCollapsed && group.items.length > 0 && (
        <div className="bg-black/20 border-l border-zinc-900">
          <TableView
            headers={[
              {
                title: "Active",
                minWidth: 80,
                renderer: new TagCellRenderer("enabled", { onToggle: handlers.toggleTag }),
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
                title: "Scope",
                minWidth: 100,
                renderer: new TagCellRenderer("scope"),
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
                  onEdit: handlers.editTag,
                  onDelete: handlers.deleteTag
                }),
              }
            ]}
            data={group.items}
          />
        </div>
      )}
      {!isCollapsed && group.items.length === 0 && (
        <div className="py-8 text-center text-[10px] text-zinc-700 italic border-l-2 border-zinc-900 ml-6">
          Drop tags here to move to this folder
        </div>
      )}
    </div>
  );
};

const RootDropZone = ({ onMoveToRoot }: { onDrop: () => void, onMoveToRoot: (id: string) => void }) => {
  const [{ isOver }, drop] = useDrop({
    accept: DND_ITEM_TYPE,
    drop: (item: { id: string }) => {
      onMoveToRoot(item.id);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div
      ref={drop}
      className={twMerge(
        "mt-4 mx-4 py-4 border-2 border-dashed border-zinc-900 rounded-xl flex items-center justify-center transition-all",
        isOver ? "border-blue-500/50 bg-blue-500/5 text-blue-400" : "text-zinc-700 hover:border-zinc-800"
      )}
    >
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
        <FiPlus size={14} />
        Drag here to move to root
      </div>
    </div>
  );
};

export default TagList;
