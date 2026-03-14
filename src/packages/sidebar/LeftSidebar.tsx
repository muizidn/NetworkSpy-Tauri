import React from "react";
import { FiActivity, FiBox, FiSettings, FiGrid } from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import { Tooltip } from "../ui/Tooltip";

interface LeftSidebarProps {
  onProClick: (status: 'trial' | 'pro') => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ onProClick }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = location.pathname === "/" ? "traffic" : 
                    location.pathname === "/workspace" ? "workspace" : 
                    location.pathname === "/extensions" ? "extensions" : 
                    location.pathname === "/settings" ? "settings" : 
                    location.pathname === "/account" ? "account" : "";

  return (
    <div className="w-[40px] shrink-0 bg-[#161616] border-r border-[#000000] flex flex-col items-center py-4 h-full z-[100]">
      <div className="flex-1 flex flex-col items-center gap-3 w-full px-1.5">
        <Tooltip text="Traffic Interceptor">
          <NavButton
            icon={<FiActivity size={18} />}
            isActive={activeTab === "traffic"}
            onClick={() => navigate("/")}
          />
        </Tooltip>
        
        <Tooltip text="Workspaces (Incoming)">
          <NavButton
            icon={<FiBox size={18} />}
            isActive={activeTab === "workspace"}
            onClick={() => navigate("/workspace")}
          />
        </Tooltip>

        <Tooltip text="Extensions Market">
          <NavButton
            icon={<FiGrid size={18} />}
            isActive={activeTab === "extensions"}
            onClick={() => navigate("/extensions")}
          />
        </Tooltip>
      </div>

      <div className="flex flex-col items-center gap-4 w-full mb-2 px-1.5">
        <Tooltip text="PRO">
          <div 
            onClick={() => onProClick('pro')}
            className="flex flex-col items-center gap-0.5 cursor-pointer group"
          >
            <span className="text-[7px] font-black text-blue-500 uppercase tracking-widest leading-none group-hover:text-blue-400 transition-colors">
              Pro
            </span>
            <span className="text-[6px] font-mono text-zinc-600 leading-none mt-0.5">
              v0.9.4
            </span>
          </div>
        </Tooltip>

        <Tooltip text="Account Settings">
          <div 
            onClick={() => navigate("/account")}
            className={twMerge(
                "w-7 h-7 rounded-full bg-gradient-to-tr border flex items-center justify-center text-[10px] font-bold transition-all cursor-pointer",
                activeTab === "account" 
                    ? "from-blue-600 to-indigo-600 border-blue-400 text-white shadow-lg shadow-blue-500/20" 
                    : "from-zinc-800 to-zinc-700 border-white/5 text-zinc-400 hover:border-blue-500/50 hover:text-zinc-200"
            )}
          >
            M
          </div>
        </Tooltip>

        <Tooltip text="Settings">
          <NavButton
            icon={<FiSettings size={18} />}
            isActive={activeTab === "settings"}
            onClick={() => navigate("/settings")}
          />
        </Tooltip>
      </div>
    </div>
  );
};

const NavButton = ({
  icon,
  isActive,
  onClick
}: {
  icon: React.ReactNode,
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
    >
      {icon}
      {!isActive && (
        <div className="absolute left-[-8px] top-1/2 -translate-y-1/2 w-1 h-0 bg-blue-500 rounded-r-md transition-all duration-200 group-hover:h-1/2 opacity-0 group-hover:opacity-100" />
      )}
    </button>
  );
};
