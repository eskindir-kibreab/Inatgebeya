import React from 'react';

const AboutUs = () => {
    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <h1 className="text-4xl font-bold text-text-main dark:text-white mb-8">About InatGebeya</h1>

            <div className="prose prose-lg dark:prose-invert max-w-none">
                <p className="text-lg text-text-secondary dark:text-gray-300 mb-6">
                    Welcome to InatGebeya, Ethiopia's premier online marketplace. We are dedicated to connecting local artisans,
                    sellers, and traditional manufacturers with customers who appreciate authentic Ethiopian products.
                </p>

                <section className="mb-12">
                    <h2 className="text-2xl font-semibold text-text-main dark:text-gray-200 mb-4">Our Mission</h2>
                    <p className="text-text-secondary dark:text-gray-400">
                        To empower local businesses and celebrate Ethiopian heritage by providing a modern, secure, and
                        efficient platform for commerce. We believe in the power of tradition combined with the efficiency
                        of technology.
                    </p>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-border-default dark:border-gray-700">
                        <h3 className="text-xl font-bold text-primary mb-2">Authenticity</h3>
                        <p className="text-sm text-text-secondary dark:text-gray-400">
                            Verified products that represent the true heart of Ethiopia.
                        </p>
                    </div>
                    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-border-default dark:border-gray-700">
                        <h3 className="text-xl font-bold text-primary mb-2">Empowerment</h3>
                        <p className="text-sm text-text-secondary dark:text-gray-400">
                            Supporting local sellers to reach a wider audience.
                        </p>
                    </div>
                    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-border-default dark:border-gray-700">
                        <h3 className="text-xl font-bold text-primary mb-2">Innovation</h3>
                        <p className="text-sm text-text-secondary dark:text-gray-400">
                            Leveraging technology to bridge the gap in our marketplace.
                        </p>
                    </div>
                </div>

                <section>
                    <h2 className="text-2xl font-semibold text-text-main dark:text-gray-200 mb-4">Our Journey</h2>
                    <p className="text-text-secondary dark:text-gray-400">
                        Started with a vision and now growing into a vibrant community, InatGebeya is more than just an
                        e-commerce site—it's a celebration of culture and community.
                    </p>
                </section>
            </div>
        </div>
    );
};

export default AboutUs;
