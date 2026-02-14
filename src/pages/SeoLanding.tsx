import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const SeoLanding = () => {
    const navigate = useNavigate();
    const [isBot, setIsBot] = useState(false);

    useEffect(() => {
        const userAgent = navigator.userAgent.toLowerCase();
        const botPatterns = [
            "googlebot",
            "bingbot",
            "slurp",
            "duckduckbot",
            "baiduspider",
            "yandexbot",
            "sogou",
            "exabot",
            "facebot",
            "ia_archiver",
        ];

        const isSearchBot = botPatterns.some((pattern) => userAgent.includes(pattern));

        if (!isSearchBot) {
            // Redirect humans to home
            navigate("/", { replace: true });
        } else {
            setIsBot(true);
        }
    }, [navigate]);

    if (!isBot) {
        // Return null or a loader while redirecting
        return null;
    }

    const structuredData = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "SoftwareApplication",
                "name": "Inkmax",
                "applicationCategory": "BusinessApplication",
                "operatingSystem": "Web, iOS, Android",
                "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD",
                },
                "description": "Inkmax is the ultimate link-in-bio tool designed for creators, maximizing your digital presence with a single link.",
                "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": "4.8",
                    "ratingCount": "1250",
                },
            },
            {
                "@type": "Organization",
                "name": "Inkmax",
                "url": "https://inkmax.com", // Replace with actual domain if different
                "logo": "https://inkmax.com/logo.png", // Replace with actual logo URL
                "sameAs": [
                    "https://www.instagram.com/inkmax",
                    "https://twitter.com/inkmax",
                    "https://www.linkedin.com/company/inkmax",
                ],
            },
            {
                "@type": "FAQPage",
                "mainEntity": [
                    {
                        "@type": "Question",
                        "name": "What is Inkmax?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Inkmax is a powerful link-in-bio tool that allows you to aggregate all your important links, social media profiles, and content into one customizable page.",
                        },
                    },
                    {
                        "@type": "Question",
                        "name": "Is Inkmax free to use?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Yes, Inkmax offers a comprehensive free plan that includes essential features for creators. Premium plans are available for advanced analytics and customization.",
                        },
                    },
                    {
                        "@type": "Question",
                        "name": "Can I customize my Inkmax page?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Absolutely! You can choose from various themes, customize colors, fonts, and button styles to match your brand identity perfectly.",
                        },
                    },
                ],
            },
        ],
    };

    return (
        <div className="prose max-w-none p-8 font-sans">
            <Helmet>
                <title>Inkmax - The Ultimate Link in Bio Tool for Creators & Businesses</title>
                <meta
                    name="description"
                    content="Maximize your reach with Inkmax. The best free link in bio tool for Instagram, TikTok, and social media. Create your custom page in minutes."
                />
                <meta name="keywords" content="link in bio, instagram bio link, bio link tool, inkmax, creator tools, social media marketing" />
                <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
            </Helmet>

            <header>
                <h1 className="text-4xl font-bold mb-4">Inkmax: Maximize Your Digital Impact</h1>
                <p className="text-xl mb-8">
                    The all-in-one link in bio solution trusted by creators, influencers, and businesses worldwide.
                </p>
            </header>

            <main>
                <article>
                    <section className="mb-12">
                        <h2 className="text-2xl font-semibold mb-4">Why Choose Inkmax?</h2>
                        <p className="mb-4">
                            In today's fragmented digital landscape, your audience is scattered across Instagram, TikTok, YouTube,
                            Twitter, and more. Inkmax brings them all together. With one simple link, you can direct your followers
                            to your latest video, your online store, your blog, and your other social profiles.
                        </p>
                        <ul className="list-disc pl-6 mb-4">
                            <li><strong>Centralized Hub:</strong> One link for all your content.</li>
                            <li><strong>Customizable Design:</strong> Reflect your personal brand with ease.</li>
                            <li><strong>Advanced Analytics:</strong> Understand your audience with detailed insights.</li>
                            <li><strong>Global Reach:</strong> Optimized for audiences in Kazakhstan, USA, Europe, and Asia.</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-semibold mb-4">Features Designed for Growth</h2>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-xl font-medium mb-2">Smart Links</h3>
                                <p>Redirect users based on their device or location. Perfect for app downloads and geo-specific campaigns.</p>
                            </div>
                            <div>
                                <h3 className="text-xl font-medium mb-2">Social Integrations</h3>
                                <p>Seamlessly embed YouTube videos, Spotify playlists, and tweets directly onto your Inkmax page.</p>
                            </div>
                            <div>
                                <h3 className="text-xl font-medium mb-2">Monetization</h3>
                                <p>Accept tips, sell digital products, and manage commissions directly through your bio link.</p>
                            </div>
                            <div>
                                <h3 className="text-xl font-medium mb-2">SEO Optimized</h3>
                                <p>Built with search engines in mind (AEO & GEO compatible) to help new followers find you organically.</p>
                            </div>
                        </div>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions (FAQ)</h2>
                        <dl className="space-y-4">
                            <div>
                                <dt className="font-bold">How do I create an Inkmax account?</dt>
                                <dd>Simply visit our homepage and sign up with your email or social media account. It takes less than a minute.</dd>
                            </div>
                            <div>
                                <dt className="font-bold">Can I use my own domain?</dt>
                                <dd>Yes, our Pro plan allows you to connect a custom domain for a fully branded experience.</dd>
                            </div>
                            <div>
                                <dt className="font-bold">Is Inkmax available in my language?</dt>
                                <dd>Inkmax supports multiple languages including English, Russian, and Kazakh, making it accessible to a global user base.</dd>
                            </div>
                        </dl>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">Start Your Journey with Inkmax</h2>
                        <p>
                            Join thousands of successful creators who use Inkmax to grow their brand.
                            Whether you are a musician, simplified writer, or a small business owner, Inkmax has the tools you need.
                        </p>
                    </section>
                </article>
            </main>

            <footer className="mt-12 pt-8 border-t border-gray-200">
                <p>&copy; {new Date().getFullYear()} Inkmax. All rights reserved.</p>
                <address className="not-italic mt-4">
                    Inkmax HQ<br />
                    Almaty, Kazakhstan<br />
                    <a href="mailto:support@inkmax.com" className="text-blue-600">support@inkmax.com</a>
                </address>
            </footer>
        </div>
    );
};

export default SeoLanding;
