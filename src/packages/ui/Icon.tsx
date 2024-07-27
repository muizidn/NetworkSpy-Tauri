import {
  Play,
  Pause,
  SidebarLeft,
  SidebarRight,
  SidebarBottom,
  Trash,
  Menu,
  CloseSquare,
} from "iconsax-react";

const icons = [
  "Play",
  "Pause",
  "SidebarLeft",
  "SidebarRight",
  "SidebarBottom",
  "Trash",
  "Menu",
  "Close",
] as const;
type IconName = (typeof icons)[number];

export const Icon: React.FC<{ iconName: IconName }> = ({ iconName }) => {
  switch (iconName) {
    case "Play":
      return <Play size={20} />;
    case "Pause":
      return <Pause size={20} />;
    case "SidebarLeft":
      return <SidebarLeft size={20} />;
    case "SidebarRight":
      return <SidebarRight size={20} />;
    case "SidebarBottom":
      return <SidebarBottom size={20} />;
    case "Trash":
      return <Trash size={20} />;
    case "Menu":
      return <Menu size={20} />;
    case "Close":
      return <CloseSquare size={20} />;
    default:
      return null; // or some default icon/component
  }
};
