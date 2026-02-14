import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export const metadata: Metadata = {
    title: {
        default: 'LinkMAX - AI-Powered Link-in-Bio',
        template: '%s | LinkMAX',
    },
    description: 'The Micro-Business Operating System. Create your perfect link-in-bio page with AI.',
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://lnkmx.my'),
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: 'https://lnkmx.my',
        siteName: 'LinkMAX',
        title: 'LinkMAX - AI-Powered Link-in-Bio',
        description: 'The Micro-Business Operating System. Create your perfect link-in-bio page with AI.',
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: 'LinkMAX Platform',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'LinkMAX - AI-Powered Link-in-Bio',
        description: 'The Micro-Business Operating System. Create your perfect link-in-bio page with AI.',
        images: ['/og-image.png'],
        creator: '@lnkmx_app',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    verification: {
        google: 'google-site-verification-code', // To be replaced with actual code
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
