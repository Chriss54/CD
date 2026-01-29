'use client';

import { useState, useEffect, ReactNode } from 'react';

interface StickyHeaderWrapperProps {
    header: ReactNode;
    nav: ReactNode;
}

export function StickyHeaderWrapper({ header, nav }: StickyHeaderWrapperProps) {
    const [hideNav, setHideNav] = useState(false);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Hide nav when scrolled down more than 100px
            if (currentScrollY > 100) {
                setHideNav(true);
            } else {
                setHideNav(false);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    return (
        <div className="sticky top-0 z-50 bg-white">
            {/* Header - always visible */}
            {header}

            {/* Nav - hides when scrolled */}
            <div
                className={`
          transition-all duration-300 ease-in-out overflow-hidden
          ${hideNav ? 'max-h-0 opacity-0' : 'max-h-16 opacity-100'}
        `}
            >
                {nav}
            </div>
        </div>
    );
}
