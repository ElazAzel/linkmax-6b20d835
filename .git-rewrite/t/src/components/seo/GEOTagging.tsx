import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface GEOTaggingProps {
    latitude?: number;
    longitude?: number;
    region?: string;
    placename?: string;
    includeOrganization?: boolean;
}

/**
 * Geographic Meta Tags Component
 * Adds geographic targeting meta tags and LocalBusiness schema
 */
export function GEOTagging({
    latitude = 43.2220,
    longitude = 76.8512,
    region = 'KZ-ALA',
    placename = 'Almaty, Kazakhstan',
    includeOrganization = true,
}: GEOTaggingProps) {
    const { t, i18n } = useTranslation();

    useEffect(() => {
        const setMetaTag = (name: string, content: string) => {
            let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;

            if (!meta) {
                meta = document.createElement('meta');
                meta.setAttribute('name', name);
                document.head.appendChild(meta);
            }
            meta.content = content;
        };

        // Geographic meta tags
        setMetaTag('geo.region', region);
        setMetaTag('geo.placename', placename);
        setMetaTag('geo.position', `${latitude};${longitude}`);
        setMetaTag('ICBM', `${latitude}, ${longitude}`);

        // LocalBusiness Schema
        if (includeOrganization) {
            let schema = document.querySelector('script#geo-organization-schema');
            if (!schema) {
                schema = document.createElement('script');
                schema.setAttribute('type', 'application/ld+json');
                schema.id = 'geo-organization-schema';
                document.head.appendChild(schema);
            }

            const organizationSchema = {
                '@context': 'https://schema.org',
                '@type': 'LocalBusiness',
                name: 'lnkmx',
                description: t('seo.organization.description', 'AI-powered link in bio and mini-landing page builder'),
                url: 'https://lnkmx.my',
                logo: 'https://lnkmx.my/favicon.png',
                image: 'https://lnkmx.my/favicon.jpg',
                telephone: '+77051097664',
                email: 'admin@lnkmx.my',
                address: {
                    '@type': 'PostalAddress',
                    streetAddress: t('seo.organization.street', 'Sholokhov St., 20/7'),
                    addressLocality: 'Almaty',
                    addressRegion: 'Almaty Region',
                    postalCode: '050000',
                    addressCountry: 'KZ',
                },
                geo: {
                    '@type': 'GeoCoordinates',
                    latitude: latitude,
                    longitude: longitude,
                },
                openingHoursSpecification: {
                    '@type': 'OpeningHoursSpecification',
                    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                    opens: '09:00',
                    closes: '18:00',
                },
                sameAs: [
                    'https://www.instagram.com/lnkmx_app',
                    'https://t.me/lnkmx_support',
                ],
                priceRange: '$$',
                paymentAccepted: 'Cash, Credit Card, Cryptocurrency',
                currenciesAccepted: 'KZT, USD',
            };

            schema.textContent = JSON.stringify(organizationSchema);
        }

        return () => {
            // Cleanup on unmount
            const schema = document.querySelector('script#geo-organization-schema');
            if (schema) {
                schema.remove();
            }
        };
    }, [latitude, longitude, region, placename, includeOrganization, t, i18n.language]);

    return null;
}
