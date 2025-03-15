import { Meta, StoryFn, StoryObj } from "@storybook/react";
import {
  TrafficListContext,
} from "@src/packages/main-content/context/TrafficList";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { SelectionViewer } from "@src/packages/main-content/SelectionViewer";
import { trafficListContextStateMock } from "./mock/TrafficListContextStateMock";

const meta: Meta<typeof SelectionViewer> = {
  title: "App/Components/SelectionViewer",
  component: SelectionViewer,
  args: {},
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
