import { TableView } from "../../ui/TableView";
import { KeyValueRenderer } from "../KeyValueRenderer";

export const FormURLEncodedView = ({ params }: { params: { key: string; value: string | string[] }[] }) => {
    // Flatten params if any value is an array
    const flattenedParams = params.flatMap(param => 
      Array.isArray(param.value)
        ? param.value.map(val => ({ key: param.key, value: val }))
        : [{ key: param.key, value: param.value }]
    );
  
    return (
      <TableView
        headers={[
          {
            title: "Key",
            renderer: new KeyValueRenderer("key"),
          },
          {
            title: "Value",
            renderer: new KeyValueRenderer("value"),
          },
        ]}
        data={flattenedParams}
      />
    );
  };