// TextField.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import TextField from "./TextField";

const meta: Meta<typeof TextField> = {
  title: "Atoms/TextField",
  component: TextField,
  argTypes: {
    value: { control: "text" },
    placeholder: { control: "text" },
  },
  parameters: {
    backgrounds: { disable: true },
  },
};

export default meta;
type Story = StoryObj<typeof TextField>;

const Template: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value || "");

    return (
      <div className="max-w-xs mx-auto">
        <TextField {...args} value={value} onChange={setValue} />
      </div>
    );
  },
};

export const Default: Story = {
  ...Template,
  args: {
    placeholder: "Enter text...",
  },
};
