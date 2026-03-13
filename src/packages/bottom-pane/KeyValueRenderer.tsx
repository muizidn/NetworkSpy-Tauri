import { Renderer } from "../ui/TableView";

type KeyOrValue = "key" | "value";
type KeyValuePair = { key: string, value: string }

export class KeyValueRenderer implements Renderer<KeyValuePair> {
  type: KeyOrValue;
  constructor(type: KeyOrValue) {
    this.type = type;
  }
  render({ input }: { input: KeyValuePair }): React.ReactNode {
    return (
      <div className="select-none flex items-center h-full text-wrap">
        {this.type === 'key' && input.key}
        {this.type === 'value' && input.value}
      </div>
    );
  }
}
