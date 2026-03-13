import { Meta, StoryObj } from "@storybook/react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TauriEnvProvider } from "@src/packages/app-env";
import { MockAppProvider } from "@src/packages/app-env/AppProvider";
import Diffing from "@src/routes/tools/Diffing/Diffing";

const meta: Meta<typeof Diffing> = {
  title: "Components/ToolsDiffing",
  component: Diffing,
  decorators: [
    (Story, context) => (
      <DndProvider backend={HTML5Backend}>
        <TauriEnvProvider provider={new MockAppProvider()}>
          <div
            style={{
              height: `600px`,
              width: `1000px`,
            }}
          >
            <Story />
          </div>
        </TauriEnvProvider>
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
