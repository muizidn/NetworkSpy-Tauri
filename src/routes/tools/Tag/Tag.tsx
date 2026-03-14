import { TagModel, useTagContext } from "@src/context/TagContext";
import { ToolMethod } from "@src/models/ToolMethod";
import { Renderer, TableView } from "@src/packages/ui/TableView";
import { ToolBaseHeader } from "@src/packages/ui/ToolBaseHeader";
import React, { useMemo, useState } from "react";
import { useDrag, useDrop } from "react-dnd";
import { FiCheck, FiChevronDown, FiChevronRight, FiClock, FiCode, FiEdit3, FiFolder, FiFolderPlus, FiPlus, FiSearch, FiTag, FiTrash2, FiX, FiZap } from "react-icons/fi";
import { twMerge } from "tailwind-merge";

const DND_ITEM_TYPE = "TAG_ITEM";

export class TagCellRenderer implements Renderer<TagModel> {
  type: keyof TagModel | "actions";
  onToggle?: (id: string) => void;
  onEdit?: (tag: TagModel) => void;
  onDelete?: (id: string) => void;
  onToggleFolder?: (name: string, isCollapsed: boolean) => void;
  isFolderCollapsed?: (name: string) => boolean;
  onDeleteFolder?: (name: string) => void;
  onRenameFolder?: (name: string) => void;
  onMoveTag?: (tagId: string, folder: string) => void;

  constructor(
    type: keyof TagModel | "actions",
    handlers: {
      onToggle?: (id: string) => void,
      onEdit?: (tag: TagModel) => void,
      onDelete?: (id: string) => void,
      onToggleFolder?: (name: string, isCollapsed: boolean) => void,
      isFolderCollapsed?: (name: string) => boolean,
      onDeleteFolder?: (name: string) => void,
      onRenameFolder?: (name: string) => void,
      onMoveTag?: (tagId: string, folder: string) => void
    } = {}
  ) {
    this.type = type;
    this.onToggle = handlers.onToggle;
    this.onEdit = handlers.onEdit;
    this.onDelete = handlers.onDelete;
    this.onToggleFolder = handlers.onToggleFolder;
    this.isFolderCollapsed = handlers.isFolderCollapsed;
    this.onDeleteFolder = handlers.onDeleteFolder;
    this.onRenameFolder = handlers.onRenameFolder;
    this.onMoveTag = handlers.onMoveTag;
  }

  render({ input }: { input: TagModel }): React.ReactNode {
    return <DraggableCell type={this.type} input={input} handlers={this} />;
  }
}

const DraggableCell = ({ type, input, handlers }: { type: string, input: any, handlers: any }) => {
  const isFolder = input.__isFolder;
  const [{ isDragging }, drag] = useDrag({
    type: DND_ITEM_TYPE,
    item: { id: input.id, isFolder },
    canDrag: !isFolder,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: DND_ITEM_TYPE,
    drop: (item: { id: string, isFolder: boolean }, monitor) => {
      if (monitor.didDrop()) return;
      if (isFolder && !item.isFolder) {
        handlers.onMoveTag?.(item.id, input.name);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver({ shallow: true }),
      canDrop: !!monitor.canDrop() && isFolder,
    }),
  });

  let content: React.ReactNode;

  if (isFolder) {
    const isCollapsed = handlers.isFolderCollapsed?.(input.name);
    if (type === "name") {
      content = (
        <div
          onClick={() => handlers.onToggleFolder?.(input.name, !isCollapsed)}
          className="flex items-center gap-2 font-black text-zinc-100 uppercase tracking-widest cursor-pointer select-none py-1"
        >
          {isCollapsed ? <FiChevronRight className="text-zinc-500" /> : <FiChevronDown className="text-blue-400" />}
          <FiFolder className={twMerge("shrink-0", isCollapsed ? "text-zinc-600" : "text-blue-500")} />
          <span>{input.name}</span>
          <span className="text-[10px] text-zinc-600 font-medium ml-2">({input.itemCount} items)</span>
        </div>
      );
    } else if (type === "actions") {
      content = (
        <div className="flex justify-end gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handlers.onRenameFolder?.(input.name); }}
            className="p-1.5 hover:bg-white/5 text-zinc-600 hover:text-blue-400 transition-colors rounded"
            title="Rename Folder"
          >
            <FiEdit3 size={12} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handlers.onDeleteFolder?.(input.name); }}
            className="p-1.5 hover:bg-red-500/10 text-zinc-600 hover:text-red-500 transition-colors rounded"
            title="Delete Folder"
          >
            <FiTrash2 size={12} />
          </button>
        </div>
      );
    } else {
      content = null;
    }

    return (
      <div ref={drop} className={twMerge(
        "flex items-center h-full w-full relative transition-all duration-300",
        isOver && "bg-blue-600/20 ring-2 ring-inset ring-blue-500/50",
        canDrop && !isOver && "bg-blue-500/5"
      )}>
        {content}
      </div>
    );
  }

  // Normal Tag Rule Rendering
  const tagInput = input as TagModel;

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
        <div className="flex items-center gap-2 w-full group/drag">
          <div className="p-1 -ml-1 rounded hover:bg-white/5 text-zinc-700 group-hover/drag:text-blue-500 transition-colors">
            <FiTag size={12} className={twMerge(isDragging && "text-blue-500")} />
          </div>
          <span className="font-bold text-zinc-200 group-hover/drag:text-white transition-colors">{input.name}</span>
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
    <div ref={drag} className={twMerge("flex items-center h-full w-full cursor-grab active:cursor-grabbing", isDragging && "opacity-30 bg-blue-500/10")}>
      {content}
    </div>
  );
};

const TagList: React.FC = () => {
  const { tags, folders, addTag, updateTag, deleteTag, deleteFolder, addFolder, renameFolder, moveTag, toggleTag, toggleFolder } = useTagContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagModel | null>(null);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingFolder, setEditingFolder] = useState<string | null>(null);

  const toggleFolderCollapse = (folder: string) => {
    setCollapsedFolders((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(folder)) next.delete(folder);
      else next.add(folder);
      return next;
    });
  };

  const tableData = useMemo(() => {
    const data: any[] = [];
    const filteredTags = tags.filter(t =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.matchingRule.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.tag.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Add Root Items
    const rootItems = filteredTags.filter(t => !t.folder || t.folder.trim() === "");
    data.push(...rootItems);

    // Add Folders
    const sortedFolders = [...folders].sort((a, b) => a.localeCompare(b));
    sortedFolders.forEach(folderName => {
      const folderItems = filteredTags.filter(t => t.folder === folderName);
      const isCollapsed = collapsedFolders.has(folderName);

      data.push({
        id: `folder-${folderName}`,
        name: folderName,
        __isFolder: true,
        itemCount: folderItems.length,
      });

      if (!isCollapsed) {
        data.push(...folderItems.map(item => ({ ...item, __isNested: true })));
      }
    });

    return data;
  }, [tags, folders, collapsedFolders, searchTerm]);

  const [{ canDropGlobal }, dropRef] = useDrop({
    accept: DND_ITEM_TYPE,
    collect: (monitor) => ({
      canDropGlobal: !!monitor.canDrop()
    })
  });

  const rendererHandlers = {
    onToggle: toggleTag,
    onEdit: (tag: TagModel) => { setEditingTag(tag); setIsModalOpen(true); },
    onDelete: deleteTag,
    onMoveTag: moveTag,
    onToggleFolder: toggleFolderCollapse,
    isFolderCollapsed: (name: string) => collapsedFolders.has(name),
    onRenameFolder: (name: string) => {
      setEditingFolder(name);
      setNewFolderName(name);
      setIsFolderModalOpen(true);
    },
    onDeleteFolder: (name: string) => {
      if (confirm(`Are you sure you want to delete folder "${name}"? This will delete ${tags.filter(t => t.folder === name).length} tags.`)) {
        deleteFolder(name);
      }
    }
  };

  const headers = [
    { title: "Active", minWidth: 80, renderer: new TagCellRenderer("enabled", rendererHandlers) },
    { title: "Tag Rule Name", minWidth: 250, renderer: new TagCellRenderer("name", rendererHandlers) },
    { title: "Method", minWidth: 80, renderer: new TagCellRenderer("method", rendererHandlers) },
    { title: "Scope", minWidth: 100, renderer: new TagCellRenderer("scope", rendererHandlers) },
    { title: "Type", minWidth: 100, renderer: new TagCellRenderer("isSync", rendererHandlers) },
    { title: "Pattern", minWidth: 250, renderer: new TagCellRenderer("matchingRule", rendererHandlers) },
    { title: "Applied Tag", minWidth: 200, renderer: new TagCellRenderer("tag", rendererHandlers) },
    { title: "Actions", minWidth: 100, renderer: new TagCellRenderer("actions", rendererHandlers) }
  ];

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
      folder: editingTag ? editingTag.folder : "",
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
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setIsFolderModalOpen(true)}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 rounded-lg text-xs font-bold border border-zinc-800 transition-all flex items-center gap-2 "
            >
              <FiFolderPlus className="text-zinc-500" />
              New Folder
            </button>
            <button
              onClick={() => { setEditingTag(null); setIsModalOpen(true); }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              <FiPlus />
              Add Tag Rule
            </button>
          </div>
        }
      />

      <div className="flex flex-col flex-grow min-h-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-900 bg-zinc-900/10 flex items-center gap-3">
          <div className="relative flex-grow max-w-md">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input
              type="text"
              placeholder="Search by name, pattern, or tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-xs text-zinc-300 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
        </div>

        <div ref={dropRef} className="flex-grow flex flex-col relative min-h-0">
          <TableView
            headers={headers}
            data={tableData}
            className="flex-grow"
          />
          <RootDropZone onMoveToRoot={(id) => moveTag(id, "")} />
        </div>
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
              <div className="space-y-4">
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
                {editingFolder ? "Rename Folder" : "Create New Folder"}
              </h3>
              <button
                onClick={() => { setIsFolderModalOpen(false); setEditingFolder(null); setNewFolderName(""); }}
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
                      if (editingFolder) {
                        renameFolder(editingFolder, newFolderName.trim());
                      } else {
                        addFolder(newFolderName.trim());
                      }
                      setNewFolderName("");
                      setEditingFolder(null);
                      setIsFolderModalOpen(false);
                    }
                    if (e.key === 'Escape') {
                      setIsFolderModalOpen(false);
                      setEditingFolder(null);
                      setNewFolderName("");
                    }
                  }}
                  placeholder="e.g. Analytics Rules"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => { setIsFolderModalOpen(false); setEditingFolder(null); setNewFolderName(""); }}
                  className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={!newFolderName.trim() || newFolderName.trim() === editingFolder}
                  onClick={() => {
                    if (editingFolder) {
                      renameFolder(editingFolder, newFolderName.trim());
                    } else {
                      addFolder(newFolderName.trim());
                    }
                    setNewFolderName("");
                    setEditingFolder(null);
                    setIsFolderModalOpen(false);
                  }}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg text-xs font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                >
                  {editingFolder ? "Rename" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const RootDropZone = ({ onMoveToRoot }: { onMoveToRoot: (id: string) => void }) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: DND_ITEM_TYPE,
    drop: (item: { id: string }) => {
      onMoveToRoot(item.id);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  });

  if (!canDrop) return null;

  return (
    <div
      ref={drop}
      className={twMerge(
        "mt-12 mx-8 mb-24 py-10 border-2 border-dashed rounded-2xl flex items-center justify-center transition-all duration-500 relative group/dropzone overflow-hidden",
        isOver
          ? "border-blue-500 bg-blue-500/20 text-blue-400 scale-[1.05] shadow-[0_0_60px_rgba(59,130,246,0.25)] ring-4 ring-blue-500/10"
          : "border-zinc-800 text-zinc-600 hover:border-zinc-700 bg-zinc-900/20"
      )}
    >
      <div className={twMerge(
        "absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent transition-opacity duration-500",
        isOver ? "opacity-100" : "opacity-0"
      )} />

      <div className="flex flex-col items-center gap-4 relative z-10 text-center px-10">
        <div className={twMerge(
          "w-12 h-12 rounded-2xl border-2 flex items-center justify-center transition-all duration-500",
          isOver ? "bg-blue-600 border-blue-400 text-white rotate-12 scale-110" : "bg-zinc-800 border-zinc-700 text-zinc-500 group-hover/dropzone:text-zinc-400"
        )}>
          <FiTag size={24} />
        </div>
        <div className="space-y-1">
          <span className={twMerge(
            "text-base font-black tracking-tighter transition-colors",
            isOver ? "text-white" : "text-zinc-500 group-hover/dropzone:text-zinc-400"
          )}>
            ORGANIZE TO ROOT
          </span>
          <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest opacity-60">
            Release to unassign from any folder
          </p>
        </div>
      </div>

      {isOver && (
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-blue-500 animate-shimmer" />
      )}
    </div>
  );
};

export default TagList;
