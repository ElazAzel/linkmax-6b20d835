import { Metadata } from 'next';
import LandingClient from './LandingClient';

export const metadata: Metadata = {
    title: 'LinkMAX - Build pages that convert',
    description: 'The all-in-one platform for creators. AI builds the structure, you get the leads.',
    openGraph: {
        title: 'LinkMAX - AI Page Builder',
        description: 'The all-in-one platform for creators. AI builds the structure, you get the leads.',
        images: ['https://lnkmx.my/og-image.png'],
        type: 'website',
    },
};

export default function Home() {
    return <LandingClient />;
}
