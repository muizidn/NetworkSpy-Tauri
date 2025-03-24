import type { Meta, StoryObj } from "@storybook/react";
import CertificateInstallerDev from "@src/routes/certificate-installer/development";

const meta: Meta<typeof CertificateInstallerDev> = {
  title: "Components/CertificateInstallerDev",
  component: CertificateInstallerDev,
  argTypes: {},
  parameters: {
    backgrounds: {
      default: "dark",
    },
  },
};

export default meta;

type Story = StoryObj<typeof CertificateInstallerDev>;

export const Default: Story = {
  args: {},
};
