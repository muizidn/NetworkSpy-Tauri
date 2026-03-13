import { Meta, StoryObj } from "@storybook/react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TauriEnvProvider } from "@src/packages/app-env";
import { MockAppProvider } from "@src/packages/app-env/AppProvider";
import Tag from "@src/routes/tools/Tag/Tag";

const meta: Meta<typeof Tag> = {
  title: "Components/ToolsTag",
  component: Tag,
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
