import React, { useState } from "react";
import { Icon } from "../ui/Icon";
import { twMerge } from "tailwind-merge";
import { useAppProvider } from "../app-env";
import { usePaneContext } from "@src/context/PaneProvider";
import { FiColumns } from "react-icons/fi";

interface HeaderProps {
  toggleBottomPane: () => void;
  toggleRightPane: () => void;
  bottomActive?: boolean;
  rightActive?: boolean;
}

export const ControlButton = ({
  icon,
  onClick,
  active = false,
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
        "flex items-center justify-center w-6 h-6 flex-shrink-0 relative transition-colors",
        active ? "text-blue-500" : "text-white hover:text-blue-400"
      )}
    >
      <Icon iconName={icon as any} />
    </button>
  </div>
)

export const Header: React.FC<HeaderProps> = ({
  toggleBottomPane,
  toggleRightPane
}) => {
  const { isRun, setIsRun, clearData, provider } = useAppProvider();

  return (
    <div
      data-tauri-drag-region
      className="flex items-center justify-between pl-20 pr-2 h-9 bg-[#0a0a0a] border-b border-black select-none"
    >
      <HeaderLeft />


      <HeaderRight
        toggleBottomPane={toggleBottomPane}
        toggleRightPane={toggleRightPane}
      />
    </div>
  )
}

export const HeaderLeft = () => {
  const { isRun, setIsRun, clearData, provider } = useAppProvider();
  return (
    <div className="flex items-center gap-4 relative z-10 h-full">
      <div className="flex items-center gap-2 cursor-pointer">
        <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-white font-black italic text-[9px]">
          NS
        </div>
        <span className="text-[10px] font-black tracking-tighter text-zinc-100 uppercase italic opacity-80">
          NetworkSpy
        </span>
      </div>

      <div className="h-4 w-px bg-zinc-800/50" />

      <div className="flex items-center gap-1.5 ">
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

        <div className="h-4 w-px bg-zinc-800/50 mx-1" />

        <ControlButton
          id="save"
          icon="Download"
          label="Save Session (HAR)"
          onClick={() => provider.saveSession()}
        />
        <ControlButton
          id="load"
          icon="FolderOpen"
          label="Load Session (HAR)"
          onClick={() => provider.loadSession()}
        />
      </div>
    </div>
  );
};

export const HeaderMiddle = ({ isRun }: { isRun: boolean }) => (
  <div className="absolute left-1/2 -translate-x-1/2 flex items-center pointer-events-none z-0">
    <div
      className={twMerge(
        "flex items-center px-3 py-1 rounded-full border text-[9px] font-bold tracking-wider uppercase shadow-lg pointer-events-auto",
        isRun
          ? "border-emerald-500/20 bg-emerald-500/[0.03]"
          : "border-white/[0.05] bg-white/[0.02]"
      )}
    >
      <div
        className={twMerge(
          "w-1.5 h-1.5 rounded-full mr-2",
          isRun ? "bg-emerald-500" : "bg-zinc-700"
        )}
      />
      <span className={isRun ? "text-emerald-500/80" : "text-zinc-600"}>
        {isRun ? "Proxy Active: 127.0.0.1:9090" : "Sniffer Interrupted"}
      </span>
    </div>
  </div>
);

export const HeaderRight = ({
  toggleBottomPane,
  toggleRightPane
}: {
  toggleBottomPane: () => void,
  toggleRightPane: () => void
}) => {
  const { isDisplayPane, setIsDisplayPane } = usePaneContext();

  const setLayout = (layout: "horizontal" | "vertical") => {
    setIsDisplayPane(prev => ({ ...prev, centerLayout: layout }));
  };

  return (
    <div className="flex items-center gap-4 h-full">
      <div className="flex items-center gap-1 bg-white/[0.02] p-1 rounded-xl border border-white/5 shadow-inner relative z-10">
        <ControlButton
          id="layout-vertical"
          icon="Rows"
          label="Top down (Horizontal Split)"
          active={isDisplayPane.centerLayout === "vertical"}
          onClick={() => setLayout("vertical")}
        />
        <ControlButton
          id="layout-horizontal"
          icon="Columns"
          label="Side by side (Vertical Split)"
          active={isDisplayPane.centerLayout === "horizontal"}
          onClick={() => setLayout("horizontal")}
        />

        <div className="w-1" />

        <ControlButton
          id="bottom-pane"
          icon="SidebarBottom"
          label="Toggle Inspector"
          active={isDisplayPane.bottom}
          onClick={toggleBottomPane}
        />
        <ControlButton
          id="right-pane"
          icon="SidebarRight"
          label="Toggle Knowledge"
          active={isDisplayPane.right}
          onClick={toggleRightPane}
        />
      </div>

      <div className="h-4 w-px bg-zinc-800/50" />

      <div className="flex items-center gap-3 h-full">
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest leading-none">
            Pro
          </span>
          <span className="text-[7px] font-mono text-zinc-600 leading-none mt-0.5">
            v0.9.4
          </span>
        </div>
        <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-700 border border-white/5 flex items-center justify-center text-[9px] font-bold text-zinc-400">
          M
        </div>
      </div>
    </div>
  );
};
