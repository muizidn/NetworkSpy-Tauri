import { Meta, StoryFn, StoryObj } from "@storybook/react";
import { ResponseTab } from "@src/packages/bottom-pane/ResponseTab";
import { TrafficListContext } from "@src/packages/main-content/context/TrafficList";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { trafficListContextStateMock } from "./mock/TrafficListContextStateMock";
import response_pair_data_json from "./mock/response_pair_data.json";

const meta: Meta<typeof ResponseTab> = {
  title: "App/Components/ResponseTab",
  component: ResponseTab,
  args: {
    loadData: async (traffic) => {
      return response_pair_data_json;
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
