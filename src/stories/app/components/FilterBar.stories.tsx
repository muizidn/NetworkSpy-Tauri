
import { FilterBar } from '@src/packages/filter-bar/FilterBar';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';


const meta = {
  title: 'App/Components/FilterBar',
  component: FilterBar,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
  },
} satisfies Meta<typeof FilterBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
  },
};
