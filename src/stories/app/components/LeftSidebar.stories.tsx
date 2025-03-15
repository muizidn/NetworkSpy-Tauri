import { Meta, StoryFn, StoryObj } from "@storybook/react";
import {
  TrafficListContext,
  TrafficListContextState,
} from "@src/packages/main-content/context/TrafficList";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { LeftSidebar } from "@src/packages/sidebar/LeftSidebar";

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

const meta: Meta<typeof LeftSidebar> = {
  title: "App/Components/LeftSidebar",
  component: LeftSidebar,
  args: {
  },
  decorators: [
    (Story) => (
      <DndProvider backend={HTML5Backend}>
        <TrafficListContext.Provider value={mockContextValue}>
          <div
            style={{
              padding: "16px",
              border: "1px solid #ddd",
              borderRadius: "8px",
            }}
          >
            <Story />
          </div>
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
