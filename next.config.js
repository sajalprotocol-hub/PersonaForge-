/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        // M-9 FIX: Use remotePatterns instead of deprecated domains
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            },
            {
                protocol: 'https',
                hostname: 'firebasestorage.googleapis.com',
            },
        ],
    },
    experimental: {
        serverComponentsExternalPackages: ['openai', 'pdf-parse'],
    },
    webpack: (config) => {
        // pdfjs-dist tries to require('canvas') in Node — tell webpack to ignore it
        config.resolve.alias.canvas = false;
        return config;
    },
};

module.exports = nextConfig;
