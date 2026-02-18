import { Metadata } from 'next';
import DashboardClient from '../DashboardClient';

export const metadata: Metadata = {
    title: 'lnkmx.my Dashboard',
    robots: {
        index: false,
        follow: false,
    },
};

export default function DashboardPage() {
    return <DashboardClient />;
}
