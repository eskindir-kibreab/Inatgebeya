import React from 'react';

const PrivacyPolicy = () => {
    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <h1 className="text-4xl font-bold text-text-main dark:text-white mb-8">Privacy Policy</h1>

            <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
                <section>
                    <h2 className="text-2xl font-semibold text-text-main dark:text-gray-200 mb-4">Introduction</h2>
                    <p className="text-text-secondary dark:text-gray-400">
                        At InatGebeya, we take your privacy seriously. This policy explains how we collect, use, and
                        protect your personal information when you use our marketplace.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold text-text-main dark:text-gray-200 mb-4">Information We Collect</h2>
                    <ul className="list-disc pl-6 text-text-secondary dark:text-gray-400 space-y-2">
                        <li><strong>Personal Info:</strong> Name, email address, and phone number when you register.</li>
                        <li><strong>Delivery Info:</strong> Shipping address for processing your orders.</li>
                        <li><strong>Payment Info:</strong> We use secure providers to handle transaction details.</li>
                        <li><strong>Device Info:</strong> IP address and browser type for security and site optimization.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold text-text-main dark:text-gray-200 mb-4">How We Use Your Data</h2>
                    <p className="text-text-secondary dark:text-gray-400">
                        We use your information to facilitate orders, improve our services, and communicate important
                        updates. We never sell your personal data to third parties.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold text-text-main dark:text-gray-200 mb-4">Data Security</h2>
                    <p className="text-text-secondary dark:text-gray-400">
                        We implement industry-standard security measures to protect your data. Your connection to InatGebeya
                        is always encrypted, and we prioritize the safety of your personal information.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold text-text-main dark:text-gray-200 mb-4">Your Rights</h2>
                    <p className="text-text-secondary dark:text-gray-400">
                        You have the right to access, correct, or delete your personal information at any time through your
                        account settings or by contacting our support team.
                    </p>
                </section>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
