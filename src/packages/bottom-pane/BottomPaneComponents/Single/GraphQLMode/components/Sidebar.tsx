import { twMerge } from "tailwind-merge";
import { FiCheckCircle, FiCpu, FiBox, FiInfo } from "react-icons/fi";
import { ParsedGraphQLItem } from "../types";

interface SidebarProps {
  showSidebar: boolean;
  activeData: ParsedGraphQLItem;
  responseBody: string | null;
  hasErrors: boolean;
}

export const Sidebar = ({ showSidebar, activeData, responseBody, hasErrors }: SidebarProps) => {
  return (
    <div className={twMerge(
      "absolute inset-y-0 right-0 z-20 w-64 bg-[#111] border-l border-zinc-800 flex flex-col transition-all duration-500 ease-in-out shadow-2xl",
      "@5xl:relative @5xl:translate-x-0 @5xl:shadow-none",
      showSidebar ? "translate-x-0" : "translate-x-full @5xl:hidden @5xl:w-0"
    )}>
      <div className="p-4 border-b border-zinc-800 bg-black/20 shrink-0">
        <span className="text-[10px] font-black tracking-[0.2em] text-zinc-600 block mb-4">Inspection</span>

        <div className="space-y-4">
          <SidebarItem
            icon={<FiCheckCircle size={14} />}
            label="Status"
            value={hasErrors ? "Failed" : "Success"}
            color={hasErrors ? "text-rose-500" : "text-emerald-500"}
          />
          <SidebarItem icon={<FiCpu size={14} />} label="Mechanism" value={activeData.mechanism} color="text-pink-400" />
          <SidebarItem icon={<FiBox size={14} />} label="Nested Depth" value={`${activeData.depth} Levels`} />
          <SidebarItem icon={<FiInfo size={14} />} label="Type" value={activeData.type || "UNKNOWN"} />
        </div>
      </div>

      <div className="p-5 flex-grow overflow-y-auto no-scrollbar pb-20">
        <span className="text-[10px] font-black tracking-[0.2em] text-zinc-600 block mb-4">Complexity</span>
        <div className="space-y-4">
          <ProgressField label="Fragments" percentage={Math.min(100, activeData.fragmentsCount * 25)} color="bg-pink-500" />
          <ProgressField label="Variables" percentage={activeData.variables !== "{}" ? 100 : 0} color="bg-blue-500" />
          <ProgressField label="Directives" percentage={Math.min(100, activeData.directivesCount * 50)} color="bg-zinc-600" />
        </div>

        <div className="mt-8 p-3 rounded bg-zinc-900/50 border border-zinc-800/50">
          <div className="text-[9px] font-bold text-zinc-500 mb-2">Structure Details</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-[10px] text-zinc-400">Fragments: <span className="text-white">{activeData.fragmentsCount}</span></div>
            <div className="text-[10px] text-zinc-400">Directives: <span className="text-white">{activeData.directivesCount}</span></div>
          </div>
        </div>
      </div>

      <div className="mt-auto p-4 border-t border-zinc-800 bg-black/40 shrink-0">
        <div className="text-[9px] text-zinc-600 font-bold tracking-widest leading-relaxed">
          Capture v2.0 <br />
          <span className="text-zinc-700">GraphQL Engine</span>
        </div>
      </div>
    </div>
  );
};

const SidebarItem = ({ icon, label, value, color }: { icon: any, label: string, value: string, color?: string }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2 text-zinc-400">
      {icon}
      <span className="text-[10px] font-bold tracking-tight">{label}</span>
    </div>
    <span className={twMerge("text-[10px] font-mono font-bold", color || "text-zinc-200")}>{value}</span>
  </div>
);

const ProgressField = ({ label, percentage, color }: { label: string, percentage: number, color: string }) => (
  <div className="space-y-2">
    <div className="flex justify-between text-[9px] font-bold tracking-tighter">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-300">{percentage}%</span>
    </div>
    <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
      <div className={twMerge("h-full rounded-full transition-all duration-1000", color)} style={{ width: `${percentage}%` }} />
    </div>
  </div>
);
