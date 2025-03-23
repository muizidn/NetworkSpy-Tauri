import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

const meta: Meta = {
  title: 'Components/ToolsTag',
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj;

export const NotImplemented: Story = {
  render: () => (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-center text-lg">Implement this!</p>
    </div>
  ),
};
