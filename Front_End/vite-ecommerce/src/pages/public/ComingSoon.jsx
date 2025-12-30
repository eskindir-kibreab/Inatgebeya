import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { ROLES } from '../../utils/constants';

const ComingSoon = () => {
    const { role } = useAuth();

    const renderContent = () => {
        switch (role) {
            case ROLES.ADMIN:
            case ROLES.SUPER_ADMIN:
                return (
                    <>
                        <div className="text-6xl mb-6">🧰</div>
                        <h1 className="text-3xl font-bold text-text-main dark:text-gray-200 mb-4">
                            Admin Module Coming Soon
                        </h1>
                        <p className="text-lg text-text-secondary dark:text-gray-400 mb-8 max-w-md mx-auto">
                            We’re preparing this admin feature to improve system management.
                            <br />
                            It will be available shortly.
                        </p>
                        <Link
                            to="/admin/dashboard"
                            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium"
                        >
                            Back to Dashboard
                        </Link>
                    </>
                );

            case ROLES.SHOP_OWNER:
                return (
                    <>
                        <div className="text-6xl mb-6">🏪</div>
                        <h1 className="text-3xl font-bold text-text-main dark:text-gray-200 mb-4">
                            Store Tools Coming Soon
                        </h1>
                        <p className="text-lg text-text-secondary dark:text-gray-400 mb-8 max-w-md mx-auto">
                            New features are being added to help you manage your shop more easily.
                            <br />
                            Please check back soon.
                        </p>
                        <Link
                            to="/shop-owner/dashboard"
                            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium"
                        >
                            Back to Dashboard
                        </Link>
                    </>
                );

            case ROLES.DELIVERY_PERSON:
                return (
                    <>
                        <div className="text-6xl mb-6">🚚</div>
                        <h1 className="text-3xl font-bold text-text-main dark:text-gray-200 mb-4">
                            Delivery Features Coming Soon
                        </h1>
                        <p className="text-lg text-text-secondary dark:text-gray-400 mb-8 max-w-md mx-auto">
                            We’re improving delivery tools for a smoother experience.
                            <br />
                            This feature will be ready soon.
                        </p>
                        <Link
                            to="/delivery-person/dashboard"
                            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium"
                        >
                            Back to Dashboard
                        </Link>
                    </>
                );

            default:
                return (
                    <>
                        <div className="text-6xl mb-6">⏳</div>
                        <h1 className="text-3xl font-bold text-text-main dark:text-gray-200 mb-4">
                            Coming Soon
                        </h1>
                        <p className="text-lg text-text-secondary dark:text-gray-400 mb-8 max-w-md mx-auto">
                            This feature will be available in a few days.
                            <br />
                            Enjoy our services while we get it ready!
                        </p>
                        <Link
                            to="/"
                            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium"
                        >
                            Explore Products
                        </Link>
                    </>
                );
        }
    };

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
            {renderContent()}
        </div>
    );
};

export default ComingSoon;
