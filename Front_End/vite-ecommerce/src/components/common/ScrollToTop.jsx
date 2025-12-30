import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
    const { pathname, search } = useLocation();

    useEffect(() => {
        // Disable browser's automatic scroll restoration to ensure we always start at top
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
        }
    }, []);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname, search]);

    return null;
};

export default ScrollToTop;
