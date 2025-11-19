import React from 'react';

interface SectionProps {
    children: React.ReactNode;
    isVisible?: boolean;
    extraClasses?: string;
}

const Section: React.FC<SectionProps> = ({ children, isVisible = true, extraClasses = '' }) => {
    const visibilityClasses = isVisible ? 'max-h-[5000px] opacity-100 py-12' : 'max-h-0 opacity-0 overflow-hidden py-0';

    return (
        <section className={`transition-all duration-1000 ease-in-out ${visibilityClasses} ${extraClasses}`}>
            {children}
        </section>
    );
};

export default Section;