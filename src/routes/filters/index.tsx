import React, { useState, useEffect } from "react";
import { twMerge } from "tailwind-merge";
import { PredefinedFilter } from "@src/models/Filter";
import { useFilterPresetContext } from "@src/context/FilterPresetContext";
import FilterList from "./FilterList";
import FilterDetails from "./FilterDetails";
import { FiFilter, FiActivity } from "react-icons/fi";

const FiltersPage: React.FC = () => {
    const { predefinedFilters } = useFilterPresetContext();
    const [selectedFilter, setSelectedFilter] = useState<PredefinedFilter | null>(null);
    const [isCompact, setIsCompact] = useState(false);

    // Sync selected filter with the latest data from context (e.g. after edit or delete)
    useEffect(() => {
        if (selectedFilter) {
            const found = predefinedFilters.find(f => f.id === selectedFilter.id);
            if (!found) {
                setSelectedFilter(null);
            } else if (JSON.stringify(found) !== JSON.stringify(selectedFilter)) {
                setSelectedFilter(found);
            }
        }
    }, [predefinedFilters, selectedFilter]);

    return (
        <div className="flex h-full bg-[#050505] overflow-hidden">
            {/* Sidebar with Filter List */}
            <div className={twMerge(
                "border-r border-zinc-900 flex flex-col h-full bg-[#080808] transition-all duration-300",
                isCompact ? "w-16" : "w-80"
            )}>
                <FilterList 
                    selectedFilterId={selectedFilter?.id} 
                    onSelectFilter={setSelectedFilter} 
                    isCompact={isCompact}
                />
            </div>
            
            {/* Main Content Detail Area */}
            <div className="flex-1 h-full overflow-hidden relative">
                {selectedFilter ? (
                    <FilterDetails filter={selectedFilter} />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-6 animate-in fade-in duration-500">
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                            <div className="relative w-24 h-24 rounded-3xl bg-zinc-900/80 flex items-center justify-center border border-zinc-700/30 text-zinc-400 rotate-12 transition-transform hover:rotate-0 hover:scale-110 cursor-help group shadow-2xl">
                                <FiFilter className="text-4xl group-hover:text-blue-500 transition-colors" />
                            </div>
                        </div>
                        <div className="text-center space-y-2 z-10 px-4">
                            <h3 className="text-xl font-black text-zinc-300 tracking-tight uppercase">Saved Filter Repository</h3>
                            <p className="text-xs text-zinc-600 max-w-sm leading-relaxed mx-auto font-medium">
                                Manage your technical criteria sets here. Click any saved filter from the sidebar to view detailed composition, logic branches, and documentation.
                            </p>
                        </div>
                        
                        <div className="flex gap-4 pt-4">
                             <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-800/50 bg-zinc-900/20">
                                 <FiActivity className="text-blue-500" size={12} />
                                 <span className="text-[10px] uppercase font-black text-zinc-700">Persisted in local registry</span>
                             </div>
                        </div>
                    </div>
                )}
                
                {/* Visual Accent */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
            </div>
        </div>
    );
};

export default FiltersPage;
