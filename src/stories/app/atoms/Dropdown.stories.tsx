import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import Dropdown from "./Dropdown";

const meta: Meta<typeof Dropdown> = {
  title: "Atoms/Dropdown",
  component: Dropdown,
  argTypes: {
    options: { control: "object" },
    selectedOption: { control: 'text' },
  },
  parameters: {
    backgrounds: {
      default: "dark",
    },
  },
};

export default meta;

type Story = StoryObj<typeof Dropdown>;

export const Default: Story = {
  render: (args) => {
    const [selectedOption, setSelectedOption] = useState(args.selectedOption);
    return <Dropdown {...args} selectedOption={selectedOption} onChange={setSelectedOption} />;
  },
  args: {
    options: ["Option 1", "Option 2", "Option 3"],
    selectedOption: "Option 1",
  },
};
