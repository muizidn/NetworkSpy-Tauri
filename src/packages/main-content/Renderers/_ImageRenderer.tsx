import React from "react";
import { Renderer } from "../../ui/TableView";
import { TrafficItemMap } from "../model/TrafficItemMap";

export class ImageRenderer implements Renderer<TrafficItemMap> {
  type: string;
  constructor(type: string) {
    this.type = type;
  }
  render(input: TrafficItemMap) {
    return (
      <td className="select-none">
        <img
          src={input[this.type] as string}
          alt="Image"
          style={{ maxWidth: "100%", height: "auto" }}
        />
      </td>
    );
  }
}
