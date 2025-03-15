import { Meta, StoryFn, StoryObj } from "@storybook/react";
import { RequestTab } from "@src/packages/bottom-pane/RequestTab";
import { TrafficListContext } from "@src/packages/main-content/context/TrafficList";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { trafficListContextStateMock } from "./mock/TrafficListContextStateMock";
import request_pair_data_json from "./mock/request_pair_data.json";

const meta: Meta<typeof RequestTab> = {
  title: "App/Components/RequestTab",
  component: RequestTab,
  args: {
    loadData: async (traffic) => {
      return request_pair_data_json;
    },
  },
  decorators: [
    (Story) => (
      <DndProvider backend={HTML5Backend}>
        <TrafficListContext.Provider value={trafficListContextStateMock}>
          <div
            style={{
              height: `600px`,
              width: `1000px`,
            }}
          >
            <Story />
          </div>
        </TrafficListContext.Provider>
      </DndProvider>
    ),
  ],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
