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
      <div className="select-text flex items-center h-full break-all whitespace-pre-wrap leading-relaxed py-0.5 min-w-0">
        {this.type === 'key' ? input.key : input.value}
      </div>
    );
  }
}
