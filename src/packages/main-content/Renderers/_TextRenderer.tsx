import React from "react";
import { Renderer } from "../../ui/TableView";
import { TrafficItemMap } from "../model/TrafficItemMap";

export class TextRenderer implements Renderer<TrafficItemMap> {
  type: string;
  constructor(type: string) {
    this.type = type;
  }
  render(input: TrafficItemMap) {
    return (
      <td className="select-none">
        {input[this.type] as string}
      </td>
    );
  }
}
