import { TagFolder, TagModel, useTagContext } from "@src/context/TagContext";
import { ToolMethod } from "@src/models/ToolMethod";
import { Renderer, TableView, TableViewHeader } from "@src/packages/ui/TableView";
import { ToolBaseHeader } from "@src/packages/ui/ToolBaseHeader";
import React, { useMemo, useState, useRef, useCallback } from "react";
import { FiCheck, FiChevronDown, FiChevronRight, FiClock, FiCode, FiEdit3, FiFolder, FiFolderPlus, FiPlus, FiSearch, FiTag, FiTrash2, FiX, FiZap, FiMove, FiMinusCircle } from "react-icons/fi";
import { twMerge } from "tailwind-merge";

// Extended interface for folder rows in the table
export interface TagFolderRow extends TagFolder {
  __isFolder: true;
  __isNested: false;
  itemCount: number;
  enabledCount: number;
}

export class TagCellRenderer implements Renderer<TagModel | TagFolderRow> {
  type: keyof TagModel | "actions";
  onToggle?: (id: string) => void;
  onEdit?: (tag: TagModel) => void;
  onDelete?: (id: string) => void;
  onToggleFolderCollapse?: (id: string) => void;
  isFolderCollapsed?: (id: string) => boolean;
  onDeleteFolder?: (id: string, name: string) => void;
  onRenameFolderRequest?: (folder: TagFolder) => void;
  onMoveRequest?: (tag: TagModel) => void;
  onToggleFolderTags?: (id: string, enable: boolean) => void;

  constructor(
    type: keyof TagModel | "actions",
    handlers: {
      onToggle?: (id: string) => void,
      onEdit?: (tag: TagModel) => void,
      onDelete?: (id: string) => void,
      onToggleFolderCollapse?: (id: string) => void,
      isFolderCollapsed?: (id: string) => boolean,
      onDeleteFolder?: (id: string, name: string) => void,
      onRenameFolderRequest?: (folder: TagFolder) => void,
      onMoveRequest?: (tag: TagModel) => void,
      onToggleFolderTags?: (id: string, enable: boolean) => void
    } = {}
  ) {
    this.type = type;
    this.onToggle = handlers.onToggle;
    this.onEdit = handlers.onEdit;
    this.onDelete = handlers.onDelete;
    this.onToggleFolderCollapse = handlers.onToggleFolderCollapse;
    this.isFolderCollapsed = handlers.isFolderCollapsed;
    this.onDeleteFolder = handlers.onDeleteFolder;
    this.onRenameFolderRequest = handlers.onRenameFolderRequest;
    this.onMoveRequest = handlers.onMoveRequest;
    this.onToggleFolderTags = handlers.onToggleFolderTags;
  }

  render({ input }: { input: TagModel | TagFolderRow }): React.ReactNode {
    return <TagCell type={this.type} input={input} handlers={this} />;
  }
}

const TagCell = ({ type, input, handlers }: {
  type: string, input: TagModel | TagFolderRow, handlers: {
    onToggle?: (id: string) => void,
    onEdit?: (tag: TagModel) => void,
    onDelete?: (id: string) => void,
    onToggleFolderCollapse?: (id: string) => void,
    isFolderCollapsed?: (id: string) => boolean,
    onDeleteFolder?: (id: string, name: string) => void,
    onRenameFolderRequest?: (folder: TagFolder) => void,
    onMoveRequest?: (tag: TagModel) => void,
    onToggleFolderTags?: (id: string, enable: boolean) => void
  }
}) => {
  const isFolder = typeof input === "object" && "__isFolder" in input;

  let content: React.ReactNode;

  if (isFolder) {
    const folder = input as TagFolderRow;
    const isCollapsed = handlers.isFolderCollapsed?.(folder.id);

    if (type === "enabled") {
      const allEnabled = folder.enabledCount === folder.itemCount && folder.itemCount > 0;
      const someEnabled = folder.enabledCount > 0 && folder.enabledCount < folder.itemCount;

      content = (
        <button
          onClick={() => handlers.onToggleFolderTags?.(folder.id, !allEnabled)}
          className={twMerge(
            "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
            allEnabled
              ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/40"
              : someEnabled
                ? "bg-blue-600/30 border-blue-500/50 text-blue-400"
                : "bg-zinc-900 border-zinc-800 text-transparent hover:border-zinc-700"
          )}
        >
          {allEnabled ? <FiCheck size={12} /> : someEnabled ? <div className="w-2 h-0.5 bg-current rounded-full" /> : null}
        </button>
      );
    } else if (type === "name") {
      content = (
        <div
          onClick={() => handlers.onToggleFolderCollapse?.(folder.id)}
          className="flex items-center gap-2 font-black text-zinc-100 uppercase tracking-widest cursor-pointer select-none py-1"
        >
          {isCollapsed ? <FiChevronRight className="text-zinc-500" /> : <FiChevronDown className="text-blue-400" />}
          <FiFolder className={twMerge("shrink-0", isCollapsed ? "text-zinc-600" : "text-blue-500")} />
          <span>{folder.name}</span>
          <span className="text-[10px] text-zinc-600 font-medium ml-2">({folder.itemCount} items)</span>
        </div>
      );
    } else if (type === "actions") {
      content = (
        <div className="flex justify-end gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handlers.onRenameFolderRequest?.({ id: folder.id, name: folder.name }); }}
            className="p-1.5 hover:bg-white/5 text-zinc-600 hover:text-blue-400 transition-colors rounded"
            title="Rename Folder"
          >
            <FiEdit3 size={12} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handlers.onDeleteFolder?.(folder.id, folder.name); }}
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
  } else {
    const tag = input as TagModel;
    switch (type) {
      case "enabled":
        const isChecked = tag.enabled;
        content = (
          <button
            onClick={() => handlers.onToggle?.(tag.id)}
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
          <div className="flex items-center gap-2 w-full">
            <div className="p-1 -ml-1 text-zinc-700">
              <FiTag size={12} />
            </div>
            <span className="font-bold text-zinc-200">{tag.name}</span>
          </div>
        );
        break;
      case "method":
        content = (
          <span className={twMerge(
            "px-2 py-0.5 rounded text-[10px] font-black tracking-widest border",
            tag.method === 'GET' ? 'bg-blue-950/30 text-blue-400 border-blue-900/50'
              : tag.method === 'ALL' ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                : 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50'
          )}>
            {tag.method}
          </span>
        );
        break;
      case "matchingRule":
        content = <span className="font-mono text-zinc-500 truncate">{tag.matchingRule}</span>;
        break;
      case "tag":
        content = (
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-current"
            style={{
              color: tag.color || '#60a5fa',
              backgroundColor: tag.bgColor || '#3b82f61a',
              borderColor: `${tag.color || '#60a5fa'}33`
            }}
          >
            {tag.tag}
          </span>
        );
        break;
      case "scope":
        content = (
          <div className={twMerge(
            "flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider",
            tag.scope === 'body' ? "text-purple-400 bg-purple-400/10" : "text-zinc-500 bg-zinc-800/50"
          )}>
            {tag.scope === 'body' ? <FiCode size={10} /> : <FiSearch size={10} />}
            {tag.scope === 'body' ? "DEEP" : "SIMPLE"}
          </div>
        );
        break;
      case "isSync":
        content = (
          <div className={twMerge(
            "flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider",
            tag.isSync ? "text-amber-400 bg-amber-400/10" : "text-zinc-500 bg-zinc-800/50"
          )}>
            {tag.isSync ? <FiZap size={10} /> : <FiClock size={10} />}
            {tag.isSync ? "SYNC" : "ASYNC"}
          </div>
        );
        break;
      case "actions":
        content = (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlers.onMoveRequest?.(tag)}
              className="p-1.5 hover:bg-white/5 rounded-md text-zinc-500 hover:text-amber-400 transition-colors"
              title="Move to Folder"
            >
              <FiMove size={14} />
            </button>
            <button
              onClick={() => handlers.onEdit?.(tag)}
              className="p-1.5 hover:bg-white/5 rounded-md text-zinc-500 hover:text-blue-400 transition-colors"
              title="Edit Rule"
            >
              <FiEdit3 size={14} />
            </button>
            <button
              onClick={() => handlers.onDelete?.(tag.id)}
              className="p-1.5 hover:bg-white/5 rounded-md text-zinc-500 hover:text-red-400 transition-colors"
              title="Delete Rule"
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
  }

  return (
    <div className="flex items-center h-full w-full">
      {content}
    </div>
  );
};

const TagList: React.FC = () => {
  const { tags, folders, addTag, updateTag, deleteTag, deleteFolder, addFolder, renameFolder, moveTag, toggleTag, toggleFolder } = useTagContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagModel | null>(null);
  const [collapsedFolderIds, setCollapsedFolderIds] = useState<Set<string>>(new Set());
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingFolder, setEditingFolder] = useState<TagFolder | null>(null);

  const [movingTag, setMovingTag] = useState<TagModel | null>(null);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);

  const toggleFolderCollapse = (folderId: string) => {
    setCollapsedFolderIds((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const tableData = useMemo(() => {
    const data: (TagModel | TagFolderRow)[] = [];
    const filteredTags = tags.filter(t =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.matchingRule.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.tag.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Add Root Items
    const rootItems = filteredTags.filter(t => !t.folderId || t.folderId.trim() === "");
    data.push(...rootItems);

    // Add Folders
    const sortedFolders = [...folders].sort((a, b) => a.name.localeCompare(b.name));
    sortedFolders.forEach(folder => {
      const folderItems = filteredTags.filter(t => t.folderId === folder.id);
      const isCollapsed = collapsedFolderIds.has(folder.id);
      const enabledCount = folderItems.filter(t => t.enabled).length;

      data.push({
        ...folder,
        __isFolder: true,
        __isNested: false,
        itemCount: folderItems.length,
        enabledCount,
      });

      if (!isCollapsed) {
        data.push(...folderItems.map(item => ({ ...item, __isNested: true })));
      }
    });

    return data;
  }, [tags, folders, collapsedFolderIds, searchTerm]);

  const rendererHandlers = {
    onToggle: toggleTag,
    onEdit: (tag: TagModel) => { setEditingTag(tag); setIsModalOpen(true); },
    onDelete: deleteTag,
    onMoveRequest: (tag: TagModel) => { setMovingTag(tag); setIsMoveModalOpen(true); },
    onToggleFolderCollapse: toggleFolderCollapse,
    isFolderCollapsed: (id: string) => collapsedFolderIds.has(id),
    onRenameFolderRequest: (folder: TagFolder) => {
      setEditingFolder(folder);
      setNewFolderName(folder.name);
      setIsFolderModalOpen(true);
    },
    onDeleteFolder: (id: string, name: string) => {
      if (confirm(`Are you sure you want to delete folder "${name}"? Tags inside will be moved to root.`)) {
        deleteFolder(id);
      }
    },
    onToggleFolderTags: (id: string, enable: boolean) => {
      toggleFolder(id, enable);
    }
  };

  const headers: TableViewHeader<TagModel | TagFolderRow>[] = [
    { title: "Active", minWidth: 80, renderer: new TagCellRenderer("enabled", rendererHandlers) as any },
    { title: "Tag Rule Name", minWidth: 250, renderer: new TagCellRenderer("name", rendererHandlers) as any },
    { title: "Method", minWidth: 80, renderer: new TagCellRenderer("method", rendererHandlers) as any },
    { title: "Scope", minWidth: 100, renderer: new TagCellRenderer("scope", rendererHandlers) as any },
    { title: "Type", minWidth: 100, renderer: new TagCellRenderer("isSync", rendererHandlers) as any },
    { title: "Pattern", minWidth: 250, renderer: new TagCellRenderer("matchingRule", rendererHandlers) as any },
    { title: "Applied Tag", minWidth: 200, renderer: new TagCellRenderer("tag", rendererHandlers) as any },
    { title: "Actions", minWidth: 120, renderer: new TagCellRenderer("actions", rendererHandlers) as any }
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
      folderId: editingTag ? editingTag.folderId : undefined,
    };

    if (editingTag) {
      updateTag(editingTag.id, tagData);
    } else {
      addTag(tagData);
    }
    setIsModalOpen(false);
    setEditingTag(null);
  };

  const handleMoveTag = (folderId: string) => {
    if (movingTag) {
      moveTag(movingTag.id, folderId);
      setMovingTag(null);
      setIsMoveModalOpen(false);
    }
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

        <div className="flex-grow flex flex-col relative min-h-0">
          <TableView
            headers={headers}
            data={tableData}
          />
        </div>
      </div>

      {isMoveModalOpen && movingTag && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111111] border border-zinc-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <FiMove className="text-amber-400" />
                Move to Folder
              </h3>
              <button
                onClick={() => { setIsMoveModalOpen(false); setMovingTag(null); }}
                className="p-1 hover:bg-white/10 rounded-md text-zinc-500 hover:text-white transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-3 px-2">Select Destination</p>
              <div className="space-y-1">
                <button
                  onClick={() => handleMoveTag("")}
                  className={twMerge(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left",
                    !movingTag.folderId ? "bg-blue-600/10 text-blue-400 border border-blue-500/30" : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <FiMinusCircle className="shrink-0" />
                  <span className="font-bold">Root (No Folder)</span>
                </button>
                {folders.map(folder => (
                  <button
                    key={folder.id}
                    onClick={() => handleMoveTag(folder.id)}
                    className={twMerge(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left",
                      movingTag.folderId === folder.id ? "bg-blue-600/10 text-blue-400 border border-blue-500/30" : "text-zinc-400 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <FiFolder className="shrink-0" />
                    <span className="font-bold">{folder.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-zinc-900 bg-zinc-900/20 flex justify-end">
              <button
                onClick={() => { setIsMoveModalOpen(false); setMovingTag(null); }}
                className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
                        renameFolder(editingFolder.id, newFolderName.trim());
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
                  disabled={!newFolderName.trim() || newFolderName.trim() === editingFolder?.name}
                  onClick={() => {
                    if (editingFolder) {
                      renameFolder(editingFolder.id, newFolderName.trim());
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

export default TagList;
