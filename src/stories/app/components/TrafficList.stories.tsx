import { Meta, StoryObj } from "@storybook/react";
import { TrafficListContext } from "@src/packages/main-content/context/TrafficList";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TrafficList } from "@src/packages/main-content/TrafficList";
import { TauriEnvContext } from "@src/packages/tauri-env";
import { trafficListContextStateMock } from "./mock/TrafficListContextStateMock";
import { mockInvoke } from "./mock/mockInvoke";

const meta: Meta<typeof TrafficList> = {
  title: "App/Components/TrafficList",
  component: TrafficList,
  decorators: [
    (Story, context) => (
      <DndProvider backend={HTML5Backend}>
        <TauriEnvContext.Provider value={{ invoke: mockInvoke }}>
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
        </TauriEnvContext.Provider>
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
  args: {
    
  },
};
