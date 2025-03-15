import { Meta, StoryFn, StoryObj } from "@storybook/react";
import { TrafficListContext } from "@src/packages/main-content/context/TrafficList";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { LeftSidebar } from "@src/packages/sidebar/LeftSidebar";
import { trafficListContextStateMock } from "./mock/TrafficListContextStateMock";

const meta: Meta<typeof LeftSidebar> = {
  title: "App/Components/LeftSidebar",
  component: LeftSidebar,
  args: {},
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
