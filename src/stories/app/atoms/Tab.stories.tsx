import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import Tab from './Tab';

const meta: Meta<typeof Tab> = {
  title: 'Atoms/Tab',
  component: Tab,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    onClose: { action: 'closed' }, // Action logger for tab close
  },
};

export default meta;
type Story = StoryObj<typeof Tab>;

export const Default: Story = {
  render: (args) => {
    const [currentTab, setCurrentTab] = useState('tab1');

    return (
      <div className="flex">
        {[
          { id: 'tab1', title: 'Tab 1' },
          { id: 'tab2', title: 'Tab 2' },
          { id: 'tab3', title: 'Tab 3' },
        ].map((tab) => (
          <Tab
            key={tab.id}
            id={tab.id}
            title={tab.title}
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            onClose={args.onClose}
          />
        ))}
      </div>
    );
  },
};
