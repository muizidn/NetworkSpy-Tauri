import type { Meta, StoryObj } from "@storybook/react";
import CertificateInstallerVM from "@src/routes/certificate-installer/computer";

const meta: Meta<typeof CertificateInstallerVM> = {
  title: "Components/CertificateInstallerVM",
  component: CertificateInstallerVM,
  argTypes: {},
  parameters: {
    backgrounds: {
      default: "dark",
    },
  },
};

export default meta;

type Story = StoryObj<typeof CertificateInstallerVM>;

export const Default: Story = {
  args: {},
};
