import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  sassOptions: {
    implementation: "sass",
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
