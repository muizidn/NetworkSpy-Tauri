import React from "react";
import { Renderer } from "../../ui/TableView";
import { TrafficItemMap } from "../model/TrafficItemMap";

export class TextRenderer implements Renderer<TrafficItemMap> {
  type: string;
  constructor(type: string) {
    this.type = type;
  }
  render({ input }: { input: TrafficItemMap }): React.ReactNode {
    return (
      <div className='select-none text-sm text-nowrap px-2 py-2 truncate'>
        {input[this.type] as string}
      </div>
    );
  }
}
