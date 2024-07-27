import React from "react";
import { Icon } from "../ui/Icon";

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
  toggleRightPane,
}) => (
  <div className="flex justify-between p-4 bg-[#23262a] text-white">
    <div className="flex space-x-2 items-center">
      <button className="flex items-center">
        <Icon iconName="Menu" />
      </button>
      <div className="w-4" />
      <button onClick={() => setIsRun(!isRun)} className="flex items-center">
        {isRun ? <Icon iconName="Pause" /> : <Icon iconName="Play" />}
      </button>
      <button onClick={clearData} className="flex items-center">
        <Icon iconName="Trash" />
      </button>
      <div className="w-4" />
      <button onClick={toggleLeftPane} className="flex items-center">
        <Icon iconName="SidebarLeft" />
      </button>
      <button onClick={toggleBottomPane} className="flex items-center">
        <Icon iconName="SidebarBottom" />
      </button>
      <button onClick={toggleRightPane} className="flex items-center">
        <Icon iconName="SidebarRight" />
      </button>
    </div>
    <div className="flex justify-center items-center rounded-lg bg-[#32353a] py-1 px-6">
      <div>NetworkSpy | Listening on 192.168.1.4:9090</div>
    </div>
    <div className="flex space-x-2">
      <div>8 New Updates | Free Version</div>
    </div>
  </div>
);
