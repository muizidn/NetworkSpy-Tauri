import { usePaneContext } from "@src/context/PaneProvider";
import { listen } from "@tauri-apps/api/event";
import React from "react";
import { twMerge } from "tailwind-merge";
import { useAppProvider } from "../app-env";
import { useSessionContext } from "@src/context/SessionContext";
import { Icon } from "../ui/Icon";
import { PortDialog } from "./components/PortDialog";
import { SaveSessionDialog } from "./components/SaveSessionDialog";
import { FiPause } from "react-icons/fi";
import { useLicense } from "@src/hooks/useLicense";
import { useUpgradeDialog } from "@src/context/UpgradeContext";

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
  const { isReviewMode, reviewedSession, viewSession, saveCapture, folders } = useSessionContext();
  const { pausedBreakpoints, openNewWindow } = useAppProvider();
  const [isPortDialogOpen, setIsPortDialogOpen] = React.useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = React.useState(false);
  const { openUpgradeDialog } = useUpgradeDialog();
  const [plan, setPlan] = React.useState<string | null>(null);
  const { getPlan } = useLicense();

  React.useEffect(() => {
    getPlan().then(setPlan);
  }, []);

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

  React.useEffect(() => {
    const unlisten = listen("menu-save-capture", () => {
      setIsSaveDialogOpen(true);
    });
    return () => {
      unlisten.then(fn => fn());
    };
  }, []);

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
          {plan === 'free' && (
            <div 
              onClick={openUpgradeDialog}
              className="flex items-center px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 shadow-inner group relative cursor-pointer hover:bg-zinc-800 hover:border-zinc-700 transition-all active:scale-95"
            >
              <span className="text-[9px] font-black tracking-widest text-zinc-400 uppercase group-hover:text-zinc-200">Free Plan</span>
              <div className="absolute top-full left-0 mt-2 w-48 p-2 bg-[#0d0d0d] border border-zinc-800 rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[999] pointer-events-none">
                <p className="text-[9px] text-zinc-400 font-bold leading-relaxed tracking-tight">You are currently using the Free plan. Some features have limits. <span className="text-indigo-400">Click to see premium benefits.</span></p>
              </div>
            </div>
          )}

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
            onClick={() => setIsSaveDialogOpen(true)}
          />

          {pausedBreakpoints.length > 0 && (
            <>
              <div className="h-4 w-px bg-zinc-800/50 mx-1" />
              <div
                onClick={() => openNewWindow("breakpoint-hit", "Paused Traffic Review")}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500/20 hover:border-amber-500/50 transition-all cursor-pointer group shadow-[0_0_15px_-5px_rgba(245,158,11,0.2)] animate-in slide-in-from-top-2 duration-300"
              >
                <div className="relative">
                  <FiPause size={14} className="group-hover:scale-110 transition-transform" />
                  <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse shadow-[0_0_8px_#fbbf24]" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest bg-amber-500 text-black px-1.5 py-0.5 rounded-lg shadow-sm">
                  {pausedBreakpoints.length}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider hidden lg:block opacity-80 group-hover:opacity-100 transition-opacity">Paused Items</span>
              </div>
            </>
          )}
        </div>
      </div>
      <PortDialog
        isOpen={isPortDialogOpen}
        currentPort={currentPort || 9090}
        onClose={() => setIsPortDialogOpen(false)}
        onConfirm={handleUpdatePort}
      />
      <SaveSessionDialog
        isOpen={isSaveDialogOpen}
        folders={folders}
        onClose={() => setIsSaveDialogOpen(false)}
        onConfirm={async (name, folderId) => {
          try {
            await saveCapture(name, folderId);
          } catch (e) {
            alert("Failed to save session: " + e);
          }
        }}
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
