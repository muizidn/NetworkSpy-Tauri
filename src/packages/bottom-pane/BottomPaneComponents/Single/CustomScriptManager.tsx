import { useAppProvider } from "@src/packages/app-env";
import { CustomChecker } from "@src/packages/app-env/AppProvider";
import { useState, useEffect } from "react";
import { FiCode, FiPlus, FiSave, FiX, FiEdit2, FiTrash2, FiInfo } from "react-icons/fi";
import { twMerge } from "tailwind-merge";

interface CustomScriptManagerProps {
    category: string;
    onClose?: () => void;
}

export const CustomScriptManager = ({ category }: CustomScriptManagerProps) => {
    const { provider } = useAppProvider();
    const [checkers, setCheckers] = useState<CustomChecker[]>([]);
    const [editChecker, setEditChecker] = useState<Partial<CustomChecker> | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        provider.getCustomCheckers(category).then(setCheckers);
    }, [provider, category]);

    const handleSaveChecker = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editChecker?.name || !editChecker?.script) return;

        const saved = await provider.saveCustomChecker({
            ...editChecker,
            enabled: editChecker.enabled ?? true,
            category: category
        });
        setCheckers(prev => {
            const index = prev.findIndex(c => c.id === saved.id);
            if (index >= 0) {
                const copy = [...prev];
                copy[index] = saved;
                return copy;
            }
            return [saved, ...prev];
        });
        setEditChecker(null);
        setIsAdding(false);
    };

    const handleDeleteChecker = async (id: string) => {
        await provider.deleteCustomChecker(id);
        setCheckers(prev => prev.filter(c => c.id !== id));
    };

    if (isAdding || editChecker) {
        return (
            <form onSubmit={handleSaveChecker} className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 space-y-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-600/20 text-orange-500 rounded-lg flex items-center justify-center">
                            <FiCode size={18} />
                        </div>
                        <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">{editChecker?.id ? 'Edit Custom Script' : 'Create New Script'}</h3>
                    </div>
                    <button type="button" onClick={() => { setIsAdding(false); setEditChecker(null); }} className="text-zinc-500 hover:text-white transition-colors">
                        <FiX size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1 mb-1 block">Checker Name</label>
                        <input
                            type="text"
                            value={editChecker?.name || ''}
                            onChange={e => setEditChecker(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g. My Custom Scanner"
                            className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-600 transition-colors"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1 mb-1 block">Description</label>
                        <input
                            type="text"
                            value={editChecker?.description || ''}
                            onChange={e => setEditChecker(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Briefly describe what this script detects..."
                            className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-600 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1 mb-1 block">JavaScript Logic</label>
                        <div className="relative group">
                            <textarea
                                value={editChecker?.script || ''}
                                onChange={e => setEditChecker(prev => ({ ...prev, script: e.target.value }))}
                                placeholder={`/* Example: Scanning for patterns */
const findings = [];

if (body.includes('sk_test_')) {
    findings.push({ 
        type: 'Test Key Exposure', 
        value: 'Stripe test key found in payload', 
        risk: 'Medium', 
        solution: 'Rotate the key immediately' 
    });
}

return findings;`}
                                className="w-full bg-black border border-zinc-800 rounded-2xl px-4 py-4 text-xs font-mono text-emerald-400 h-64 focus:outline-none focus:border-orange-600 transition-all resize-none leading-relaxed custom-scrollbar"
                                required
                            />
                        </div>
                        <div className="mt-2 bg-blue-950/10 border border-blue-900/20 rounded-xl p-3 flex items-start gap-3">
                            <FiInfo size={14} className="text-blue-500 mt-0.5" />
                            <p className="text-[10px] text-zinc-500 leading-relaxed italic">
                                Script should <strong className="text-white">return</strong> an array of finding objects: <code className="text-blue-400 bg-black/40 px-1 rounded">{"{ type, value, risk, solution }"}</code>. Available variables: <code className="text-blue-400 bg-black/40 px-1 rounded">body</code> (string), <code className="text-blue-400 bg-black/40 px-1 rounded">headers</code> (array).
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 pt-4">
                    <button
                        type="submit"
                        className="flex-grow bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black px-6 py-3 rounded-xl flex items-center justify-center gap-2 uppercase tracking-widest shadow-lg shadow-emerald-900/20 transition-all"
                    >
                        <FiSave /> Save Script
                    </button>
                    <button
                        type="button"
                        onClick={() => { setIsAdding(false); setEditChecker(null); }}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-black px-6 py-3 rounded-xl uppercase tracking-widest transition-all"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    Manage Custom Checkers ({checkers.length})
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="bg-orange-600 hover:bg-orange-500 text-white text-[10px] font-black px-4 py-2 rounded-lg flex items-center gap-2 uppercase tracking-widest transition-all shadow-lg shadow-orange-950/20"
                >
                    <FiPlus /> New Script
                </button>
            </div>

            <div className="space-y-4">
                {checkers.length === 0 ? (
                    <div className="bg-zinc-900/20 border border-zinc-800 border-dashed rounded-3xl p-12 text-center">
                        <div className="w-12 h-12 bg-zinc-800/50 rounded-full flex items-center justify-center text-zinc-500 mx-auto mb-4">
                            <FiCode size={20} />
                        </div>
                        <h3 className="text-sm font-bold text-zinc-400 mb-1 uppercase tracking-widest">No Custom Scripts</h3>
                        <p className="text-xs text-zinc-600 italic">Add your own logic to scan for category-specific patterns.</p>
                    </div>
                ) : (
                    checkers.map(checker => (
                        <div key={checker.id} className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 hover:border-zinc-700 transition-all group shadow-lg">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-grow">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">{checker.name}</h3>
                                        <button
                                            onClick={async () => {
                                                const updated = await provider.saveCustomChecker({ ...checker, enabled: !checker.enabled });
                                                setCheckers(prev => prev.map(c => c.id === checker.id ? updated : c));
                                            }}
                                            className={twMerge(
                                                "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter border transition-colors",
                                                checker.enabled ? "bg-emerald-600/10 text-emerald-500 border-emerald-500/20" : "bg-red-600/10 text-red-500 border-red-500/20"
                                            )}
                                        >
                                            {checker.enabled ? 'Active' : 'Disabled'}
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed italic">{checker.description || 'No description provided.'}</p>
                                    <div className="mt-4 bg-black/40 rounded-xl p-3 border border-white/5 font-mono text-[9px] text-emerald-500/60 transition-all group-hover:text-emerald-500/90 overflow-hidden line-clamp-2">
                                        {checker.script}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => setEditChecker(checker)}
                                        className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white flex items-center justify-center transition-all"
                                    >
                                        <FiEdit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteChecker(checker.id)}
                                        className="w-8 h-8 rounded-lg bg-red-900/10 text-red-900 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all"
                                    >
                                        <FiTrash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
