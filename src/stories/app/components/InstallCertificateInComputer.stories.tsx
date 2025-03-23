import type { Meta, StoryObj } from "@storybook/react";
import CertificateInstallerComputer from "@src/routes/certificate-installer/computer";

const meta: Meta<typeof CertificateInstallerComputer> = {
  title: "Components/CertificateInstallerComputer",
  component: CertificateInstallerComputer,
  argTypes: {},
  parameters: {
    backgrounds: {
      default: "dark",
    },
  },
};

export default meta;

type Story = StoryObj<typeof CertificateInstallerComputer>;

export const Default: Story = {
  args: {},
};
