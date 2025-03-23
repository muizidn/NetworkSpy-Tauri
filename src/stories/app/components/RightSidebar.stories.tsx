import { RightSidebar } from '@src/packages/sidebar/RightSidebar';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';


const meta = {
  title: 'Components/RightSidebar',
  component: RightSidebar,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
  },
} satisfies Meta<typeof RightSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
  },
};
