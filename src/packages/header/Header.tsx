import { usePaneContext } from "@src/context/PaneProvider";
import React from "react";
import { twMerge } from "tailwind-merge";
import { useAppProvider } from "../app-env";
import { useSessionContext } from "@src/context/SessionContext";
import { Icon } from "../ui/Icon";
import { PortDialog } from "./components/PortDialog";

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
  icon: string | React.ReactNode
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
      {typeof icon === 'string' ? <Icon iconName={icon as any} /> : icon}
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
  const { isRun, setIsRun, clearData, provider, currentPort } = useAppProvider();
  const { isReviewMode, reviewedSession, viewSession, saveCapture } = useSessionContext();
  const [isPortDialogOpen, setIsPortDialogOpen] = React.useState(false);

  const handleUpdatePort = async (newPort: number) => {
    try {
      const actualPort = await provider.changeProxyPort(newPort);
      if (actualPort !== newPort) {
        await provider.message(`Port ${newPort} was unavailable. Used ${actualPort} instead.`, { title: "Port Auto-Adjusted", type: "info" });
      }
    } catch (err) {
      console.error("Failed to update port", err);
    }
  };

  return (
    <>
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

        <div className="w-1" />

        {!isReviewMode && (
          <ControlButton
            id="play-pause"
            icon={isRun ? "Pause" : "Play"}
            label={isRun ? "Stop Capturing" : "Start Capturing"}
            active={isRun}
            variant={isRun ? "success" : "default"}
            onClick={() => setIsRun(!isRun)}
          />
        )}

        {isReviewMode && (
          <div className="flex items-center gap-2 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-500">
             <span className="text-[10px] font-bold uppercase tracking-wider">Reviewing: {reviewedSession?.name}</span>
             <button 
               onClick={() => viewSession(null)}
               className="text-[10px] bg-amber-500/20 hover:bg-amber-500/40 px-1 rounded transition-colors"
             >
               Exit
             </button>
          </div>
        )}

        {isRun && currentPort && !isReviewMode && (
          <div 
            onClick={() => setIsPortDialogOpen(true)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 animate-in fade-in slide-in-from-left-1 duration-300 cursor-pointer hover:bg-blue-500/20 hover:border-blue-500/40 transition-all group"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 group-hover:scale-110 transition-transform">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            <span className="text-[10px] font-mono font-bold text-blue-400">
              :{currentPort}
            </span>
          </div>
        )}

        <ControlButton
          id="clear"
          icon="Trash"
          label="Clear Traffic"
          variant="danger"
          onClick={clearData}
        />

        <div className="h-4 w-px bg-zinc-800/50 mx-1" />

        <ControlButton
          id="save-session"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>}
          label="Save to Session List"
          onClick={async () => {
            const defaultName = new Date().toLocaleString();
            const name = prompt("Enter session name:", defaultName);
            if (name) {
              try {
                await saveCapture(name);
                alert("Session saved successfully!");
              } catch (e) {
                alert("Failed to save session: " + e);
              }
            }
          }}
        />
      </div>
      </div>
      <PortDialog 
        isOpen={isPortDialogOpen} 
        currentPort={currentPort || 9090} 
        onClose={() => setIsPortDialogOpen(false)} 
        onConfirm={handleUpdatePort} 
      />
    </>
  );
};



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
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" opacity="0.4"></rect>
              <line x1="3" y1="12" x2="21" y2="12"></line>
            </svg>
          }
          label="Top down (Horizontal Split)"
          active={isDisplayPane.centerLayout === "vertical"}
          onClick={() => setLayout("vertical")}
        />
        <ControlButton
          id="layout-horizontal"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" opacity="0.4"></rect>
              <line x1="12" y1="3" x2="12" y2="21"></line>
            </svg>
          }
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
    </div>
  );
};
