import { Metadata } from 'next';
import LandingClient from './LandingClient';

export const metadata: Metadata = {
    title: 'lnkmx.my - Build pages that convert',
    description: 'The all-in-one platform for creators. AI builds the structure, you get the leads.',
    openGraph: {
        title: 'lnkmx.my - AI Page Builder',
        description: 'The all-in-one platform for creators. AI builds the structure, you get the leads.',
        images: ['https://lnkmx.my/og-image.png'],
        type: 'website',
    },
};

export default function Home() {
    return <LandingClient />;
}
