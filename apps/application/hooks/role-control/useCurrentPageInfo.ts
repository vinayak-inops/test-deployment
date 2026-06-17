import { useMemo } from 'react';

// Interface for the page information object
export interface CurrentPageInfo {
    fullUrl: string;
    pathname: string;
    searchParams: string;
    hash: string;
    pageName: string;
    organizationType: string;
    mode: string;
    isClient: boolean;
}

/**
 * Custom hook to get current running URL and page information
 * @returns CurrentPageInfo object with URL details and page context
 */
export const useCurrentPageInfo = (): CurrentPageInfo => {
    return useMemo(() => {
        if (typeof window === 'undefined') {
            return {
                fullUrl: '',
                pathname: '',
                searchParams: '',
                hash: '',
                pageName: '',
                organizationType: '',
                mode: '',
                isClient: false
            };
        }

        const fullUrl = window.location.href;
        const pathname = window.location.pathname;
        const searchParams = window.location.search;
        const hash = window.location.hash;
        
        // Extract page information
        const pathSegments = pathname.split('/').filter(Boolean);
        const pageName = pathSegments[pathSegments.length - 1] || 'home';
        const organizationType = pathSegments[pathSegments.length - 2] || '';
        
        // Extract mode from search params
        const urlParams = new URLSearchParams(searchParams);
        const mode = urlParams.get('mode') || '';

        return {
            fullUrl,
            pathname,
            searchParams,
            hash,
            pageName,
            organizationType,
            mode,
            isClient: true
        };
    }, []);
};

export default useCurrentPageInfo;