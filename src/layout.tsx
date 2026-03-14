import { Outlet, useLocation } from "react-router-dom";
import React, { useState } from "react";
import { LeftSidebar } from "./packages/sidebar/LeftSidebar";
import { ProStatusDialog } from "./packages/sidebar/ProStatusDialog";

export default function Layout() {
  const [isProDialogOpen, setIsProDialogOpen] = useState(false);
  const [proDialogStatus, setProDialogStatus] = useState<'trial' | 'pro'>('pro');

  const openProDialog = (status: 'trial' | 'pro') => {
    setProDialogStatus(status);
    setIsProDialogOpen(true);
  };

  return (
    <div className="flex flex-row w-screen h-screen overflow-hidden bg-[#0a0a0a]">
      <LeftSidebar onProClick={openProDialog} />
      
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
