/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    // Ensure static files are served correctly
    trailingSlash: false,
    async rewrites() {
        return [
            { source: '/index.html', destination: '/' },
            { source: '/login.html', destination: '/login' },
            { source: '/admin.html', destination: '/admin' },
            { source: '/statistics.html', destination: '/statistics' },
            { source: '/superadmin.html', destination: '/superadmin' },
        ];
    },
    // Add headers for better image handling
    async headers() {
        return [
            {
                source: '/images/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
        ];
    },
    // Ensure images are optimized
    images: {
        unoptimized: false,
    },
};

export default nextConfig;
