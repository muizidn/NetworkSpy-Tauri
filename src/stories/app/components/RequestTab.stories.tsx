import { Meta, StoryFn, StoryObj } from "@storybook/react";
import { RequestTab } from "@src/packages/bottom-pane/RequestTab";
import {
  TrafficListContext,
} from "@src/packages/main-content/context/TrafficList";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { trafficListContextStateMock } from "./mock/TrafficListContextStateMock";

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
        <TrafficListContext.Provider value={trafficListContextStateMock}>
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
