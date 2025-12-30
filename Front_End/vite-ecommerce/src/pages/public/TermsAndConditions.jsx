import React from 'react';

const TermsAndConditions = () => {
    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <h1 className="text-4xl font-bold text-text-main dark:text-white mb-8">Terms & Conditions</h1>

            <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
                <p className="text-text-secondary dark:text-gray-400">
                    By accessing or using InatGebeya, you agree to comply with and be bound by the following
                    terms and conditions. Please read them carefully.
                </p>

                <section>
                    <h2 className="text-2xl font-semibold text-text-main dark:text-gray-200 mb-4">User Conduct</h2>
                    <p className="text-text-secondary dark:text-gray-400">
                        Users must provide accurate information when creating an account. Any fraudulent activity or
                        violation of our community guidelines will lead to immediate account suspension.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold text-text-main dark:text-gray-200 mb-4">Marketplace Rules</h2>
                    <p className="text-text-secondary dark:text-gray-400">
                        InatGebeya provides a platform for sellers and buyers. While we strive to ensure the quality
                        of listings, we are not responsible for disputes between users, though we may assist in
                        resolution when possible.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold text-text-main dark:text-gray-200 mb-4">Payments & Fees</h2>
                    <p className="text-text-secondary dark:text-gray-400">
                        All prices are listed in ETB. Fees for shipping and platform services are clearly displayed at
                        checkout. Payments must be made through our approved secure methods.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold text-text-main dark:text-gray-200 mb-4">Intellectual Property</h2>
                    <p className="text-text-secondary dark:text-gray-400">
                        The content on InatGebeya, including logos, text, and graphics, is the property of InatGebeya
                        or its licensors and is protected by copyright laws.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold text-text-main dark:text-gray-200 mb-4">Modifications</h2>
                    <p className="text-text-secondary dark:text-gray-400">
                        We reserve the right to update these terms at any time. Continued use of the platform after
                        changes constitutes acceptance of the new terms.
                    </p>
                </section>
            </div>
        </div>
    );
};

export default TermsAndConditions;
