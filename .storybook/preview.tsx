import type { Preview } from "@storybook/react";
import "@src/styles.css";
import React from "react";

// Define a decorator to apply the selected theme
const withThemeProvider = (Story: () => JSX.Element, context: any) => {
  const theme = context.globals.theme || 'macos'; // Default to 'macos' theme

  // Apply the selected theme by setting a data attribute or class
  document.documentElement.setAttribute('data-theme', theme);

  return <Story />;
};

const preview: Preview = {
  decorators: [withThemeProvider],
  parameters: {
    backgrounds: {
      values: [
        { name: "Dark", value: "#333" },
        { name: "Light", value: "#F7F9F2" },
        { name: "Maroon", value: "#400" },
      ],
      default: "dark",
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Global theme for components',
      defaultValue: 'macos',
      toolbar: {
        icon: 'paintbrush',
        items: [
          { value: 'macos', title: 'MacOS' },
          { value: 'windows', title: 'Windows' },
          { value: 'ubuntu', title: 'Ubuntu' },
        ],
        showName: true,
      },
    },
  },
};

export default preview;