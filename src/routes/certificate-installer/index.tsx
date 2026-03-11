import { useState, ReactNode, useMemo } from "react";
import { FiSearch } from "react-icons/fi";
import { twMerge } from "tailwind-merge";

export interface Tab {
  id: string;
  title: string;
  content: ReactNode;
  icon?: ReactNode;
}

interface TabPanelProps {
  tag: string;
  current: string;
  children: ReactNode;
}

const TabPanel: React.FC<TabPanelProps> = ({ tag, current, children }) => {
  return (
    <div
      className='absolute w-full h-full overflow-auto'
      hidden={current !== tag}>
      {children}
    </div>
  );
};

interface CertificateHelpProps {
  title?: string;
  tabs: Tab[];
  initialTab?: string;
}

export const CertificateHelp: React.FC<CertificateHelpProps> = ({
  title,
  tabs,
  initialTab,
}) => {
  const [currentTab, setCurrentTab] = useState(initialTab || tabs[0].id);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTabs = useMemo(() => {
    return tabs.filter(tab => 
      tab.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tabs, searchTerm]);

  return (
    <div className='flex h-full bg-[#0a0a0a] text-white w-full relative overflow-hidden'>
      {/* Sidebar */}
      <div className='w-64 flex flex-col border-r border-zinc-800 bg-[#111111] z-10 p-4 shrink-0 shadow-2xl'>
        <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900/50 rounded-lg border border-zinc-800 focus-within:border-blue-500 transition-all mb-6 group">
          <FiSearch className="text-zinc-500 group-focus-within:text-blue-500" size={14} />
          <input
            type='text'
            className='bg-transparent border-none outline-none text-[11px] text-zinc-300 w-full placeholder:text-zinc-600'
            placeholder='Search installer...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {title && (
            <div className="px-2 mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">{title}</span>
            </div>
        )}

        <div className="flex flex-col gap-1 overflow-y-auto no-scrollbar">
            {filteredTabs.map((tab) => {
                const isActive = currentTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        className={twMerge(
                            "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 text-left relative",
                            isActive 
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
                                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                        )}
                        onClick={() => setCurrentTab(tab.id)}
                    >
                        {tab.icon && <span className={twMerge("transition-colors", isActive ? "text-white" : "text-zinc-500 group-hover:text-zinc-300")}>{tab.icon}</span>}
                        <span className="truncate">{tab.title}</span>
                        {isActive && (
                            <div className="absolute left-0 w-1 h-4 bg-white rounded-r-full shadow-[0_0_8px_white]" />
                        )}
                    </button>
                );
            })}

            {filteredTabs.length === 0 && (
                <div className="px-2 py-8 text-center">
                    <div className="text-zinc-700 font-bold mb-1 italic text-xs">No Results</div>
                    <div className="text-[10px] text-zinc-600">Try checking your spelling</div>
                </div>
            )}
        </div>

        <div className="mt-auto pt-6 border-t border-zinc-800/50">
            <div className="bg-zinc-900/40 rounded-xl p-4 border border-zinc-800/50">
                <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-2">Need more help?</div>
                <div className="text-[10px] text-zinc-400 leading-relaxed italic">
                    Contact our engineering team for specialized enterprise deployments.
                </div>
            </div>
        </div>
      </div>

      {/* Content Area */}
      <div className='relative flex-grow h-full bg-[#050505]'>
        {tabs.map((tab) => (
          <TabPanel key={tab.id} current={currentTab} tag={tab.id}>
            {tab.content}
          </TabPanel>
        ))}
      </div>
    </div>
  );
};
