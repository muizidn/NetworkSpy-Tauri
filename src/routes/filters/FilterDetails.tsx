import React, { useState, useEffect } from "react";
import { FiEdit3, FiCheck, FiInfo, FiTag, FiCopy, FiTrash2 } from "react-icons/fi";
import { PredefinedFilter, FilterNode } from "@src/models/Filter";
import { useFilterPresetContext } from "@src/context/FilterPresetContext";
import { twMerge } from "tailwind-merge";

interface FilterDetailsProps {
    filter: PredefinedFilter;
}

const FilterDetails: React.FC<FilterDetailsProps> = ({ filter }) => {
    const { updatePreset, removePreset } = useFilterPresetContext();
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(filter.name);
    const [editDesc, setEditDesc] = useState(filter.description || "");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    useEffect(() => {
        setEditName(filter.name);
        setEditDesc(filter.description || "");
        setIsEditing(false);
    }, [filter]);

    const handleSave = () => {
        updatePreset(filter.id, {
            name: editName,
            description: editDesc
        });
        setIsEditing(false);
    };

    const confirmDelete = () => {
        removePreset(filter.id);
        setIsDeleteModalOpen(false);
    };

    return (
        <div className="flex flex-col h-full bg-[#050505] overflow-y-auto no-scrollbar">
            {/* Header / Title Area */}
            <div className="px-8 py-10 bg-gradient-to-b from-blue-600/10 to-transparent border-b border-zinc-900/50">
                <div className="flex items-start justify-between">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.15)]">
                                <span className="text-2xl">⚡</span>
                            </div>
                            <div>
                                {isEditing ? (
                                    <input 
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-xl font-bold text-white focus:outline-none focus:border-blue-500/50"
                                    />
                                ) : (
                                    <h1 className="text-3xl font-black text-white tracking-tight">{filter.name}</h1>
                                )}
                                <div className="flex items-center gap-4 mt-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-500/80">Preset Filter</span>
                                    <span className="text-[10px] text-zinc-600 font-mono">ID: {filter.id}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {!filter.isBuiltIn && (
                            <button 
                                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                                className={twMerge(
                                    "flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition-all",
                                    isEditing 
                                        ? "bg-green-600 text-white hover:bg-green-500 shadow-lg shadow-green-900/20" 
                                        : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700"
                                )}
                            >
                                {isEditing ? <><FiCheck /> Save Changes</> : <><FiEdit3 /> Edit Detail</>}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="px-10 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Description and Metadata */}
                <div className="lg:col-span-2 space-y-12">
                    <section>
                        <div className="flex items-center justify-between mb-4 border-b border-zinc-900 pb-2">
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                                <FiInfo className="text-blue-500" />
                                Description
                            </h2>
                        </div>
                        {isEditing ? (
                            <textarea 
                                value={editDesc}
                                onChange={(e) => setEditDesc(e.target.value)}
                                placeholder="Describe what this filter does (Markdown supported)..."
                                className="w-full h-48 bg-zinc-950 border border-zinc-800 rounded-2xl p-6 text-sm text-zinc-300 font-medium focus:outline-none focus:border-blue-500/30 transition-all resize-none italic"
                            />
                        ) : (
                            <div className="bg-zinc-900/30 border border-zinc-900 rounded-3xl p-8 min-h-[200px] relative group overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/20 group-hover:bg-blue-500/40 transition-colors" />
                                <p className="text-sm text-zinc-400 leading-relaxed font-medium whitespace-pre-wrap">
                                    {filter.description || "No description provided for this filter. Adding a description helps your team understand the intent of the rules."}
                                </p>
                            </div>
                        )}
                    </section>

                    <section>
                        <div className="flex items-center justify-between mb-6 border-b border-zinc-900 pb-2">
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                                <FiTag className="text-amber-500" />
                                Rules Breakdown
                            </h2>
                            <span className="text-[10px] font-mono text-zinc-700 bg-zinc-900 px-2 py-0.5 rounded">{filter.filters.length} Conditions</span>
                        </div>
                        
                        <div className="space-y-3">
                            {filter.filters.length === 0 ? (
                                <div className="p-8 text-center bg-zinc-900/20 border border-zinc-900 rounded-2xl border-dashed">
                                    <p className="text-xs text-zinc-600">This filter effectively allows all traffic as it contains no rules.</p>
                                </div>
                            ) : (
                                filter.filters.map((node) => (
                                    <RuleCard key={node.id} node={node} />
                                ))
                            )}
                        </div>
                    </section>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-8">
                     <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 space-y-6 shadow-xl">
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-4">Properties</h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center group">
                                    <span className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">Complexity</span>
                                    <span className="text-xs text-zinc-300 font-bold px-2 py-0.5 bg-zinc-800 rounded">{filter.filters.length > 5 ? 'High' : filter.filters.length > 2 ? 'Medium' : 'Low'}</span>
                                </div>
                                <div className="flex justify-between items-center group">
                                    <span className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">Shared</span>
                                    <span className="text-xs text-emerald-500 font-bold px-2 py-0.5 bg-emerald-500/10 rounded">Local Only</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-zinc-800">
                             <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-4">Share Actions</h4>
                             <button 
                                onClick={() => {
                                    navigator.clipboard.writeText(JSON.stringify(filter, null, 2));
                                    alert('Copied to clipboard!');
                                }}
                                className="w-full flex items-center justify-between p-3 rounded-2xl bg-zinc-800/50 hover:bg-blue-600 hover:text-white transition-all text-zinc-400"
                             >
                                <span className="text-xs font-bold">Copy JSON Payload</span>
                                <FiCopy />
                             </button>
                        </div>
                     </div>

                     {!filter.isBuiltIn && (
                        <div className="p-6 rounded-3xl bg-rose-500/5 border border-rose-500/10 space-y-4">
                             <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-500/60">Danger Zone</h4>
                             <p className="text-[10px] text-rose-500/40">This action is irreversible. All associated rules will be permanently removed.</p>
                             <button 
                                onClick={() => setIsDeleteModalOpen(true)}
                                className="w-full py-3 rounded-2xl border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all text-xs font-bold"
                             >
                                 Permanently Delete
                             </button>
                        </div>
                     )}
                </div>
            </div>
            
            {/* Custom Deletion Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div 
                      className="absolute inset-0" 
                      onClick={() => setIsDeleteModalOpen(false)}
                    />
                    <div className="relative w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-[32px] p-8 space-y-8 shadow-[0_32px_128px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 rounded-[24px] bg-rose-500/10 border border-rose-400/20 flex items-center justify-center text-rose-500 mx-auto shadow-inner">
                            <FiTrash2 size={32} />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-black text-white tracking-tight leading-none uppercase">Confirm Delete</h3>
                            <p className="text-xs text-zinc-500 leading-relaxed italic">
                                This will permanently remove <span className="text-zinc-300 font-bold">"{filter.name}"</span>. 
                                This operation is irreversible and all associated rules will be lost.
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 pt-2">
                            <button 
                              onClick={confirmDelete}
                              className="w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-[11px] tracking-widest uppercase transition-all shadow-lg shadow-rose-950/20 active:scale-[0.98]"
                            >
                                Permanently Delete
                            </button>
                            <button 
                              onClick={() => setIsDeleteModalOpen(false)}
                              className="w-full py-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 font-black text-[11px] tracking-widest uppercase transition-all active:scale-[0.98]"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const RuleCard = ({ node }: { node: FilterNode }) => {
    if (node.isGroup) {
        return (
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 border-l-4 border-l-amber-500/50">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-[9px] font-black uppercase text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded leading-none">Group</span>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Matches {node.logic} conditions</span>
                </div>
                <div className="space-y-2 pl-4 border-l border-zinc-800 py-2">
                    {node.children.map(child => <RuleCard key={child.id} node={child} />)}
                </div>
            </div>
        );
    }

    return (
        <div className="px-5 py-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between hover:border-zinc-700 transition-all shadow-sm">
            <div className="flex items-center gap-4">
                <div className="px-2 py-1 rounded bg-black/40 border border-zinc-800 text-[10px] font-bold tracking-tight text-blue-400">
                    {node.type}
                </div>
                <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest leading-none">{node.operator}</span>
                <span className="text-xs text-zinc-200 font-mono bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800 shadow-inner">
                    {node.value || <span className="text-zinc-700 italic">Empty</span>}
                </span>
            </div>
            {!node.enabled && (
                 <span className="text-[9px] font-bold text-zinc-600 uppercase border border-zinc-800 px-2 py-1 rounded">Disabled</span>
            )}
        </div>
    );
};

export default FilterDetails;
