import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    webpack(config, options) {
        config.experiments = { asyncWebAssembly: true };
        return config;
    },
};

export default nextConfig;
