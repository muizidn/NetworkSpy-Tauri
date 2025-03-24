import { Meta, StoryObj } from "@storybook/react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TauriEnvContext } from "@src/packages/tauri-env";
import { mockInvoke } from "./mock/mockInvoke";
import Logging from "@src/routes/tools/Logging/Logging";

const meta: Meta<typeof Logging> = {
  title: "Components/ToolsLogging",
  component: Logging,
  decorators: [
    (Story, context) => (
      <DndProvider backend={HTML5Backend}>
        <TauriEnvContext.Provider value={{ invoke: mockInvoke }}>
          <div
            style={{
              height: `600px`,
              width: `1000px`,
            }}
          >
            <Story />
          </div>
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
  args: {},
};
