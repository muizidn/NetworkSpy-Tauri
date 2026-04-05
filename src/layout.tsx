import { Outlet, useLocation } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { LeftSidebar } from "./packages/sidebar/LeftSidebar";
import { ProStatusDialog } from "./packages/sidebar/ProStatusDialog";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { twMerge } from "tailwind-merge";
import { useAppUpdater } from "./hooks/useAppUpdater";

export default function Layout() {
  useAppUpdater();
  const [isProDialogOpen, setIsProDialogOpen] = useState(false);
  const [proDialogStatus, setProDialogStatus] = useState<'trial' | 'pro'>('pro');
  const [isMainWindow, setIsMainWindow] = useState(true);

  const openProDialog = (status: 'trial' | 'pro') => {
    setProDialogStatus(status);
    setIsProDialogOpen(true);
  };

  useEffect(() => {
    // Check if current window is the main dashboard
    const checkWindow = async () => {
      const label = getCurrentWindow().label;
      setIsMainWindow(label === "main");
    };
    checkWindow();
  }, []);

  return (
    <div className={twMerge(
        "flex flex-row w-screen h-screen overflow-hidden",
        isMainWindow ? "bg-[#0a0a0a]" : "bg-[#111111]"
    )}>
      {isMainWindow && <LeftSidebar onProClick={openProDialog} />}
      
      <div className="flex-grow h-screen overflow-hidden relative">
        <Outlet />
      </div>

      <ProStatusDialog 
        isOpen={isProDialogOpen} 
        onClose={() => setIsProDialogOpen(false)} 
        status={proDialogStatus}
      />
    </div>
  );
}
