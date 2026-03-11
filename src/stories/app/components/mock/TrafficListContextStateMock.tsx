import { TrafficListContextState } from "@src/packages/main-content/context/TrafficList";

import traffic_list_json from "./traffic_list.json";
import { createMockFunction } from "./mockFunction";

export const trafficListContextStateMock: TrafficListContextState = {
  selections: {
    firstSelected: { id: "1234" },
    others: null,
  },
  trafficList: traffic_list_json,
  setTrafficList: createMockFunction(),
  trafficSet: {},
  setSelections: createMockFunction(),
  setTrafficSet: createMockFunction(),
};
