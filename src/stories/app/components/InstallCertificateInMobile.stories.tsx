import type { Meta, StoryObj } from "@storybook/react";
import CertificateInstallerMobile from "@src/routes/certificate-installer/mobile";

const meta: Meta<typeof CertificateInstallerMobile> = {
  title: "Components/CertificateInstallerMobile",
  component: CertificateInstallerMobile,
  argTypes: {},
  parameters: {
    backgrounds: {
      default: "dark",
    },
  },
};

export default meta;

type Story = StoryObj<typeof CertificateInstallerMobile>;

export const Default: Story = {
  args: {},
};
