import { Meta, StoryFn, StoryObj } from "@storybook/react";
import { RequestTab } from "@src/packages/bottom-pane/RequestTab";
import {
  TrafficListContext,
  TrafficListContextState,
} from "@src/packages/main-content/context/TrafficList";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

const createMockFunction = () => {
  const fn: any = (...args: any[]) => fn.mock.calls.push(args);
  fn.mock = { calls: [] };
  return fn;
};

const mockContextValue: TrafficListContextState = {
  selections: {
    firstSelected: { id: "1234" },
    others: null,
  },
  trafficList: [],
  trafficListDisplay: [],
  setTrafficList: createMockFunction(),
  trafficSet: {},
  setFilterByUrl: createMockFunction(),
  filterByUrl: "",
  setSelections: createMockFunction(),
  setTrafficSet: createMockFunction(),
};

const meta: Meta<typeof RequestTab> = {
  title: "App/Components/RequestTab",
  component: RequestTab,
  args: {
    loadData: async (traffic) => {
      return {
        headers: [{ key: "Content-Type", value: "application/json" }],
        params: [{ key: "id", value: "1234" }],
        body: '{"name":"John Doe","age":30}',
        content_type: "application/json",
      };
    },
  },
  decorators: [
    (Story) => (
      <DndProvider backend={HTML5Backend}>
        <TrafficListContext.Provider value={mockContextValue}>
          <Story />
        </TrafficListContext.Provider>
      </DndProvider>
    ),
  ],
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
