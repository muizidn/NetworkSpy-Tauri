import React, { useState } from "react";
import { FiActivity, FiBox, FiSettings } from "react-icons/fi";
import { twMerge } from "tailwind-merge";

export const LeftSidebar = () => {
  const [activeTab, setActiveTab] = useState("traffic");

  return (
    <div className="w-[40px] shrink-0 bg-[#161616] border-r border-[#000000] flex flex-col items-center py-2 h-full z-10">
      <div className="flex-1 flex flex-col items-center gap-3 w-full px-1.5">
        <NavButton
          icon={<FiActivity size={18} />}
          label="Traffic Interceptor"
          isActive={activeTab === "traffic"}
          onClick={() => setActiveTab("traffic")}
        />
        <NavButton
          icon={<FiBox size={18} />}
          label="Collections / Workspaces"
          isActive={activeTab === "collection"}
          onClick={() => setActiveTab("collection")}
        />
      </div>
      <div className="flex flex-col items-center gap-4 w-full mb-2 px-1.5">
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[7px] font-black text-blue-500 uppercase tracking-widest leading-none">
            Pro
          </span>
          <span className="text-[6px] font-mono text-zinc-600 leading-none mt-0.5">
            v0.9.4
          </span>
        </div>

        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-700 border border-white/5 flex items-center justify-center text-[10px] font-bold text-zinc-400 cursor-pointer hover:border-blue-500/50 transition-colors">
          M
        </div>

        <NavButton
          icon={<FiSettings size={18} />}
          label="Settings"
          isActive={activeTab === "settings"}
          onClick={() => setActiveTab("settings")}
        />
      </div>
    </div>
  );
};

const NavButton = ({
  icon,
  label,
  isActive,
  onClick
}: {
  icon: React.ReactNode,
  label: string,
  isActive: boolean,
  onClick: () => void
}) => {
  return (
    <button
      onClick={onClick}
      className={twMerge(
        "relative p-1.5 w-8 h-8 rounded-lg transition-all duration-200 flex items-center justify-center group",
        isActive
          ? "bg-blue-600 shadow-lg shadow-blue-500/20 text-white"
          : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/80"
      )}
      title={label}
    >
      {icon}
      {!isActive && (
        <div className="absolute left-[-8px] top-1/2 -translate-y-1/2 w-1 h-0 bg-blue-500 rounded-r-md transition-all duration-200 group-hover:h-1/2 opacity-0 group-hover:opacity-100" />
      )}
    </button>
  );
};
