import { useState, useEffect } from 'react';

/**
 * Returns true while the viewport matches the given CSS media query.
 * Recalculates on every resize so the result is always in sync.
 *
 * Example: useMediaQuery('(min-width: 768px)')
 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState<boolean>(
        () => (globalThis as typeof globalThis & { matchMedia?: (q: string) => MediaQueryList }).matchMedia?.(query)?.matches ?? false
    );

    useEffect(() => {
        const mql = (globalThis as typeof globalThis & { matchMedia?: (q: string) => MediaQueryList }).matchMedia?.(query);
        if (!mql) {
            return;
        }
        const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
        mql.addEventListener('change', handler);
        return () => mql.removeEventListener('change', handler);
    }, [query]);

    return matches;
}
