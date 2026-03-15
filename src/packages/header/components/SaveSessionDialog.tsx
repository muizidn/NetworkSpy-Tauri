import React, { useState } from "react";
import { createPortal } from "react-dom";
import { FiSave, FiX, FiFolder } from "react-icons/fi";

interface SaveSessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string, folderId?: string) => void;
  folders: { id: string, name: string }[];
}

export const SaveSessionDialog: React.FC<SaveSessionDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  folders,
}) => {
  const [sessionName, setSessionName] = useState(new Date().toLocaleString());
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div 
        className="bg-[#111111] border border-zinc-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
          <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <FiSave className="text-blue-400" />
            Save to Session List
          </h3>
          <button
            onClick={onClose}
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
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && sessionName.trim()) {
                  onConfirm(sessionName.trim(), selectedFolderId || undefined);
                  onClose();
                }
              }}
              placeholder="e.g. My Capture"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Select Folder (Optional)</label>
            <div className="relative">
              <FiFolder className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
              <select
                value={selectedFolderId}
                onChange={(e) => setSelectedFolderId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 transition-colors appearance-none"
              >
                <option value="">Root (No Folder)</option>
                {folders.map(folder => (
                  <option key={folder.id} value={folder.id}>{folder.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={!sessionName.trim()}
              onClick={() => {
                onConfirm(sessionName.trim(), selectedFolderId || undefined);
                onClose();
              }}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg text-xs font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95"
            >
              Save Session
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
