import { Renderer } from "../../ui/TableView";
import { TrafficItemMap } from "../model/TrafficItemMap";
import { useTagContext } from "@src/context/TagContext";

const TagBadge = ({ tagName }: { tagName: string }) => {
    const { tags } = useTagContext();
    const tagModel = tags.find(t => t.tag === tagName);

    const style = {
        color: tagModel?.color || '#60a5fa',
        bgColor: tagModel?.bgColor || '#3b82f61a',
    };

    return (
        <span
            className='tag rounded-full text-nowrap text-[10px] px-2 py-0.5 my-1 mr-1.5 font-bold border border-current opacity-90 transition-opacity hover:opacity-100'
            style={{ 
                color: style.color, 
                backgroundColor: style.bgColor,
                borderColor: `${style.color}33`
            }}>
            {tagName}
        </span>
    );
};

export class TagsRenderer implements Renderer<TrafficItemMap> {
  type: string;

  constructor(type: string) {
    this.type = type;
  }

  render({
    input,
    width,
  }: {
    input: TrafficItemMap;
    width: number;
  }): React.ReactNode {
    const tags = (input[this.type] as string[]) || [];
    return (
      <div
        className='select-none flex items-center justify-start overflow-hidden'
        style={{ width, minWidth: 100 }}>
        {tags.map((tag, index) => (
          <TagBadge key={index} tagName={tag} />
        ))}
      </div>
    );
  }
}
