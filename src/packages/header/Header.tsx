import React from "react";
import { Icon } from "../ui/Icon";
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

  const ControlButton = ({
    icon,
    onClick,
    active = false,
    id,
    label,
    variant = "default"
  }: {
    icon: string
    onClick: () => void
    active?: boolean
    id: string
    label: string
    variant?: "default" | "danger" | "success"
  }) => (
    <div className="relative flex items-center group">
      <button
        onClick={onClick}
        className={twMerge(
          "flex items-center justify-center w-8 h-8 rounded-lg relative",
          active
            ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
            : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5 border border-transparent",
          variant === "danger" && "hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20",
          variant === "success" && active && "bg-emerald-600/20 text-emerald-400 border-emerald-500/30"
        )}
      >
        <Icon iconName={icon as any} />
        {active && (
          <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-current" />
        )}
      </button>
    </div>
  )

  return (
    <div className="flex items-center justify-between px-4 h-12 bg-[#0a0a0a] border-b border-black select-none">

      {/* Left */}
      <div className="flex items-center gap-4 relative z-10">

        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white font-black italic text-xs">
            NS
          </div>
          <span className="text-xs font-black tracking-tighter text-zinc-100 uppercase italic opacity-80">
            NetworkSpy
          </span>
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

      {/* Middle */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center pointer-events-none z-0">
        <div
          className={twMerge(
            "flex items-center px-4 py-1.5 rounded-full border text-[10px] font-bold tracking-wider uppercase shadow-lg pointer-events-auto",
            isRun
              ? "border-emerald-500/20 bg-emerald-500/[0.03]"
              : "border-white/[0.05] bg-white/[0.02]"
          )}
        >
          <div
            className={twMerge(
              "w-2 h-2 rounded-full mr-3",
              isRun ? "bg-emerald-500" : "bg-zinc-700"
            )}
          />

          <span className={isRun ? "text-emerald-500/80" : "text-zinc-600"}>
            {isRun ? "Proxy Active: 127.0.0.1:9090" : "Sniffer Interrupted"}
          </span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">

        <div className="flex items-center gap-1 bg-white/[0.02] p-1 rounded-xl border border-white/5 shadow-inner relative z-10">

          <ControlButton
            id="left-pane"
            icon="SidebarLeft"
            label="Toggle Workspace"
            onClick={toggleLeftPane}
          />

          <ControlButton
            id="bottom-pane"
            icon="SidebarBottom"
            label="Toggle Inspector"
            onClick={toggleBottomPane}
          />

          <ControlButton
            id="right-pane"
            icon="SidebarRight"
            label="Toggle Knowledge"
            onClick={toggleRightPane}
          />

        </div>

        <div className="h-4 w-px bg-zinc-800/50" />

        <div className="flex items-center gap-3">

          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest leading-none">
              Pro Enabled
            </span>
            <span className="text-[8px] font-mono text-zinc-600 leading-none">
              v0.9.4-alpha
            </span>
          </div>

          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-700 border border-white/5 flex items-center justify-center text-[10px] font-bold text-zinc-400">
            M
          </div>

        </div>
      </div>
    </div>
  )
}