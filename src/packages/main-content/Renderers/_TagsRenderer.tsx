import { Renderer } from "../../ui/TableView";
import { TrafficItemMap } from "../model/TrafficItemMap";

export class TagsRenderer implements Renderer<TrafficItemMap> {
  type: string;

  constructor(type: string) {
    this.type = type;
  }

  render(input: TrafficItemMap) {
    const tags = input[this.type] as string[];
    return (
      <td className='select-none flex items-center justify-center overflow-hidden'>
        {tags.map((tag, index) => (
          <span
            key={index}
            className='tag bg-red-500 rounded-full text-nowrap text-xs px-2 py-1'>
            {tag}
          </span>
        ))}
      </td>
    );
  }
}
