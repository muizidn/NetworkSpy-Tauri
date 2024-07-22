import React from "react";
import { Renderer } from "../../ui/TableView";
import { TrafficItemMap } from "../model/TrafficItemMap";

export class ImageRenderer implements Renderer<TrafficItemMap> {
  type: string;
  constructor(type: string) {
    this.type = type;
  }
  render({ input }: { input: TrafficItemMap }): React.ReactNode {
    return (
      <div className="select-none my-2">
        <img
          src={input[this.type] as string}
          alt="Image"
          style={{ maxWidth: "100%", height: "auto" }}
        />
      </div>
    );
  }
}
