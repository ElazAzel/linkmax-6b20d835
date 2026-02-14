/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // Map Vite environment variables for Next.js compatibility
    env: {
        NEXT_PUBLIC_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**', // Allow all for user content
            },
        ],
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
};

export default nextConfig;
