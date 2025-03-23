// Button.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import React, { useEffect } from "react";
import Button from "./Button";

const meta: Meta<typeof Button> = {
  title: "Atoms/Button",
  component: Button,
  argTypes: {
    label: { control: "text" },
  },
  parameters: {
    backgrounds: {
      default: "dark",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    label: "Button",
  },
};
