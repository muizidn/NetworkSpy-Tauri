import React, { useState } from "react";
import { Icon } from "../ui/Icon";
import { useAppProvider } from "@src/packages/app-env";
import { motion, AnimatePresence } from "framer-motion";
import { twMerge } from "tailwind-merge";

interface HeaderProps {
  isRun: boolean;
  setIsRun: (prev: boolean) => void;
  clearData: () => void;
  toggleLeftPane: () => void;
  toggleBottomPane: () => void;
  toggleRightPane: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isRun,
  setIsRun,
  clearData,
  toggleLeftPane,
  toggleBottomPane,
  toggleRightPane
}) => {
  const [isHovered, setIsHovered] = useState<string | null>(null);

  const ControlButton = ({
    icon,
    onClick,
    active = false,
    id,
    label,
    variant = "default"
  }: {
    icon: string,
    onClick: () => void,
    active?: boolean,
    id: string,
    label: string,
    variant?: "default" | "danger" | "success"
  }) => (
    <div className="relative flex items-center group">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onHoverStart={() => setIsHovered(id)}
        onHoverEnd={() => setIsHovered(null)}
        onClick={onClick}
        className={twMerge(
          "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 relative overflow-hidden",
          active
            ? "bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(37,99,235,0.2)]"
            : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5 border border-transparent",
          variant === "danger" && "hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20",
          variant === "success" && active && "bg-emerald-600/20 text-emerald-400 border-emerald-500/30"
        )}
      >
        <Icon iconName={icon as any} />
        {active && (
          <motion.div
            layoutId="active-indicator"
            className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-current"
          />
        )}
      </motion.button>

      <AnimatePresence>
        {isHovered === id && (
          <motion.div
            initial={{ opacity: 0, y: 10, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 5, x: "-50%" }}
            className="absolute top-full mt-2 left-1/2 z-50 px-2 py-1 bg-zinc-800 border border-white/10 rounded text-[10px] font-bold text-zinc-100 whitespace-nowrap pointer-events-none shadow-2xl"
          >
            {label}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-800 border-t border-l border-white/10 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="flex items-center justify-between px-4 h-12 bg-[#0a0a0a] border-b border-black select-none">
      {/* Left Selection: App Brand & Core Controls */}
      <div className="flex items-center gap-4 relative z-10">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white font-black italic text-xs shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
            NS
          </div>
          <span className="text-xs font-black tracking-tighter text-zinc-100 uppercase italic opacity-80 group-hover:opacity-100 transition-opacity">NetworkSpy</span>
        </div>

        <div className="h-4 w-px bg-zinc-800/50" />

        <div className="flex items-center gap-1.5">
          <ControlButton
            id="menu"
            icon="Menu"
            label="Application Menu"
            onClick={() => { }}
          />
          <div className="w-1" />
          <ControlButton
            id="play-pause"
            icon={isRun ? "Pause" : "Play"}
            label={isRun ? "Stop Capturing" : "Start Capturing"}
            active={isRun}
            variant={isRun ? "success" : "default"}
            onClick={() => setIsRun(!isRun)}
          />
          <ControlButton
            id="clear"
            icon="Trash"
            label="Clear Traffic"
            variant="danger"
            onClick={clearData}
          />
        </div>
      </div>

      {/* Middle: Active Capture Info */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center pointer-events-none z-0">
        <motion.div
          initial={false}
          animate={{
            borderColor: isRun ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.05)",
            backgroundColor: isRun ? "rgba(16, 185, 129, 0.03)" : "rgba(255, 255, 255, 0.02)"
          }}
          className="flex items-center px-4 py-1.5 rounded-full border text-[10px] font-bold tracking-wider uppercase transition-colors pointer-events-auto shadow-lg"
        >
          <div className={twMerge(
            "w-2 h-2 rounded-full mr-3 shadow-[0_0_8px_rgba(255,255,255,0.2)]",
            isRun ? "bg-emerald-500 animate-pulse shadow-emerald-500/50" : "bg-zinc-700"
          )} />
          <span className={isRun ? "text-emerald-500/80" : "text-zinc-600"}>
            {isRun ? "Proxy Active: 127.0.0.1:9090" : "Sniffer Interrupted"}
          </span>
        </motion.div>
      </div>

      {/* Right: Layout & Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 bg-white/[0.02] p-1 rounded-xl border border-white/5 shadow-inner relative z-10">
          <ControlButton
            id="left-pane"
            icon="SidebarLeft"
            label="Toggle Workspace"
            active={false}
            onClick={toggleLeftPane}
          />
          <ControlButton
            id="bottom-pane"
            icon="SidebarBottom"
            label="Toggle Inspector"
            active={false}
            onClick={toggleBottomPane}
          />
          <ControlButton
            id="right-pane"
            icon="SidebarRight"
            label="Toggle Knowledge"
            active={false}
            onClick={toggleRightPane}
          />
        </div>

        <div className="h-4 w-px bg-zinc-800/50" />

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest leading-none">Pro Enabled</span>
            <span className="text-[8px] font-mono text-zinc-600 leading-none">v0.9.4-alpha</span>
          </div>
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-700 border border-white/5 flex items-center justify-center text-[10px] font-bold text-zinc-400">
            M
          </div>
        </div>
      </div>
    </div>
  );
};
