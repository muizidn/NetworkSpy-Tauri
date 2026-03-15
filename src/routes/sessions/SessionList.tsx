import { Session, SessionFolder, useSessionContext } from "@src/context/SessionContext";
import { Renderer, TableView, TableViewHeader } from "@src/packages/ui/TableView";
import { ToolBaseHeader } from "@src/packages/ui/ToolBaseHeader";
import React, { useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { FiChevronDown, FiChevronRight, FiClock, FiEdit3, FiFolder, FiFolderPlus, FiSearch, FiTrash2, FiX, FiMove, FiMinusCircle, FiEye, FiDownload } from "react-icons/fi";
import { twMerge } from "tailwind-merge";
import { useNavigate } from "react-router-dom";
import { useTrafficListContext } from "@src/packages/main-content/context/TrafficList";
import { open, save } from "@tauri-apps/plugin-dialog";

export interface SessionFolderRow extends SessionFolder {
  __isFolder: true;
  __isNested: false;
  itemCount: number;
  isCollapsed: boolean;
}

export class SessionCellRenderer implements Renderer<Session | SessionFolderRow> {
  type: keyof Session | "actions";
  onView?: (session: Session) => void;
  onDelete?: (id: string) => void;
  onToggleFolderCollapse?: (id: string) => void;
  onDeleteFolder?: (id: string, name: string) => void;
  onRenameFolderRequest?: (folder: SessionFolder) => void;
  onMoveRequest?: (session: Session) => void;
  onExportRequest?: (session: Session) => void;

  constructor(
    type: keyof Session | "actions",
    handlers: {
      onView?: (session: Session) => void,
      onDelete?: (id: string) => void,
      onToggleFolderCollapse?: (id: string) => void,
      onDeleteFolder?: (id: string, name: string) => void,
      onRenameFolderRequest?: (folder: SessionFolder) => void,
      onMoveRequest?: (session: Session) => void,
      onExportRequest?: (session: Session) => void
    } = {}
  ) {
    this.type = type;
    this.onView = handlers.onView;
    this.onDelete = handlers.onDelete;
    this.onToggleFolderCollapse = handlers.onToggleFolderCollapse;
    this.onDeleteFolder = handlers.onDeleteFolder;
    this.onRenameFolderRequest = handlers.onRenameFolderRequest;
    this.onMoveRequest = handlers.onMoveRequest;
    this.onExportRequest = handlers.onExportRequest;
  }

  render({ input }: { input: Session | SessionFolderRow }): React.ReactNode {
    return <SessionCell type={this.type} input={input} handlers={this} />;
  }
}

const SessionCell = ({ type, input, handlers }: {
  type: string, input: Session | SessionFolderRow, handlers: {
    onView?: (session: Session) => void,
    onDelete?: (id: string) => void,
    onToggleFolderCollapse?: (id: string) => void,
    onDeleteFolder?: (id: string, name: string) => void,
    onRenameFolderRequest?: (folder: SessionFolder) => void,
    onMoveRequest?: (session: Session) => void,
    onExportRequest?: (session: Session) => void
  }
}) => {
  const isFolder = typeof input === "object" && "__isFolder" in input;

  let content: React.ReactNode;

  if (isFolder) {
    const folder = input as SessionFolderRow;
    const isCollapsed = folder.isCollapsed;

    if (type === "name") {
      content = (
        <div
          onClick={() => handlers.onToggleFolderCollapse?.(folder.id)}
          className="flex items-center gap-2 font-black text-zinc-100 uppercase tracking-widest cursor-pointer select-none py-1"
        >
          {isCollapsed ? <FiChevronRight className="text-zinc-500" /> : <FiChevronDown className="text-blue-400" />}
          <FiFolder className={twMerge("shrink-0", isCollapsed ? "text-zinc-600" : "text-blue-500")} />
          <span>{folder.name}</span>
          <span className="text-[10px] text-zinc-600 font-medium ml-2">({folder.itemCount} sessions)</span>
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
    const session = input as Session;
    switch (type) {
      case "name":
        content = (
          <div className="flex items-center gap-2 w-full">
            <div className="p-1 -ml-1 text-zinc-700">
              <FiClock size={12} />
            </div>
            <span className="font-bold text-zinc-200">{session.name}</span>
          </div>
        );
        break;
      case "createdAt":
        content = <span className="text-zinc-500 font-mono text-xs">{session.createdAt}</span>;
        break;
      case "actions":
        content = (
          <div className="flex items-center gap-1 justify-end">
             <button
              onClick={() => handlers.onView?.(session)}
              className="px-3 py-1 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white rounded text-[10px] font-bold transition-all flex items-center gap-1"
              title="View Session"
            >
              <FiEye size={12} />
              VIEW
            </button>
            <button
              onClick={() => handlers.onExportRequest?.(session)}
              className="p-1.5 hover:bg-white/5 rounded-md text-zinc-500 hover:text-blue-400 transition-colors"
              title="Export Session"
            >
              <FiDownload size={14} />
            </button>
            <button
              onClick={() => handlers.onMoveRequest?.(session)}
              className="p-1.5 hover:bg-white/5 rounded-md text-zinc-500 hover:text-amber-400 transition-colors"
              title="Move to Folder"
            >
              <FiMove size={14} />
            </button>
            <button
              onClick={() => handlers.onDelete?.(session.id)}
              className="p-1.5 hover:bg-white/5 rounded-md text-zinc-500 hover:text-red-400 transition-colors"
              title="Delete Session"
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
    <div className="flex items-center h-full w-full px-2">
      {content}
    </div>
  );
};

const SessionList: React.FC = () => {
  const { sessions, folders, deleteSession, deleteFolder, addFolder, renameFolder, moveSession, viewSession, importHar, exportSession } = useSessionContext();
  const { setTrafficList, setTrafficSet } = useTrafficListContext();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [collapsedFolderIds, setCollapsedFolderIds] = useState<Set<string>>(new Set());
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingFolder, setEditingFolder] = useState<SessionFolder | null>(null);

  const [movingSession, setMovingSession] = useState<Session | null>(null);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);

  const [exportingSession, setExportingSession] = useState<Session | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const [importingHarPath, setImportingHarPath] = useState<string | null>(null);
  const [importSessionName, setImportSessionName] = useState("");
  const [isImportNameModalOpen, setIsImportNameModalOpen] = useState(false);

  const toggleFolderCollapse = useCallback((folderId: string) => {
    setCollapsedFolderIds((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  }, []);

  const handleViewSession = async (session: Session) => {
    try {
      const traffic = await viewSession(session);
      if (traffic) {
        setTrafficList(traffic);
        const newSet: Record<string, any> = {};
        traffic.forEach(t => {
           // We don't have full data in metadata, but enough for list
           newSet[t.id as string] = t; 
        });
        setTrafficSet(newSet);
        navigate("/");
      }
    } catch (e) {
      alert("Failed to load session: " + e);
    }
  };

  const handleImportHar = async () => {
    const path = await open({
      filters: [{ name: "HAR", extensions: ["har"] }],
      multiple: false
    });
    
    if (path && typeof path === 'string') {
      setImportingHarPath(path);
      setImportSessionName(`Imported HAR ${new Date().toLocaleString()}`);
      setIsImportNameModalOpen(true);
    }
  };

  const confirmImportHar = async () => {
    if (importingHarPath && importSessionName.trim()) {
      try {
        await importHar(importSessionName.trim(), importingHarPath);
        // Success
      } catch (e) {
        alert("Failed to import HAR: " + e);
      } finally {
        setIsImportNameModalOpen(false);
        setImportingHarPath(null);
        setImportSessionName("");
      }
    }
  };

  const handleExport = async (format: 'har' | 'csv' | 'sqlite') => {
    if (!exportingSession) return;
    
    let extension = format === 'sqlite' ? 'db' : format;
    const path = await save({
      filters: [{ name: format.toUpperCase(), extensions: [extension] }],
      defaultPath: `${exportingSession.name}.${extension}`
    });

    if (path) {
      try {
        await exportSession(exportingSession.id, format, path);
        alert("Export successful!");
      } catch (e) {
        alert("Export failed: " + e);
      }
    }
    setIsExportModalOpen(false);
    setExportingSession(null);
  };

  const tableData = useMemo(() => {
    const data: (Session | SessionFolderRow)[] = [];
    const filteredSessions = sessions.filter(s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Add Root Items
    const rootItems = filteredSessions.filter(s => !s.folderId || s.folderId.trim() === "");
    data.push(...rootItems);

    // Add Folders
    const sortedFolders = [...folders].sort((a, b) => a.name.localeCompare(b.name));
    sortedFolders.forEach(folder => {
      const folderItems = filteredSessions.filter(s => s.folderId === folder.id);
      const isCollapsed = collapsedFolderIds.has(folder.id);

      data.push({
        ...folder,
        __isFolder: true,
        __isNested: false,
        itemCount: folderItems.length,
        isCollapsed,
      });

      if (!isCollapsed) {
        data.push(...folderItems.map(item => ({ ...item, __isNested: true })));
      }
    });

    return data;
  }, [sessions, folders, collapsedFolderIds, searchTerm]);

  const rendererHandlers = useMemo(() => ({
    onView: handleViewSession,
    onDelete: deleteSession,
    onMoveRequest: (session: Session) => { setMovingSession(session); setIsMoveModalOpen(true); },
    onExportRequest: (session: Session) => { setExportingSession(session); setIsExportModalOpen(true); },
    onToggleFolderCollapse: toggleFolderCollapse,
    onRenameFolderRequest: (folder: SessionFolder) => {
      setEditingFolder(folder);
      setNewFolderName(folder.name);
      setIsFolderModalOpen(true);
    },
    onDeleteFolder: (id: string, name: string) => {
      if (confirm(`Are you sure you want to delete folder "${name}"? Sessions inside will be moved to root.`)) {
        deleteFolder(id);
      }
    }
  }), [deleteSession, toggleFolderCollapse, deleteFolder, handleViewSession]);

  const headers: TableViewHeader<Session | SessionFolderRow>[] = useMemo(() => [
    { title: "Session Name", minWidth: 350, renderer: new SessionCellRenderer("name", rendererHandlers) as any },
    { title: "Date Saved", minWidth: 200, renderer: new SessionCellRenderer("createdAt", rendererHandlers) as any },
    { title: "Actions", minWidth: 150, renderer: new SessionCellRenderer("actions", rendererHandlers) as any }
  ], [rendererHandlers]);

  const handleMoveSession = (folderId: string | null) => {
    if (movingSession) {
      moveSession(movingSession.id, folderId);
      setMovingSession(null);
      setIsMoveModalOpen(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] relative">
      <ToolBaseHeader
        title="Saved Sessions"
        description="Review past network traffic sessions or import HAR files"
        icon={<FiClock size={22} />}
        actions={
          <div className="flex gap-2">
            <button
               onClick={handleImportHar}
               className="px-4 py-2 bg-amber-600/10 hover:bg-amber-600 text-amber-500 hover:text-white rounded-lg text-xs font-bold border border-amber-600/20 transition-all flex items-center gap-2"
            >
              <FiDownload />
              Import HAR
            </button>
            <button
              onClick={() => setIsFolderModalOpen(true)}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 rounded-lg text-xs font-bold border border-zinc-800 transition-all flex items-center gap-2 "
            >
              <FiFolderPlus className="text-zinc-500" />
              New Folder
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
              placeholder="Search sessions..."
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

      {isMoveModalOpen && movingSession && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div 
            className="bg-[#111111] border border-zinc-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <FiMove className="text-amber-400" />
                Move to Folder
              </h3>
              <button
                onClick={() => { setIsMoveModalOpen(false); setMovingSession(null); }}
                className="p-1 hover:bg-white/10 rounded-md text-zinc-500 hover:text-white transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-3 px-2">Select Destination</p>
              <div className="space-y-1">
                <button
                  onClick={() => handleMoveSession(null)}
                  className={twMerge(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left",
                    !movingSession.folderId ? "bg-blue-600/10 text-blue-400 border border-blue-500/30" : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <FiMinusCircle className="shrink-0" />
                  <span className="font-bold">Root (No Folder)</span>
                </button>
                {folders.map(folder => (
                  <button
                    key={folder.id}
                    onClick={() => handleMoveSession(folder.id)}
                    className={twMerge(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left",
                      movingSession.folderId === folder.id ? "bg-blue-600/10 text-blue-400 border border-blue-500/30" : "text-zinc-400 hover:bg-white/5 hover:text-white"
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
                onClick={() => { setIsMoveModalOpen(false); setMovingSession(null); }}
                className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {isFolderModalOpen && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div 
            className="bg-[#111111] border border-zinc-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
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
                  }}
                  placeholder="e.g. Debugging Sessions"
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
        </div>,
        document.body
      )}

      {isExportModalOpen && exportingSession && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div 
            className="bg-[#111111] border border-zinc-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <FiDownload className="text-blue-400" />
                Export Session
              </h3>
              <button
                onClick={() => { setIsExportModalOpen(false); setExportingSession(null); }}
                className="p-1 hover:bg-white/10 rounded-md text-zinc-500 hover:text-white transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="p-4 space-y-2">
              <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-3 px-2">Choose Format</p>
              <button
                onClick={() => handleExport('har')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold text-zinc-300 hover:bg-blue-600/10 hover:text-blue-400 border border-transparent hover:border-blue-500/30 transition-all text-left"
              >
                <div className="w-8 h-8 rounded bg-amber-500/10 flex items-center justify-center text-amber-500 font-black italic">H</div>
                <span>Export as HAR (HTTP Archive)</span>
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold text-zinc-300 hover:bg-green-600/10 hover:text-green-400 border border-transparent hover:border-green-500/30 transition-all text-left"
              >
                <div className="w-8 h-8 rounded bg-green-500/10 flex items-center justify-center text-green-500 font-black italic">C</div>
                <span>Export as CSV (Spreadsheet)</span>
              </button>
              <button
                onClick={() => handleExport('sqlite')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold text-zinc-300 hover:bg-purple-600/10 hover:text-purple-400 border border-transparent hover:border-purple-500/30 transition-all text-left"
              >
                <div className="w-8 h-8 rounded bg-purple-500/10 flex items-center justify-center text-purple-500 font-black italic">S</div>
                <span>Export as SQLite (.db)</span>
              </button>
            </div>
            <div className="p-4 border-t border-zinc-900 bg-zinc-900/20 flex justify-end">
              <button
                onClick={() => { setIsExportModalOpen(false); setExportingSession(null); }}
                className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {isImportNameModalOpen && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div 
            className="bg-[#111111] border border-zinc-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <FiDownload className="text-amber-400" />
                Import HAR Session
              </h3>
              <button
                onClick={() => { setIsImportNameModalOpen(false); setImportingHarPath(null); }}
                className="p-1 hover:bg-white/10 rounded-md text-zinc-500 hover:text-white transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Session Name</label>
                <input
                  autoFocus
                  value={importSessionName}
                  onChange={(e) => setImportSessionName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && importSessionName.trim()) {
                      confirmImportHar();
                    }
                  }}
                  placeholder="e.g. Chrome Export"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => { setIsImportNameModalOpen(false); setImportingHarPath(null); }}
                  className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={!importSessionName.trim()}
                  onClick={confirmImportHar}
                  className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg text-xs font-bold shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                >
                  Import
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default SessionList;
