import { Meta, StoryFn, StoryObj } from "@storybook/react";
import { ResponseTab } from "@src/packages/bottom-pane/ResponseTab";
import {
  TrafficListContext,
  TrafficListContextState,
} from "@src/packages/main-content/context/TrafficList";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { trafficListContextStateMock } from "./mock/TrafficListContextStateMock";

const meta: Meta<typeof ResponseTab> = {
  title: "App/Components/ResponseTab",
  component: ResponseTab,
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
