import React from "react";
import { Renderer } from "../../ui/TableView";
import { TrafficItemMap } from "../model/TrafficItemMap";
import { 
  SiGooglechrome, 
  SiSafari, 
  SiFirefox, 
  SiMicrosoftedge, 
  SiBrave, 
  SiFigma, 
  SiSlack, 
  SiDiscord, 
  SiPostman, 
  SiInsomnia, 
  SiVisualstudiocode, 
  SiSpotify,
  SiApple,
  SiWindows,
  SiLinux,
  SiPython,
  SiNodedotjs,
  SiDocker,
  SiGit
} from "react-icons/si";
import { FiTerminal, FiGlobe, FiCode, FiBox, FiCpu } from "react-icons/fi";

const ICON_MAP: Record<string, { icon: any, color: string }> = {
  "chrome": { icon: SiGooglechrome, color: "text-blue-400" },
  "google chrome": { icon: SiGooglechrome, color: "text-blue-400" },
  "safari": { icon: SiSafari, color: "text-blue-500" },
  "firefox": { icon: SiFirefox, color: "text-orange-500" },
  "edge": { icon: SiMicrosoftedge, color: "text-blue-600" },
  "brave": { icon: SiBrave, color: "text-orange-600" },
  "figma": { icon: SiFigma, color: "text-purple-400" },
  "slack": { icon: SiSlack, color: "text-green-400" },
  "discord": { icon: SiDiscord, color: "text-indigo-400" },
  "postman": { icon: SiPostman, color: "text-orange-400" },
  "insomnia": { icon: SiInsomnia, color: "text-purple-500" },
  "visual studio code": { icon: SiVisualstudiocode, color: "text-blue-500" },
  "vscode": { icon: SiVisualstudiocode, color: "text-blue-500" },
  "cursor": { icon: SiVisualstudiocode, color: "text-cyan-400" },
  "spotify": { icon: SiSpotify, color: "text-green-500" },
  "terminal": { icon: FiTerminal, color: "text-zinc-400" },
  "iterm": { icon: FiTerminal, color: "text-zinc-400" },
  "zsh": { icon: FiTerminal, color: "text-zinc-400" },
  "bash": { icon: FiTerminal, color: "text-zinc-400" },
  "sh": { icon: FiTerminal, color: "text-zinc-400" },
  "node": { icon: SiNodedotjs, color: "text-green-600" },
  "python": { icon: SiPython, color: "text-yellow-500" },
  "docker": { icon: SiDocker, color: "text-blue-400" },
  "git": { icon: SiGit, color: "text-orange-600" },
  "curl": { icon: FiCode, color: "text-zinc-300" },
  "wget": { icon: FiCode, color: "text-zinc-300" },
  "network-spy": { icon: FiGlobe, color: "text-purple-400" },
  "system": { icon: FiCpu, color: "text-zinc-500" },
};

export class ClientRenderer implements Renderer<TrafficItemMap> {
  type: string;
  constructor(type: string) {
    this.type = type;
  }

  getIcon(clientStr: string) {
    const lower = clientStr.toLowerCase();
    
    for (const [key, value] of Object.entries(ICON_MAP)) {
      if (lower.includes(key)) {
        return value;
      }
    }

    if (lower.includes("helper") || lower.includes("service")) {
        return { icon: FiBox, color: "text-zinc-500" };
    }

    return { icon: FiGlobe, color: "text-zinc-400" };
  }

  render({ input }: { input: TrafficItemMap }): React.ReactNode {
    const clientStr = (input[this.type] as string) || "-";
    
    let name = clientStr;
    let osIcon: string | null = null;

    if (clientStr.startsWith('{')) {
        try {
            const info = JSON.parse(clientStr);
            name = info.name || "-";
            osIcon = info.icon;
        } catch (e) {
            console.error("Failed to parse client info", e);
        }
    } else {
        // Fallback for legacy data or non-JSON: strip (IP:Port) if present
        name = clientStr.split(" (")[0];
    }
    
    const { icon: Icon, color } = this.getIcon(name);

    return (
      <div className='select-none text-sm text-nowrap px-2 truncate h-full flex items-center gap-2 max-w-full' title={name}>
        <div className={`${color} flex-shrink-0 flex items-center justify-center w-4 h-4`}>
          {osIcon ? (
            <img src={osIcon} className="w-full h-full object-contain grayscale-[0.5] hover:grayscale-0 transition-all" alt="" />
          ) : (
            <Icon size={14} />
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="truncate leading-tight font-medium underline underline-offset-2 decoration-zinc-700/50">{name}</span>
        </div>
      </div>
    );
  }
}
