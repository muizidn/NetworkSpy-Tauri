import React from "react";
import { Renderer } from "../../ui/TableView";
import { TrafficItemMap } from "../model/TrafficItemMap";

export class UrlRenderer implements Renderer<TrafficItemMap> {
  render({ input }: { input: TrafficItemMap }): React.ReactNode {
    const url = (input.url as string) || "";
    
    // Check if it starts with insecure protocol
    const isInsecure = url.startsWith('http://') || url.startsWith('ws://');
    const protocolMatch = url.match(/^(https?:\/\/|wss?:\/\/)/);
    
    if (protocolMatch) {
      const protocol = protocolMatch[0];
      const rest = url.substring(protocol.length);
      
      return (
        <div className='select-none text-[12px] text-nowrap px-2 truncate h-full flex items-center font-mono'>
          <span className={isInsecure ? "text-red-500 font-bold" : "text-zinc-500"}>
            {protocol}
          </span>
          <span className="text-zinc-300">
            {rest}
          </span>
        </div>
      );
    }

    // Default or CONNECT style (no protocol prefix)
    return (
      <div className='select-none text-[12px] text-nowrap px-2 truncate h-full flex items-center font-mono text-zinc-300'>
        {url}
      </div>
    );
  }
}
